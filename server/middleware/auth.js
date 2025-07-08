// server/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes - authenticate user
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "No user found with this token",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "User account is deactivated",
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error in authentication",
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Check if user is verified
const requireVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email address to access this feature",
    });
  }
  next();
};

// Check task ownership
const checkTaskOwnership = async (req, res, next) => {
  try {
    const Task = require("../models/Task");
    const task = await Task.findById(req.params.id || req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (task.poster.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to perform this action on this task",
      });
    }

    req.task = task;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error in task ownership verification",
    });
  }
};

// Check bid ownership
const checkBidOwnership = async (req, res, next) => {
  try {
    const Bid = require("../models/Bid");
    const bid = await Bid.findById(req.params.id || req.params.bidId);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    if (bid.bidder.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to perform this action on this bid",
      });
    }

    req.bid = bid;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error in bid ownership verification",
    });
  }
};

// Check if user is involved in task (poster or assigned bidder)
const checkTaskInvolvement = async (req, res, next) => {
  try {
    const Task = require("../models/Task");
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const isPoster = task.poster.toString() === req.user._id.toString();
    const isAssignedBidder =
      task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (!isPoster && !isAssignedBidder) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this task",
      });
    }

    req.task = task;
    req.userRole = isPoster ? "poster" : "bidder";
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error in task involvement verification",
    });
  }
};

// Rate limiting for specific actions
const createRateLimit = (windowMs, max, message) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old requests
    if (requests.has(userId)) {
      const userRequests = requests
        .get(userId)
        .filter((time) => time > windowStart);
      requests.set(userId, userRequests);
    } else {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);

    if (userRequests.length >= max) {
      return res.status(429).json({
        success: false,
        message: message || "Too many requests, please try again later",
      });
    }

    userRequests.push(now);
    next();
  };
};

// Specific rate limits
const taskCreationLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  5, // 5 tasks per hour
  "You can only create 5 tasks per hour"
);

const bidCreationLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  20, // 20 bids per hour
  "You can only place 20 bids per hour"
);

const messageLimit = createRateLimit(
  60 * 1000, // 1 minute
  30, // 30 messages per minute
  "You can only send 30 messages per minute"
);

// Optional authentication (for public routes that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Invalid token, but continue without user
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Check if user can access task (for viewing)
const checkTaskAccess = async (req, res, next) => {
  try {
    const Task = require("../models/Task");
    const task = await Task.findById(req.params.id || req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // If no user is authenticated, only allow access to open tasks
    if (!req.user) {
      if (task.status !== "Open") {
        return res.status(403).json({
          success: false,
          message: "This task is not publicly accessible",
        });
      }
    } else {
      // Authenticated users can see their own tasks or open tasks
      const isOwner = task.poster.toString() === req.user._id.toString();
      const isAssigned =
        task.assignedTo &&
        task.assignedTo.toString() === req.user._id.toString();
      const isOpen = task.status === "Open";

      if (!isOwner && !isAssigned && !isOpen) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access this task",
        });
      }
    }

    req.task = task;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error in task access verification",
    });
  }
};

module.exports = {
  protect,
  authorize,
  requireVerification,
  checkTaskOwnership,
  checkBidOwnership,
  checkTaskInvolvement,
  checkTaskAccess,
  taskCreationLimit,
  bidCreationLimit,
  messageLimit,
  optionalAuth,
};
