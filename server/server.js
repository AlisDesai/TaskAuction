// TaskAuction/server/server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

const app = express();

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
});

// Make io accessible in routes
app.set("io", io);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database connection
const connectDB = require("./config/database");
connectDB();

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      console.log("❌ Socket connection rejected: No token provided");
      return next(new Error("Authentication error: No token provided"));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Store user info in socket
    socket.userId = decoded.id;
    socket.user = decoded;

    console.log(`🔐 Socket authenticated for user: ${decoded.id}`);
    next();
  } catch (error) {
    console.error("❌ Socket authentication error:", error.message);
    next(new Error("Authentication error: Invalid token"));
  }
});

// Socket.IO event handlers
io.on("connection", (socket) => {
  console.log(
    `🔌 New Socket.IO connection: ${socket.id} for user: ${socket.userId}`
  );

  // Auto-join user to their personal room
  if (socket.userId) {
    socket.join(`user_${socket.userId}`);
    console.log(`👤 User ${socket.userId} joined personal room`);

    // Emit user online status to all connected users
    socket.broadcast.emit("user_online", {
      userId: socket.userId,
      socketId: socket.id,
    });
  }

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
        console.log(`📖 All notifications marked as read by ${socket.userId}`);
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
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TaskAuction Server is running",
    timestamp: new Date().toISOString(),
    socketConnections: io.engine.clientsCount,
    environment: process.env.NODE_ENV || "development",
  });
});

// Routes will be added here
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));
// app.use('/api/tasks', require('./routes/tasks'));
// app.use('/api/bids', require('./routes/bids'));
// app.use('/api/chat', require('./routes/chat'));

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);

  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(isDevelopment && { stack: err.stack }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;

// Start server with Socket.IO
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO server ready`);
  console.log(
    `📡 CORS enabled for: ${process.env.CLIENT_URL || "http://localhost:5173"}`
  );
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");

  // Close Socket.IO connections
  io.close(() => {
    console.log("🔌 Socket.IO connections closed");
  });

  // Close HTTP server
  server.close(() => {
    console.log("🛑 HTTP server closed");
    mongoose.connection.close(() => {
      console.log("📦 MongoDB connection closed");
      process.exit(0);
    });
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");

  // Close Socket.IO connections
  io.close(() => {
    console.log("🔌 Socket.IO connections closed");
  });

  // Close HTTP server
  server.close(() => {
    console.log("🛑 HTTP server closed");
    mongoose.connection.close(() => {
      console.log("📦 MongoDB connection closed");
      process.exit(0);
    });
  });
});

module.exports = { app, server, io };
