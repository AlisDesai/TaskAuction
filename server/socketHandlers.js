// server/socketHandlers.js
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Task = require("./models/Task");
const Message = require("./models/Message");

class SocketHandlers {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
    this.typingUsers = new Map(); // taskId -> Set of userIds
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Set up socket event handlers
      this.handleConnection(socket);
      this.handleDisconnection(socket);
      this.handleRoomEvents(socket);
      this.handleMessageEvents(socket);
      this.handleTypingEvents(socket);
      this.handleTaskEvents(socket);
      this.handleBidEvents(socket);
      this.handleNotificationEvents(socket);
    });
  }

  // Handle new socket connection
  handleConnection(socket) {
    socket.on("authenticate", async (data) => {
      try {
        const { token } = data;

        if (!token) {
          socket.emit("auth_error", { message: "No token provided" });
          return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
          socket.emit("auth_error", { message: "Invalid or inactive user" });
          return;
        }

        // Store user mapping
        socket.userId = user._id.toString();
        socket.user = user;
        this.connectedUsers.set(socket.userId, socket.id);
        this.userSockets.set(socket.id, socket.userId);

        // Update user's online status
        await User.findByIdAndUpdate(user._id, {
          isOnline: true,
          lastSeen: new Date(),
        });

        // Join user to personal room for notifications
        socket.join(`user_${socket.userId}`);

        // Emit successful authentication
        socket.emit("auth_success", {
          userId: user._id,
          socketId: socket.id,
        });

        // Notify other users about online status
        socket.broadcast.emit("user_online", {
          userId: socket.userId,
          timestamp: new Date(),
        });

        console.log(
          `User authenticated: ${user.firstName} ${user.lastName} (${socket.userId})`
        );
      } catch (error) {
        console.error("Socket authentication error:", error);
        socket.emit("auth_error", { message: "Authentication failed" });
      }
    });
  }

  // Handle socket disconnection
  handleDisconnection(socket) {
    socket.on("disconnect", async (reason) => {
      console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);

      if (socket.userId) {
        try {
          // Update user's offline status
          await User.findByIdAndUpdate(socket.userId, {
            isOnline: false,
            lastSeen: new Date(),
          });

          // Clean up typing indicators
          this.cleanupTypingIndicators(socket.userId);

          // Remove from maps
          this.connectedUsers.delete(socket.userId);
          this.userSockets.delete(socket.id);

          // Notify other users about offline status
          socket.broadcast.emit("user_offline", {
            userId: socket.userId,
            lastSeen: new Date(),
            timestamp: new Date(),
          });

          console.log(`User disconnected: ${socket.userId}`);
        } catch (error) {
          console.error("Error updating user offline status:", error);
        }
      }
    });
  }

  // Handle room-related events
  handleRoomEvents(socket) {
    // Join room
    socket.on("join_room", async (data) => {
      try {
        const { room } = data;

        if (!room || !socket.userId) {
          socket.emit("error", {
            message: "Invalid room or user not authenticated",
          });
          return;
        }

        // Validate room access based on room type
        const hasAccess = await this.validateRoomAccess(socket.userId, room);

        if (!hasAccess) {
          socket.emit("error", { message: "Access denied to this room" });
          return;
        }

        socket.join(room);
        socket.emit("room_joined", { room });

        // Notify others in the room
        socket.to(room).emit("user_joined_room", {
          userId: socket.userId,
          room,
          timestamp: new Date(),
        });

        console.log(`User ${socket.userId} joined room: ${room}`);
      } catch (error) {
        console.error("Join room error:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // Leave room
    socket.on("leave_room", (data) => {
      try {
        const { room } = data;

        if (!room) {
          socket.emit("error", { message: "Room name required" });
          return;
        }

        socket.leave(room);
        socket.emit("room_left", { room });

        // Notify others in the room
        socket.to(room).emit("user_left_room", {
          userId: socket.userId,
          room,
          timestamp: new Date(),
        });

        // Clean up typing indicators for this room
        if (room.startsWith("task_")) {
          const taskId = room.replace("task_", "");
          this.removeTypingUser(taskId, socket.userId);
        }

        console.log(`User ${socket.userId} left room: ${room}`);
      } catch (error) {
        console.error("Leave room error:", error);
        socket.emit("error", { message: "Failed to leave room" });
      }
    });
  }

  // Handle message-related events
  handleMessageEvents(socket) {
    // Message sent
    socket.on("message_sent", (data) => {
      try {
        const { taskId, message } = data;

        if (!taskId || !message) {
          socket.emit("error", { message: "Invalid message data" });
          return;
        }

        // Broadcast to task room (exclude sender)
        socket.to(`task_${taskId}`).emit("new_message", {
          taskId,
          message,
          senderId: socket.userId,
          timestamp: new Date(),
        });

        console.log(`Message sent in task ${taskId} by user ${socket.userId}`);
      } catch (error) {
        console.error("Message sent error:", error);
        socket.emit("error", { message: "Failed to broadcast message" });
      }
    });

    // Message edited
    socket.on("message_edited", (data) => {
      try {
        const { taskId, messageId, message } = data;

        if (!taskId || !messageId || !message) {
          socket.emit("error", { message: "Invalid message edit data" });
          return;
        }

        // Broadcast to task room
        this.io.to(`task_${taskId}`).emit("message_edited", {
          taskId,
          messageId,
          message,
          editedBy: socket.userId,
          timestamp: new Date(),
        });

        console.log(
          `Message ${messageId} edited in task ${taskId} by user ${socket.userId}`
        );
      } catch (error) {
        console.error("Message edit error:", error);
        socket.emit("error", { message: "Failed to broadcast message edit" });
      }
    });

    // Message deleted
    socket.on("message_deleted", (data) => {
      try {
        const { taskId, messageId } = data;

        if (!taskId || !messageId) {
          socket.emit("error", { message: "Invalid message delete data" });
          return;
        }

        // Broadcast to task room
        this.io.to(`task_${taskId}`).emit("message_deleted", {
          taskId,
          messageId,
          deletedBy: socket.userId,
          timestamp: new Date(),
        });

        console.log(
          `Message ${messageId} deleted in task ${taskId} by user ${socket.userId}`
        );
      } catch (error) {
        console.error("Message delete error:", error);
        socket.emit("error", {
          message: "Failed to broadcast message deletion",
        });
      }
    });

    // Reaction added
    socket.on("reaction_added", (data) => {
      try {
        const { taskId, messageId, emoji, reactions } = data;

        if (!taskId || !messageId || !emoji) {
          socket.emit("error", { message: "Invalid reaction data" });
          return;
        }

        // Broadcast to task room
        this.io.to(`task_${taskId}`).emit("reaction_added", {
          taskId,
          messageId,
          emoji,
          reactions,
          userId: socket.userId,
          timestamp: new Date(),
        });

        console.log(
          `Reaction ${emoji} added to message ${messageId} by user ${socket.userId}`
        );
      } catch (error) {
        console.error("Reaction add error:", error);
        socket.emit("error", { message: "Failed to broadcast reaction" });
      }
    });

    // Reaction removed
    socket.on("reaction_removed", (data) => {
      try {
        const { taskId, messageId, reactions } = data;

        if (!taskId || !messageId) {
          socket.emit("error", { message: "Invalid reaction removal data" });
          return;
        }

        // Broadcast to task room
        this.io.to(`task_${taskId}`).emit("reaction_removed", {
          taskId,
          messageId,
          reactions,
          userId: socket.userId,
          timestamp: new Date(),
        });

        console.log(
          `Reaction removed from message ${messageId} by user ${socket.userId}`
        );
      } catch (error) {
        console.error("Reaction remove error:", error);
        socket.emit("error", {
          message: "Failed to broadcast reaction removal",
        });
      }
    });
  }

  // Handle typing indicators
  handleTypingEvents(socket) {
    // User started typing
    socket.on("user_typing", (data) => {
      try {
        const { taskId } = data;

        if (!taskId || !socket.userId) {
          return;
        }

        // Add user to typing users for this task
        this.addTypingUser(taskId, socket.userId);

        // Broadcast to task room (exclude sender)
        socket.to(`task_${taskId}`).emit("user_typing", {
          taskId,
          userId: socket.userId,
          userName: socket.user
            ? `${socket.user.firstName} ${socket.user.lastName}`
            : "Unknown",
          timestamp: new Date(),
        });

        // Set timeout to automatically remove typing indicator
        setTimeout(() => {
          this.removeTypingUser(taskId, socket.userId);
          socket.to(`task_${taskId}`).emit("user_stopped_typing", {
            taskId,
            userId: socket.userId,
            timestamp: new Date(),
          });
        }, 3000); // 3 seconds timeout
      } catch (error) {
        console.error("Typing indicator error:", error);
      }
    });

    // User stopped typing
    socket.on("user_stopped_typing", (data) => {
      try {
        const { taskId } = data;

        if (!taskId || !socket.userId) {
          return;
        }

        // Remove user from typing users
        this.removeTypingUser(taskId, socket.userId);

        // Broadcast to task room (exclude sender)
        socket.to(`task_${taskId}`).emit("user_stopped_typing", {
          taskId,
          userId: socket.userId,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Stop typing error:", error);
      }
    });
  }

  // Handle task-related events
  handleTaskEvents(socket) {
    // Task updated
    socket.on("task_updated", (data) => {
      try {
        const { taskId, task, updateType } = data;

        if (!taskId || !task) {
          socket.emit("error", { message: "Invalid task update data" });
          return;
        }

        // Broadcast to task room
        this.io.to(`task_${taskId}`).emit("task_updated", {
          taskId,
          task,
          updateType,
          updatedBy: socket.userId,
          timestamp: new Date(),
        });

        console.log(`Task ${taskId} updated by user ${socket.userId}`);
      } catch (error) {
        console.error("Task update error:", error);
        socket.emit("error", { message: "Failed to broadcast task update" });
      }
    });

    // Task status changed
    socket.on("task_status_changed", (data) => {
      try {
        const { taskId, oldStatus, newStatus } = data;

        if (!taskId || !newStatus) {
          socket.emit("error", { message: "Invalid task status data" });
          return;
        }

        // Broadcast to task room
        this.io.to(`task_${taskId}`).emit("task_status_changed", {
          taskId,
          oldStatus,
          newStatus,
          changedBy: socket.userId,
          timestamp: new Date(),
        });

        console.log(
          `Task ${taskId} status changed from ${oldStatus} to ${newStatus} by user ${socket.userId}`
        );
      } catch (error) {
        console.error("Task status change error:", error);
        socket.emit("error", {
          message: "Failed to broadcast task status change",
        });
      }
    });
  }

  // Handle bid-related events
  handleBidEvents(socket) {
    // Bid placed
    socket.on("bid_placed", (data) => {
      try {
        const { taskId, bid } = data;

        if (!taskId || !bid) {
          socket.emit("error", { message: "Invalid bid data" });
          return;
        }

        // Broadcast to task room
        this.io.to(`task_${taskId}`).emit("bid_placed", {
          taskId,
          bid,
          bidderId: socket.userId,
          timestamp: new Date(),
        });

        console.log(`Bid placed on task ${taskId} by user ${socket.userId}`);
      } catch (error) {
        console.error("Bid placed error:", error);
        socket.emit("error", { message: "Failed to broadcast bid placement" });
      }
    });

    // Bid accepted
    socket.on("bid_accepted", (data) => {
      try {
        const { taskId, bidId, bid } = data;

        if (!taskId || !bidId) {
          socket.emit("error", { message: "Invalid bid acceptance data" });
          return;
        }

        // Broadcast to task room
        this.io.to(`task_${taskId}`).emit("bid_accepted", {
          taskId,
          bidId,
          bid,
          acceptedBy: socket.userId,
          timestamp: new Date(),
        });

        console.log(
          `Bid ${bidId} accepted on task ${taskId} by user ${socket.userId}`
        );
      } catch (error) {
        console.error("Bid acceptance error:", error);
        socket.emit("error", { message: "Failed to broadcast bid acceptance" });
      }
    });

    // Bid rejected
    socket.on("bid_rejected", (data) => {
      try {
        const { taskId, bidId } = data;

        if (!taskId || !bidId) {
          socket.emit("error", { message: "Invalid bid rejection data" });
          return;
        }

        // Broadcast to task room
        this.io.to(`task_${taskId}`).emit("bid_rejected", {
          taskId,
          bidId,
          rejectedBy: socket.userId,
          timestamp: new Date(),
        });

        console.log(
          `Bid ${bidId} rejected on task ${taskId} by user ${socket.userId}`
        );
      } catch (error) {
        console.error("Bid rejection error:", error);
        socket.emit("error", { message: "Failed to broadcast bid rejection" });
      }
    });
  }

  // Handle notification events
  handleNotificationEvents(socket) {
    // Send notification to specific user
    socket.on("send_notification", (data) => {
      try {
        const { userId, notification } = data;

        if (!userId || !notification) {
          socket.emit("error", { message: "Invalid notification data" });
          return;
        }

        // Send to specific user's room
        this.io.to(`user_${userId}`).emit("notification", {
          ...notification,
          timestamp: new Date(),
        });

        console.log(
          `Notification sent to user ${userId} by user ${socket.userId}`
        );
      } catch (error) {
        console.error("Send notification error:", error);
        socket.emit("error", { message: "Failed to send notification" });
      }
    });

    // Mark notification as read
    socket.on("mark_notification_read", (data) => {
      try {
        const { notificationId } = data;

        if (!notificationId) {
          socket.emit("error", { message: "Notification ID required" });
          return;
        }

        // Update notification status in database here if needed
        // For now, just acknowledge
        socket.emit("notification_marked_read", {
          notificationId,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Mark notification read error:", error);
        socket.emit("error", {
          message: "Failed to mark notification as read",
        });
      }
    });
  }

  // Utility methods
  async validateRoomAccess(userId, room) {
    try {
      // For task rooms
      if (room.startsWith("task_")) {
        const taskId = room.replace("task_", "");
        const task = await Task.findById(taskId);

        if (!task) return false;

        // Check if user is poster or assigned bidder
        return (
          task.poster.toString() === userId ||
          (task.assignedTo && task.assignedTo.toString() === userId)
        );
      }

      // For user rooms (notifications)
      if (room.startsWith("user_")) {
        const roomUserId = room.replace("user_", "");
        return roomUserId === userId;
      }

      // For general rooms, allow access (can be restricted based on requirements)
      return true;
    } catch (error) {
      console.error("Room access validation error:", error);
      return false;
    }
  }

  addTypingUser(taskId, userId) {
    if (!this.typingUsers.has(taskId)) {
      this.typingUsers.set(taskId, new Set());
    }
    this.typingUsers.get(taskId).add(userId);
  }

  removeTypingUser(taskId, userId) {
    if (this.typingUsers.has(taskId)) {
      this.typingUsers.get(taskId).delete(userId);

      // Clean up empty sets
      if (this.typingUsers.get(taskId).size === 0) {
        this.typingUsers.delete(taskId);
      }
    }
  }

  cleanupTypingIndicators(userId) {
    // Remove user from all typing indicators
    for (const [taskId, typingSet] of this.typingUsers.entries()) {
      if (typingSet.has(userId)) {
        typingSet.delete(userId);

        // Notify others that user stopped typing
        this.io.to(`task_${taskId}`).emit("user_stopped_typing", {
          taskId,
          userId,
          timestamp: new Date(),
        });

        // Clean up empty sets
        if (typingSet.size === 0) {
          this.typingUsers.delete(taskId);
        }
      }
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get users in specific room
  getUsersInRoom(room) {
    const roomSockets = this.io.sockets.adapter.rooms.get(room);
    if (!roomSockets) return [];

    const users = [];
    for (const socketId of roomSockets) {
      const userId = this.userSockets.get(socketId);
      if (userId) {
        users.push(userId);
      }
    }
    return users;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  // Send notification to user
  async sendNotificationToUser(userId, notification) {
    try {
      this.io.to(`user_${userId}`).emit("notification", {
        ...notification,
        timestamp: new Date(),
      });
      return true;
    } catch (error) {
      console.error("Send notification to user error:", error);
      return false;
    }
  }

  // Broadcast to all connected users
  broadcastToAll(event, data) {
    try {
      this.io.emit(event, {
        ...data,
        timestamp: new Date(),
      });
      return true;
    } catch (error) {
      console.error("Broadcast to all error:", error);
      return false;
    }
  }
}

module.exports = SocketHandlers;
