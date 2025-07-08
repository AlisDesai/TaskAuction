// server/models/Bid.js
const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task reference is required"],
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Bidder reference is required"],
    },
    amount: {
      type: Number,
      required: [true, "Bid amount is required"],
      min: [50, "Bid amount must be at least ₹50"],
      max: [2000, "Bid amount cannot exceed ₹2000"],
    },
    proposedTimeline: {
      type: String,
      required: [true, "Proposed timeline is required"],
      trim: true,
      maxlength: [200, "Timeline cannot exceed 200 characters"],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: {
        values: ["Pending", "Accepted", "Rejected", "Withdrawn"],
        message:
          "Status must be one of: Pending, Accepted, Rejected, Withdrawn",
      },
      default: "Pending",
    },
    deliverables: [
      {
        type: String,
        trim: true,
        maxlength: [100, "Deliverable cannot exceed 100 characters"],
      },
    ],
    experience: {
      type: String,
      trim: true,
      maxlength: [500, "Experience description cannot exceed 500 characters"],
    },
    portfolio: [
      {
        title: {
          type: String,
          trim: true,
          maxlength: [100, "Portfolio title cannot exceed 100 characters"],
        },
        url: {
          type: String,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
          maxlength: [
            200,
            "Portfolio description cannot exceed 200 characters",
          ],
        },
      },
    ],
    isHighlighted: {
      type: Boolean,
      default: false,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    withdrawnAt: {
      type: Date,
      default: null,
    },
    autoWithdrawAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for time since bid
bidSchema.virtual("timeSinceBid").get(function () {
  const now = new Date();
  const diffTime = now - this.createdAt;
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else {
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  }
});

// Indexes for performance
bidSchema.index({ task: 1, createdAt: -1 });
bidSchema.index({ bidder: 1, createdAt: -1 });
bidSchema.index({ task: 1, bidder: 1 }, { unique: true }); // One bid per task per bidder
bidSchema.index({ status: 1, createdAt: -1 });
bidSchema.index({ amount: 1 });
bidSchema.index({ autoWithdrawAt: 1 });

// Pre-save middleware to validate bid amount against task budget
bidSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("amount")) {
    try {
      const Task = mongoose.model("Task");
      const task = await Task.findById(this.task);

      if (!task) {
        return next(new Error("Task not found"));
      }

      if (this.amount < task.budget.min || this.amount > task.budget.max) {
        return next(
          new Error(
            `Bid amount must be between ₹${task.budget.min} and ₹${task.budget.max}`
          )
        );
      }

      // Check if task can receive bids
      if (!task.canReceiveBids()) {
        return next(new Error("This task is no longer accepting bids"));
      }

      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Pre-save middleware to prevent duplicate bids
bidSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const existingBid = await this.constructor.findOne({
        task: this.task,
        bidder: this.bidder,
        status: { $ne: "Withdrawn" },
      });

      if (existingBid) {
        return next(new Error("You have already placed a bid on this task"));
      }

      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Post-save middleware to update task bid count
bidSchema.post("save", async function (doc) {
  try {
    const Task = mongoose.model("Task");
    const bidCount = await this.constructor.countDocuments({
      task: doc.task,
      status: { $in: ["Pending", "Accepted"] },
    });

    await Task.findByIdAndUpdate(doc.task, { bidCount });
  } catch (error) {
    console.error("Error updating task bid count:", error);
  }
});

// Post-remove middleware to update task bid count
bidSchema.post("remove", async function (doc) {
  try {
    const Task = mongoose.model("Task");
    const bidCount = await this.constructor.countDocuments({
      task: doc.task,
      status: { $in: ["Pending", "Accepted"] },
    });

    await Task.findByIdAndUpdate(doc.task, { bidCount });
  } catch (error) {
    console.error("Error updating task bid count:", error);
  }
});

// Method to check if bid can be edited
bidSchema.methods.canBeEdited = function () {
  return this.status === "Pending" && this.autoWithdrawAt > new Date();
};

// Method to check if bid can be withdrawn
bidSchema.methods.canBeWithdrawn = function () {
  return this.status === "Pending";
};

// Method to accept bid
bidSchema.methods.accept = function () {
  if (this.status !== "Pending") {
    throw new Error("Only pending bids can be accepted");
  }

  this.status = "Accepted";
  this.acceptedAt = new Date();
  return this.save();
};

// Method to reject bid
bidSchema.methods.reject = function () {
  if (this.status !== "Pending") {
    throw new Error("Only pending bids can be rejected");
  }

  this.status = "Rejected";
  this.rejectedAt = new Date();
  return this.save();
};

// Method to withdraw bid
bidSchema.methods.withdraw = function () {
  if (this.status !== "Pending") {
    throw new Error("Only pending bids can be withdrawn");
  }

  this.status = "Withdrawn";
  this.withdrawnAt = new Date();
  return this.save();
};

// Method to get bid summary
bidSchema.methods.getSummary = function () {
  return {
    id: this._id,
    amount: this.amount,
    proposedTimeline: this.proposedTimeline,
    status: this.status,
    timeSinceBid: this.timeSinceBid,
    isHighlighted: this.isHighlighted,
  };
};

module.exports = mongoose.model("Bid", bidSchema);
