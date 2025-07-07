// server/controllers/userController.js
const { validationResult } = require("express-validator");
const User = require("../models/User");
const Task = require("../models/Task");
const Bid = require("../models/Bid");
const { deleteFile, getFileUrl } = require("../middleware/upload");

// @desc    Get all users with pagination and filters
// @route   GET /api/users
// @access  Public
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    // Build query
    const query = { isActive: true };

    // Search by name or college
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { college: searchRegex },
      ];
    }

    // Filter by college
    if (req.query.college) {
      query.college = new RegExp(req.query.college, "i");
    }

    // Filter by skills
    if (req.query.skills) {
      const skillsArray = req.query.skills
        .split(",")
        .map((skill) => skill.trim());
      query.skills = { $in: skillsArray };
    }

    // Sort options
    let sort = {};
    if (req.query.sort) {
      const sortBy = req.query.sort;
      switch (sortBy) {
        case "rating":
          sort = { "rating.average": -1, "rating.count": -1 };
          break;
        case "newest":
          sort = { createdAt: -1 };
          break;
        case "name":
          sort = { firstName: 1, lastName: 1 };
          break;
        case "tasksCompleted":
          sort = { "stats.tasksCompleted": -1 };
          break;
        default:
          sort = { createdAt: -1 };
      }
    } else {
      sort = { createdAt: -1 };
    }

    // Execute query
    const users = await User.find(query)
      .select("-email -phone") // Hide sensitive info in public listing
      .sort(sort)
      .limit(limit * 1)
      .skip(startIndex);

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };

    res.status(200).json({
      success: true,
      count: users.length,
      pagination,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching users",
    });
  }
};

// @desc    Get single user profile
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-email -phone");

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user statistics
    const [completedTasks, postedTasks, activeBids] = await Promise.all([
      Task.countDocuments({
        assignedTo: user._id,
        status: "Completed",
      }),
      Task.countDocuments({
        poster: user._id,
      }),
      Bid.countDocuments({
        bidder: user._id,
        status: "Pending",
      }),
    ]);

    // Get recent completed tasks (last 5)
    const recentCompletedTasks = await Task.find({
      assignedTo: user._id,
      status: "Completed",
    })
      .select("title category completionDate rating")
      .sort({ completionDate: -1 })
      .limit(5);

    // Calculate success rate
    const totalAssignedTasks = await Task.countDocuments({
      assignedTo: user._id,
      status: { $in: ["Completed", "Closed"] },
    });

    const successRate =
      totalAssignedTasks > 0
        ? Math.round((completedTasks / totalAssignedTasks) * 100)
        : 0;

    const profileData = {
      ...user.toObject(),
      statistics: {
        completedTasks,
        postedTasks,
        activeBids,
        successRate,
      },
      recentCompletedTasks,
    };

    res.status(200).json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user profile",
    });
  }
};

// @desc    Upload user avatar
// @route   POST /api/users/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete old avatar if exists
    if (user.avatar) {
      const oldAvatarPath = user.avatar.replace(
        `${req.protocol}://${req.get("host")}`,
        "."
      );
      await deleteFile(oldAvatarPath);
    }

    // Update user avatar
    user.avatar = getFileUrl(req, req.file.path);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    res.status(500).json({
      success: false,
      message: "Server error uploading avatar",
    });
  }
};

// @desc    Delete user avatar
// @route   DELETE /api/users/avatar
// @access  Private
const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.avatar) {
      return res.status(400).json({
        success: false,
        message: "No avatar to delete",
      });
    }

    // Delete avatar file
    const avatarPath = user.avatar.replace(
      `${req.protocol}://${req.get("host")}`,
      "."
    );
    await deleteFile(avatarPath);

    // Update user
    user.avatar = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar deleted successfully",
    });
  } catch (error) {
    console.error("Delete avatar error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting avatar",
    });
  }
};

// @desc    Get user dashboard data
// @route   GET /api/users/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get dashboard statistics
    const [
      activeTasks,
      completedTasks,
      pendingBids,
      acceptedBids,
      totalEarnings,
      totalSpent,
      recentMessages,
    ] = await Promise.all([
      // Active tasks posted by user
      Task.countDocuments({
        poster: userId,
        status: { $in: ["Open", "Assigned", "In-Progress"] },
      }),
      // Completed tasks assigned to user
      Task.countDocuments({
        assignedTo: userId,
        status: "Completed",
      }),
      // Pending bids by user
      Bid.countDocuments({
        bidder: userId,
        status: "Pending",
      }),
      // Accepted bids by user
      Bid.countDocuments({
        bidder: userId,
        status: "Accepted",
      }),
      // Calculate total earnings
      Bid.aggregate([
        {
          $lookup: {
            from: "tasks",
            localField: "task",
            foreignField: "_id",
            as: "taskDetails",
          },
        },
        {
          $match: {
            bidder: userId,
            status: "Accepted",
            "taskDetails.status": "Completed",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),
      // Calculate total spent
      Task.aggregate([
        {
          $match: {
            poster: userId,
            status: "Completed",
          },
        },
        {
          $lookup: {
            from: "bids",
            localField: "acceptedBid",
            foreignField: "_id",
            as: "bidDetails",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $arrayElemAt: ["$bidDetails.amount", 0] } },
          },
        },
      ]),
      // Recent unread messages count
      require("../models/Message").countDocuments({
        receiver: userId,
        isRead: false,
        isDeleted: false,
      }),
    ]);

    // Get recent tasks
    const recentTasks = await Task.find({
      poster: userId,
    })
      .select("title status createdAt bidCount")
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent bids
    const recentBids = await Bid.find({
      bidder: userId,
    })
      .populate("task", "title status")
      .select("amount status createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    // Get urgent tasks (deadline within 24 hours)
    const urgentTasks = await Task.find({
      poster: userId,
      status: "Open",
      deadline: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })
      .select("title deadline bidCount")
      .sort({ deadline: 1 })
      .limit(5);

    const dashboardData = {
      statistics: {
        activeTasks,
        completedTasks,
        pendingBids,
        acceptedBids,
        totalEarnings: totalEarnings[0]?.total || 0,
        totalSpent: totalSpent[0]?.total || 0,
        unreadMessages: recentMessages,
      },
      recentTasks,
      recentBids,
      urgentTasks,
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching dashboard data",
    });
  }
};

// @desc    Get user's tasks
// @route   GET /api/users/tasks
// @access  Private
const getUserTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query based on type
    let query = {};
    const type = req.query.type || "posted";

    if (type === "posted") {
      query.poster = req.user.id;
    } else if (type === "assigned") {
      query.assignedTo = req.user.id;
    } else if (type === "bidded") {
      // Get tasks user has bidded on
      const userBids = await Bid.find({ bidder: req.user.id }).distinct("task");
      query._id = { $in: userBids };
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Sort options
    let sort = { createdAt: -1 };
    if (req.query.sort === "deadline") {
      sort = { deadline: 1 };
    } else if (req.query.sort === "budget") {
      sort = { "budget.max": -1 };
    }

    // Execute query
    const tasks = await Task.find(query)
      .populate("poster", "firstName lastName avatar rating")
      .populate("assignedTo", "firstName lastName avatar rating")
      .sort(sort)
      .limit(limit * 1)
      .skip(startIndex);

    // Get total count
    const total = await Task.countDocuments(query);

    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTasks: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };

    res.status(200).json({
      success: true,
      count: tasks.length,
      pagination,
      data: tasks,
    });
  } catch (error) {
    console.error("Get user tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user tasks",
    });
  }
};

// @desc    Get user's bids
// @route   GET /api/users/bids
// @access  Private
const getUserBids = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    const query = { bidder: req.user.id };

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Sort options
    let sort = { createdAt: -1 };
    if (req.query.sort === "amount") {
      sort = { amount: -1 };
    }

    // Execute query
    const bids = await Bid.find(query)
      .populate("task", "title status deadline budget poster")
      .populate("task.poster", "firstName lastName avatar")
      .sort(sort)
      .limit(limit * 1)
      .skip(startIndex);

    // Get total count
    const total = await Bid.countDocuments(query);

    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalBids: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };

    res.status(200).json({
      success: true,
      count: bids.length,
      pagination,
      data: bids,
    });
  } catch (error) {
    console.error("Get user bids error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user bids",
    });
  }
};

// @desc    Get user analytics
// @route   GET /api/users/analytics
// @access  Private
const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days, 10) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Task analytics
    const taskAnalytics = await Task.aggregate([
      {
        $match: {
          poster: userId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.date": 1 },
      },
    ]);

    // Bid analytics
    const bidAnalytics = await Bid.aggregate([
      {
        $match: {
          bidder: userId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$status",
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $sort: { "_id.date": 1 },
      },
    ]);

    // Category performance
    const categoryPerformance = await Task.aggregate([
      {
        $match: {
          $or: [{ poster: userId }, { assignedTo: userId }],
          status: "Completed",
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating.taskRating" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        taskAnalytics,
        bidAnalytics,
        categoryPerformance,
        period: `${days} days`,
      },
    });
  } catch (error) {
    console.error("Get user analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user analytics",
    });
  }
};

module.exports = {
  getUsers,
  getUserProfile,
  uploadAvatar,
  deleteAvatar,
  getDashboard,
  getUserTasks,
  getUserBids,
  getUserAnalytics,
};
