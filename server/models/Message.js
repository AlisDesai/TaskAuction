// server/models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task reference is required"],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender reference is required"],
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Receiver reference is required"],
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    type: {
      type: String,
      enum: {
        values: ["text", "file", "image", "system"],
        message: "Message type must be one of: text, file, image, system",
      },
      default: "text",
    },
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
        fileSize: {
          type: Number,
          required: true,
        },
        mimeType: {
          type: String,
          required: true,
        },
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    originalContent: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: {
          type: String,
          required: true,
          enum: ["👍", "👎", "❤️", "😂", "😮", "😢", "😡"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    priority: {
      type: String,
      enum: {
        values: ["low", "normal", "high"],
        message: "Priority must be one of: low, normal, high",
      },
      default: "normal",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for time since message
messageSchema.virtual("timeSince").get(function () {
  const now = new Date();
  const diffTime = now - this.createdAt;
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
});

// Virtual for formatted timestamp
messageSchema.virtual("formattedTime").get(function () {
  return this.createdAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
});

// Indexes for performance
messageSchema.index({ task: 1, createdAt: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });
messageSchema.index({ task: 1, sender: 1, receiver: 1 });
messageSchema.index({ createdAt: -1 });

// Text index for search
messageSchema.index({
  content: "text",
});

// Pre-save middleware to validate sender and receiver
messageSchema.pre("save", async function (next) {
  if (this.sender.toString() === this.receiver.toString()) {
    return next(new Error("Sender and receiver cannot be the same"));
  }

  // Validate that both sender and receiver are involved in the task
  try {
    const Task = mongoose.model("Task");
    const task = await Task.findById(this.task);

    if (!task) {
      return next(new Error("Task not found"));
    }

    const senderIsInvolved =
      task.poster.toString() === this.sender.toString() ||
      (task.assignedTo &&
        task.assignedTo.toString() === this.sender.toString());

    const receiverIsInvolved =
      task.poster.toString() === this.receiver.toString() ||
      (task.assignedTo &&
        task.assignedTo.toString() === this.receiver.toString());

    if (!senderIsInvolved || !receiverIsInvolved) {
      return next(
        new Error("Only task poster and assigned bidder can exchange messages")
      );
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware for edit tracking
messageSchema.pre("save", function (next) {
  if (!this.isNew && this.isModified("content")) {
    this.isEdited = true;
    this.editedAt = new Date();
    if (!this.originalContent) {
      this.originalContent = this.content;
    }
  }
  next();
});

// Method to mark as read
messageSchema.methods.markAsRead = function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to soft delete
messageSchema.methods.softDelete = function (deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// Method to add reaction
messageSchema.methods.addReaction = function (userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(
    (reaction) => reaction.user.toString() !== userId.toString()
  );

  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji: emoji,
  });

  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function (userId) {
  this.reactions = this.reactions.filter(
    (reaction) => reaction.user.toString() !== userId.toString()
  );

  return this.save();
};

// Method to get conversation messages
messageSchema.statics.getConversation = function (
  taskId,
  limit = 50,
  skip = 0
) {
  return this.find({
    task: taskId,
    isDeleted: false,
  })
    .populate("sender", "firstName lastName avatar")
    .populate("receiver", "firstName lastName avatar")
    .populate("replyTo", "content sender")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Method to get unread count
messageSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({
    receiver: userId,
    isRead: false,
    isDeleted: false,
  });
};

// Method to get recent conversations
messageSchema.statics.getRecentConversations = function (userId, limit = 10) {
  return this.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { receiver: userId }],
        isDeleted: false,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: "$task",
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$receiver", userId] },
                  { $eq: ["$isRead", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: "tasks",
        localField: "_id",
        foreignField: "_id",
        as: "task",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "lastMessage.sender",
        foreignField: "_id",
        as: "sender",
      },
    },
    {
      $limit: limit,
    },
  ]);
};

module.exports = mongoose.model("Message", messageSchema);
