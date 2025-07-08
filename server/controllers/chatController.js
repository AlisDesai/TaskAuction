// server/controllers/chatController.js
const { validationResult } = require("express-validator");
const Message = require("../models/Message");
const Task = require("../models/Task");
const User = require("../models/User");
const { deleteFile } = require("../middleware/upload");

// @desc    Get conversation messages
// @route   GET /api/chat/task/:taskId
// @access  Private (Task participants only)
const getConversation = async (req, res) => {
  try {
    const { taskId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    // Verify task exists and user is participant
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if user is involved in the task
    const isParticipant =
      task.poster.toString() === req.user.id ||
      (task.assignedTo && task.assignedTo.toString() === req.user.id);

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this conversation",
      });
    }

    // Get messages
    const messages = await Message.getConversation(taskId, limit, skip);

    // Mark messages as read for the current user
    await Message.updateMany(
      {
        task: taskId,
        receiver: req.user.id,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // Get total count for pagination
    const total = await Message.countDocuments({
      task: taskId,
      isDeleted: false,
    });

    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalMessages: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };

    res.status(200).json({
      success: true,
      count: messages.length,
      pagination,
      data: messages.reverse(), // Reverse to show oldest first
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching conversation",
    });
  }
};

// @desc    Send message
// @route   POST /api/chat/task/:taskId
// @access  Private (Task participants only)
const sendMessage = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { taskId } = req.params;
    const { content, type = "text", replyTo, priority = "normal" } = req.body;

    // Verify task exists and get participants
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if user is involved in the task
    const isParticipant =
      task.poster.toString() === req.user.id ||
      (task.assignedTo && task.assignedTo.toString() === req.user.id);

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to send messages in this conversation",
      });
    }

    // Determine receiver
    let receiverId;
    if (task.poster.toString() === req.user.id) {
      // Sender is poster, receiver is assigned bidder
      if (!task.assignedTo) {
        return res.status(400).json({
          success: false,
          message: "No assigned bidder to send message to",
        });
      }
      receiverId = task.assignedTo;
    } else {
      // Sender is assigned bidder, receiver is poster
      receiverId = task.poster;
    }

    // Process attachments if any
    const attachments = [];
    if (req.fileInfo) {
      attachments.push({
        url: req.fileInfo.url,
        filename: req.fileInfo.filename,
        originalName: req.fileInfo.originalName,
        fileSize: req.fileInfo.fileSize,
        mimeType: req.fileInfo.mimeType,
      });
    }

    // Create message
    const message = await Message.create({
      task: taskId,
      sender: req.user.id,
      receiver: receiverId,
      content: content || "",
      type:
        attachments.length > 0
          ? attachments[0].mimeType.startsWith("image/")
            ? "image"
            : "file"
          : type,
      attachments,
      replyTo: replyTo || null,
      priority,
    });

    // Populate the message
    await message.populate([
      { path: "sender", select: "firstName lastName avatar" },
      { path: "receiver", select: "firstName lastName avatar" },
      { path: "replyTo", select: "content sender" },
    ]);

    // Emit real-time event via Socket.IO
    const io = req.app.get("io");
    if (io) {
      // Emit to task room
      io.to(`task_${taskId}`).emit("new_message", {
        taskId,
        message,
      });

      // Emit to receiver specifically for notifications
      io.to(`user_${receiverId}`).emit("notification", {
        type: "new_message",
        taskId,
        message: `New message from ${message.sender.firstName}`,
        data: message,
      });

      console.log(`📨 Message sent via Socket.IO to task_${taskId}`);
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Send message error:", error);

    // Clean up uploaded files on error
    if (req.file) {
      const { cleanupFiles } = require("../middleware/upload");
      cleanupFiles(req);
    }

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((val) => val.message)
        .join(", ");
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        details: message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error sending message",
    });
  }
};

// @desc    Edit message
// @route   PUT /api/chat/messages/:id
// @access  Private (Message sender only)
const editMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if user owns the message
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this message",
      });
    }

    // Check if message can be edited (within 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      return res.status(400).json({
        success: false,
        message: "Messages can only be edited within 15 minutes of sending",
      });
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { content } = req.body;

    // Store original content if this is the first edit
    if (!message.isEdited) {
      message.originalContent = message.content;
    }

    // Update message
    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    // Populate the message
    await message.populate([
      { path: "sender", select: "firstName lastName avatar" },
      { path: "receiver", select: "firstName lastName avatar" },
    ]);

    // Emit real-time event via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.to(`task_${message.task.toString()}`).emit("message_edited", {
        taskId: message.task.toString(),
        messageId: message._id,
        message,
      });

      console.log(`✏️ Message edited via Socket.IO for task_${message.task}`);
    }

    res.status(200).json({
      success: true,
      message: "Message edited successfully",
      data: message,
    });
  } catch (error) {
    console.error("Edit message error:", error);
    res.status(500).json({
      success: false,
      message: "Server error editing message",
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/chat/messages/:id
// @access  Private (Message sender only)
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if user owns the message
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this message",
      });
    }

    // Soft delete the message
    await message.softDelete(req.user.id);

    // Delete associated files
    for (const attachment of message.attachments) {
      const filePath = attachment.url.replace(
        `${req.protocol}://${req.get("host")}`,
        "."
      );
      await deleteFile(filePath);
    }

    // Emit real-time event via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.to(`task_${message.task.toString()}`).emit("message_deleted", {
        taskId: message.task.toString(),
        messageId: message._id,
      });

      console.log(`🗑️ Message deleted via Socket.IO for task_${message.task}`);
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting message",
    });
  }
};

// @desc    Add reaction to message
// @route   POST /api/chat/messages/:id/reaction
// @access  Private (Task participants only)
const addReaction = async (req, res) => {
  try {
    const { emoji } = req.body;

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Verify user is participant in the task
    const task = await Task.findById(message.task);
    const isParticipant =
      task.poster.toString() === req.user.id ||
      (task.assignedTo && task.assignedTo.toString() === req.user.id);

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to react to this message",
      });
    }

    // Validate emoji
    const allowedEmojis = ["👍", "👎", "❤️", "😂", "😮", "😢", "😡"];
    if (!allowedEmojis.includes(emoji)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emoji reaction",
      });
    }

    // Add reaction
    await message.addReaction(req.user.id, emoji);

    // Emit real-time event via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.to(`task_${message.task.toString()}`).emit("reaction_added", {
        taskId: message.task.toString(),
        messageId: message._id,
        emoji,
        userId: req.user.id,
        reactions: message.reactions,
      });

      console.log(`😀 Reaction added via Socket.IO for task_${message.task}`);
    }

    res.status(200).json({
      success: true,
      message: "Reaction added successfully",
      data: message.reactions,
    });
  } catch (error) {
    console.error("Add reaction error:", error);
    res.status(500).json({
      success: false,
      message: "Server error adding reaction",
    });
  }
};

// @desc    Remove reaction from message
// @route   DELETE /api/chat/messages/:id/reaction
// @access  Private (Task participants only)
const removeReaction = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Verify user is participant in the task
    const task = await Task.findById(message.task);
    const isParticipant =
      task.poster.toString() === req.user.id ||
      (task.assignedTo && task.assignedTo.toString() === req.user.id);

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to remove reaction from this message",
      });
    }

    // Remove reaction
    await message.removeReaction(req.user.id);

    // Emit real-time event via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.to(`task_${message.task.toString()}`).emit("reaction_removed", {
        taskId: message.task.toString(),
        messageId: message._id,
        userId: req.user.id,
        reactions: message.reactions,
      });

      console.log(`😐 Reaction removed via Socket.IO for task_${message.task}`);
    }

    res.status(200).json({
      success: true,
      message: "Reaction removed successfully",
      data: message.reactions,
    });
  } catch (error) {
    console.error("Remove reaction error:", error);
    res.status(500).json({
      success: false,
      message: "Server error removing reaction",
    });
  }
};

// @desc    Get recent conversations
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const conversations = await Message.getRecentConversations(
      req.user.id,
      limit
    );

    // Format the response
    const formattedConversations = conversations.map((conv) => ({
      task: conv.task[0],
      lastMessage: conv.lastMessage,
      unreadCount: conv.unreadCount,
      participant: conv.sender[0],
    }));

    res.status(200).json({
      success: true,
      count: formattedConversations.length,
      data: formattedConversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching conversations",
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/chat/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Message.getUnreadCount(req.user.id);

    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching unread count",
    });
  }
};

// @desc    Mark conversation as read
// @route   POST /api/chat/task/:taskId/mark-read
// @access  Private (Task participants only)
const markConversationAsRead = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Verify task exists and user is participant
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if user is involved in the task
    const isParticipant =
      task.poster.toString() === req.user.id ||
      (task.assignedTo && task.assignedTo.toString() === req.user.id);

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this conversation",
      });
    }

    // Mark all unread messages as read
    const result = await Message.updateMany(
      {
        task: taskId,
        receiver: req.user.id,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // Emit read status update via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.to(`task_${taskId}`).emit("conversation_read", {
        taskId,
        userId: req.user.id,
        markedCount: result.modifiedCount,
      });

      console.log(
        `📖 Conversation marked as read via Socket.IO for task_${taskId}`
      );
    }

    res.status(200).json({
      success: true,
      message: "Conversation marked as read",
      data: { markedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error("Mark conversation as read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error marking conversation as read",
    });
  }
};

// @desc    Search messages in conversation
// @route   GET /api/chat/task/:taskId/search
// @access  Private (Task participants only)
const searchMessages = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long",
      });
    }

    // Verify task exists and user is participant
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if user is involved in the task
    const isParticipant =
      task.poster.toString() === req.user.id ||
      (task.assignedTo && task.assignedTo.toString() === req.user.id);

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to search this conversation",
      });
    }

    // Search messages
    const messages = await Message.find({
      task: taskId,
      isDeleted: false,
      $text: { $search: q },
    })
      .populate("sender", "firstName lastName avatar")
      .populate("receiver", "firstName lastName avatar")
      .sort({ score: { $meta: "textScore" } })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error("Search messages error:", error);
    res.status(500).json({
      success: false,
      message: "Server error searching messages",
    });
  }
};

// @desc    Get message by ID
// @route   GET /api/chat/messages/:id
// @access  Private (Task participants only)
const getMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate("sender", "firstName lastName avatar")
      .populate("receiver", "firstName lastName avatar")
      .populate("replyTo", "content sender");

    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Verify user is participant in the task
    const task = await Task.findById(message.task);
    const isParticipant =
      task.poster.toString() === req.user.id ||
      (task.assignedTo && task.assignedTo.toString() === req.user.id);

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this message",
      });
    }

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Get message error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching message",
    });
  }
};

// @desc    Get chat statistics
// @route   GET /api/chat/stats
// @access  Private
const getChatStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get overall chat statistics
    const stats = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          messagesSent: {
            $sum: { $cond: [{ $eq: ["$sender", userId] }, 1, 0] },
          },
          messagesReceived: {
            $sum: { $cond: [{ $eq: ["$receiver", userId] }, 1, 0] },
          },
          filesShared: {
            $sum: {
              $cond: [{ $gt: [{ $size: "$attachments" }, 0] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Get active conversations count
    const activeConversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
          isDeleted: false,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
      },
      {
        $group: {
          _id: "$task",
        },
      },
      {
        $count: "activeConversations",
      },
    ]);

    // Get response time statistics
    const responseTimeStats = await Message.aggregate([
      {
        $match: {
          receiver: userId,
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "messages",
          let: { taskId: "$task", msgTime: "$createdAt" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$task", "$$taskId"] },
                    { $eq: ["$sender", userId] },
                    { $gt: ["$createdAt", "$$msgTime"] },
                  ],
                },
              },
            },
            { $sort: { createdAt: 1 } },
            { $limit: 1 },
          ],
          as: "response",
        },
      },
      {
        $match: {
          response: { $ne: [] },
        },
      },
      {
        $addFields: {
          responseTime: {
            $subtract: [
              { $arrayElemAt: ["$response.createdAt", 0] },
              "$createdAt",
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: "$responseTime" },
          minResponseTime: { $min: "$responseTime" },
          maxResponseTime: { $max: "$responseTime" },
        },
      },
    ]);

    const result = {
      general: stats[0] || {
        totalMessages: 0,
        messagesSent: 0,
        messagesReceived: 0,
        filesShared: 0,
      },
      activeConversations: activeConversations[0]?.activeConversations || 0,
      responseTime: responseTimeStats[0] || {
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
      },
    };

    // Convert response times from milliseconds to readable format
    if (result.responseTime.avgResponseTime) {
      result.responseTime.avgResponseTimeFormatted = formatDuration(
        result.responseTime.avgResponseTime
      );
      result.responseTime.minResponseTimeFormatted = formatDuration(
        result.responseTime.minResponseTime
      );
      result.responseTime.maxResponseTimeFormatted = formatDuration(
        result.responseTime.maxResponseTime
      );
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get chat stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching chat statistics",
    });
  }
};

// Helper function to format duration
const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

// @desc    Download chat file
// @route   GET /api/chat/files/:messageId/:filename
// @access  Private (Task participants only)
const downloadFile = async (req, res) => {
  try {
    const { messageId, filename } = req.params;

    const message = await Message.findById(messageId);

    if (!message || message.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Verify user is participant in the task
    const task = await Task.findById(message.task);
    const isParticipant =
      task.poster.toString() === req.user.id ||
      (task.assignedTo && task.assignedTo.toString() === req.user.id);

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to download this file",
      });
    }

    // Find the attachment
    const attachment = message.attachments.find(
      (att) => att.filename === filename
    );

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Get file path
    const filePath = attachment.url.replace(
      `${req.protocol}://${req.get("host")}`,
      "."
    );

    // Check if file exists
    const fs = require("fs");
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server",
      });
    }

    // Set appropriate headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${attachment.originalName}"`
    );
    res.setHeader("Content-Type", attachment.mimeType);

    // Send file
    res.sendFile(require("path").resolve(filePath));
  } catch (error) {
    console.error("Download file error:", error);
    res.status(500).json({
      success: false,
      message: "Server error downloading file",
    });
  }
};

// Socket.IO event handlers for real-time chat
const handleSocketEvents = (io) => {
  console.log("🔌 Setting up Socket.IO chat event handlers");

  io.on("connection", (socket) => {
    console.log(`👤 User connected: ${socket.id}`);

    // Handle user authentication
    socket.on("authenticate", (data) => {
      try {
        const { token, userId } = data;

        // Verify token here (you might want to use your auth middleware logic)
        if (token && userId) {
          socket.userId = userId;
          socket.join(`user_${userId}`);

          // Emit user online status
          socket.broadcast.emit("user_online", { userId });

          console.log(
            `✅ User ${userId} authenticated and joined personal room`
          );
        }
      } catch (error) {
        console.error("Authentication error:", error);
        socket.emit("auth_error", { message: "Authentication failed" });
      }
    });

    // Handle joining task rooms
    socket.on("join_room", (data) => {
      try {
        const { room } = data;
        socket.join(room);
        console.log(`🏠 Socket ${socket.id} joined room: ${room}`);

        // Notify others in the room
        socket.to(room).emit("user_joined_room", {
          userId: socket.userId,
          room,
        });
      } catch (error) {
        console.error("Join room error:", error);
      }
    });

    // Handle leaving task rooms
    socket.on("leave_room", (data) => {
      try {
        const { room } = data;
        socket.leave(room);
        console.log(`🚪 Socket ${socket.id} left room: ${room}`);

        // Notify others in the room
        socket.to(room).emit("user_left_room", {
          userId: socket.userId,
          room,
        });
      } catch (error) {
        console.error("Leave room error:", error);
      }
    });

    // Handle typing indicators
    socket.on("user_typing", (data) => {
      try {
        const { taskId } = data;
        if (taskId && socket.userId) {
          socket.to(`task_${taskId}`).emit("user_typing", {
            taskId,
            userId: socket.userId,
          });
        }
      } catch (error) {
        console.error("Typing indicator error:", error);
      }
    });

    socket.on("user_stopped_typing", (data) => {
      try {
        const { taskId } = data;
        if (taskId && socket.userId) {
          socket.to(`task_${taskId}`).emit("user_stopped_typing", {
            taskId,
            userId: socket.userId,
          });
        }
      } catch (error) {
        console.error("Stop typing indicator error:", error);
      }
    });

    // Handle message sent acknowledgments
    socket.on("message_sent", (data) => {
      try {
        const { taskId, message } = data;

        // Broadcast to others in the task room (exclude sender)
        socket.to(`task_${taskId}`).emit("new_message", {
          taskId,
          message,
        });

        console.log(
          `📨 Message broadcast to task_${taskId} from ${socket.userId}`
        );
      } catch (error) {
        console.error("Message sent broadcast error:", error);
      }
    });

    // Handle message edited acknowledgments
    socket.on("message_edited", (data) => {
      try {
        const { taskId, messageId, message } = data;

        socket.to(`task_${taskId}`).emit("message_edited", {
          taskId,
          messageId,
          message,
        });

        console.log(`✏️ Message edit broadcast to task_${taskId}`);
      } catch (error) {
        console.error("Message edit broadcast error:", error);
      }
    });

    // Handle message deleted acknowledgments
    socket.on("message_deleted", (data) => {
      try {
        const { taskId, messageId } = data;

        socket.to(`task_${taskId}`).emit("message_deleted", {
          taskId,
          messageId,
        });

        console.log(`🗑️ Message delete broadcast to task_${taskId}`);
      } catch (error) {
        console.error("Message delete broadcast error:", error);
      }
    });

    // Handle reaction acknowledgments
    socket.on("reaction_added", (data) => {
      try {
        const { taskId, messageId, emoji, reactions } = data;

        socket.to(`task_${taskId}`).emit("reaction_added", {
          taskId,
          messageId,
          emoji,
          reactions,
        });

        console.log(`😀 Reaction added broadcast to task_${taskId}`);
      } catch (error) {
        console.error("Reaction added broadcast error:", error);
      }
    });

    socket.on("reaction_removed", (data) => {
      try {
        const { taskId, messageId, reactions } = data;

        socket.to(`task_${taskId}`).emit("reaction_removed", {
          taskId,
          messageId,
          reactions,
        });

        console.log(`😐 Reaction removed broadcast to task_${taskId}`);
      } catch (error) {
        console.error("Reaction removed broadcast error:", error);
      }
    });

    // Handle notification acknowledgments
    socket.on("mark_notification_read", (data) => {
      try {
        const { notificationId } = data;

        if (socket.userId) {
          // You can add logic here to update notification status in database
          console.log(
            `📖 Notification ${notificationId} marked as read by ${socket.userId}`
          );
        }
      } catch (error) {
        console.error("Mark notification read error:", error);
      }
    });

    socket.on("mark_all_notifications_read", () => {
      try {
        if (socket.userId) {
          // You can add logic here to mark all notifications as read in database
          console.log(
            `📖 All notifications marked as read by ${socket.userId}`
          );
        }
      } catch (error) {
        console.error("Mark all notifications read error:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.log(`👋 User disconnected: ${socket.id}, reason: ${reason}`);

      if (socket.userId) {
        // Emit user offline status
        socket.broadcast.emit("user_offline", {
          userId: socket.userId,
          lastSeen: new Date().toISOString(),
        });

        console.log(`📴 User ${socket.userId} marked as offline`);
      }
    });

    // Handle connection errors
    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });
};

module.exports = {
  getConversation,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  getConversations,
  getUnreadCount,
  markConversationAsRead,
  searchMessages,
  getMessage,
  getChatStats,
  downloadFile,
  handleSocketEvents, // Export socket event handler
};
