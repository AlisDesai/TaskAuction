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

    // TODO: Emit real-time event via Socket.IO
    // io.to(taskId).emit('newMessage', message);

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

    // TODO: Emit real-time event via Socket.IO
    // io.to(message.task.toString()).emit('messageEdited', message);

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

    // TODO: Emit real-time event via Socket.IO
    // io.to(message.task.toString()).emit('messageDeleted', { messageId: message._id });

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

    // TODO: Emit real-time event via Socket.IO
    // io.to(message.task.toString()).emit('reactionAdded', { messageId: message._id, emoji, userId: req.user.id });

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

    // TODO: Emit real-time event via Socket.IO
    // io.to(message.task.toString()).emit('reactionRemoved', { messageId: message._id, userId: req.user.id });

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
                    { $eq: ["$task", "$taskId"] },
                    { $eq: ["$sender", userId] },
                    { $gt: ["$createdAt", "$msgTime"] },
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
};
