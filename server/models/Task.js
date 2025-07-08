// TaskAuction/server/models/Task.js
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Task description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["Academic", "Campus Life", "Tech Help", "Personal", "Other"],
        message:
          "Category must be one of: Academic, Campus Life, Tech Help, Personal, Other",
      },
    },
    budget: {
      min: {
        type: Number,
        required: [true, "Minimum budget is required"],
        min: [50, "Minimum budget must be at least ₹50"],
        max: [2000, "Minimum budget cannot exceed ₹2000"],
      },
      max: {
        type: Number,
        required: [true, "Maximum budget is required"],
        min: [50, "Maximum budget must be at least ₹50"],
        max: [2000, "Maximum budget cannot exceed ₹2000"],
      },
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: "Deadline must be in the future",
      },
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
      },
    ],
    attachments: [
      {
        url: {
          type: String,
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
        originalName: {
          type: String,
          required: true,
        },
      },
    ],
    poster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task poster is required"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["Open", "Assigned", "In-Progress", "Completed", "Closed"],
        message:
          "Status must be one of: Open, Assigned, In-Progress, Completed, Closed",
      },
      default: "Open",
    },
    priority: {
      type: String,
      enum: {
        values: ["Low", "Medium", "High", "Urgent"],
        message: "Priority must be one of: Low, Medium, High, Urgent",
      },
      default: "Medium",
    },
    bidCount: {
      type: Number,
      default: 0,
    },
    acceptedBid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bid",
      default: null,
    },
    completionDate: {
      type: Date,
      default: null,
    },
    rating: {
      taskRating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      bidderRating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      review: {
        type: String,
        maxlength: [500, "Review cannot exceed 500 characters"],
        trim: true,
      },
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [30, "Tag cannot exceed 30 characters"],
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for days remaining
taskSchema.virtual("daysRemaining").get(function () {
  if (!this.deadline) return null;
  const today = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for budget range
taskSchema.virtual("budgetRange").get(function () {
  return `₹${this.budget.min} - ₹${this.budget.max}`;
});

// Indexes for search and performance
taskSchema.index({ poster: 1, createdAt: -1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ status: 1, deadline: 1 });
taskSchema.index({ category: 1, createdAt: -1 });
taskSchema.index({ "budget.min": 1, "budget.max": 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ tags: 1 });

// Text index for search
taskSchema.index({
  title: "text",
  description: "text",
  tags: "text",
});

// Pre-save middleware to validate budget range
taskSchema.pre("save", function (next) {
  if (this.budget.min > this.budget.max) {
    next(new Error("Minimum budget cannot be greater than maximum budget"));
  }

  // Set urgent flag based on deadline
  const now = new Date();
  const deadline = new Date(this.deadline);
  const hoursRemaining = (deadline - now) / (1000 * 60 * 60);
  this.isUrgent = hoursRemaining <= 24 && hoursRemaining > 0;

  next();
});

// Method to check if task can be edited
taskSchema.methods.canBeEdited = function () {
  return this.status === "Open" && this.bidCount === 0;
};

// Method to check if task can receive bids
taskSchema.methods.canReceiveBids = function () {
  return this.status === "Open" && this.deadline > new Date();
};

// Method to get task summary
taskSchema.methods.getSummary = function () {
  return {
    id: this._id,
    title: this.title,
    category: this.category,
    budgetRange: this.budgetRange,
    status: this.status,
    deadline: this.deadline,
    bidCount: this.bidCount,
    isUrgent: this.isUrgent,
  };
};

module.exports = mongoose.model("Task", taskSchema);
