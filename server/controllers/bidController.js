// server/controllers/bidController.js
const { validationResult } = require("express-validator");
const Bid = require("../models/Bid");
const Task = require("../models/Task");
const User = require("../models/User");

// @desc    Create new bid
// @route   POST /api/bids
// @access  Private
const createBid = async (req, res) => {
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

    const {
      taskId,
      amount,
      proposedTimeline,
      message,
      deliverables,
      experience,
      portfolio,
    } = req.body;

    // Get the task
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if task can receive bids
    if (!task.canReceiveBids()) {
      return res.status(400).json({
        success: false,
        message: "This task is no longer accepting bids",
      });
    }

    // Check if user is trying to bid on their own task
    if (task.poster.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot bid on your own task",
      });
    }

    // Check if user already has a bid on this task
    const existingBid = await Bid.findOne({
      task: taskId,
      bidder: req.user.id,
      status: { $ne: "Withdrawn" },
    });

    if (existingBid) {
      return res.status(400).json({
        success: false,
        message: "You have already placed a bid on this task",
      });
    }

    // Validate bid amount against task budget
    if (amount < task.budget.min || amount > task.budget.max) {
      return res.status(400).json({
        success: false,
        message: `Bid amount must be between ₹${task.budget.min} and ₹${task.budget.max}`,
      });
    }

    // Process deliverables and portfolio
    const processedDeliverables = deliverables
      ? Array.isArray(deliverables)
        ? deliverables
        : deliverables.split(",").map((d) => d.trim())
      : [];

    const processedPortfolio = portfolio
      ? Array.isArray(portfolio)
        ? portfolio
        : []
      : [];

    // Create bid
    const bid = await Bid.create({
      task: taskId,
      bidder: req.user.id,
      amount: parseFloat(amount),
      proposedTimeline,
      message,
      deliverables: processedDeliverables,
      experience,
      portfolio: processedPortfolio,
    });

    // Populate bidder info
    await bid.populate("bidder", "firstName lastName avatar rating stats");
    await bid.populate("task", "title budget deadline");

    res.status(201).json({
      success: true,
      message: "Bid placed successfully",
      data: bid,
    });
  } catch (error) {
    console.error("Create bid error:", error);

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
      message: "Server error creating bid",
    });
  }
};

// @desc    Get all bids (with filters)
// @route   GET /api/bids
// @access  Private
const getBids = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    // Build query
    const query = {};

    // Filter by user type
    if (req.query.type === "my-bids") {
      query.bidder = req.user.id;
    } else if (req.query.type === "received") {
      // Get tasks posted by user and find bids on those tasks
      const userTasks = await Task.find({ poster: req.user.id }).distinct(
        "_id"
      );
      query.task = { $in: userTasks };
    }

    // Filter by task
    if (req.query.taskId) {
      query.task = req.query.taskId;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by amount range
    if (req.query.minAmount || req.query.maxAmount) {
      query.amount = {};
      if (req.query.minAmount) {
        query.amount.$gte = parseFloat(req.query.minAmount);
      }
      if (req.query.maxAmount) {
        query.amount.$lte = parseFloat(req.query.maxAmount);
      }
    }

    // Sort options
    let sort = { createdAt: -1 };
    if (req.query.sort === "amount_low") {
      sort = { amount: 1 };
    } else if (req.query.sort === "amount_high") {
      sort = { amount: -1 };
    } else if (req.query.sort === "oldest") {
      sort = { createdAt: 1 };
    }

    // Execute query
    const bids = await Bid.find(query)
      .populate("bidder", "firstName lastName avatar rating stats")
      .populate("task", "title status deadline budget poster")
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
    console.error("Get bids error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching bids",
    });
  }
};

// @desc    Get single bid
// @route   GET /api/bids/:id
// @access  Private
const getBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id)
      .populate("bidder", "firstName lastName avatar rating stats college")
      .populate(
        "task",
        "title description budget deadline status poster assignedTo"
      );

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    // Check access permissions
    const isBidder = bid.bidder._id.toString() === req.user.id;
    const isTaskOwner = bid.task.poster.toString() === req.user.id;

    if (!isBidder && !isTaskOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this bid",
      });
    }

    // Add user context
    bid._doc.isBidder = isBidder;
    bid._doc.isTaskOwner = isTaskOwner;

    res.status(200).json({
      success: true,
      data: bid,
    });
  } catch (error) {
    console.error("Get bid error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching bid",
    });
  }
};

// @desc    Update bid
// @route   PUT /api/bids/:id
// @access  Private (Bidder only)
const updateBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    // Check if user owns the bid
    if (bid.bidder.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this bid",
      });
    }

    // Check if bid can be edited
    if (!bid.canBeEdited()) {
      return res.status(400).json({
        success: false,
        message: "Bid cannot be edited after deadline or status change",
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

    const {
      amount,
      proposedTimeline,
      message,
      deliverables,
      experience,
      portfolio,
    } = req.body;

    // Get task to validate amount
    const task = await Task.findById(bid.task);

    // Validate bid amount if provided
    if (amount) {
      if (amount < task.budget.min || amount > task.budget.max) {
        return res.status(400).json({
          success: false,
          message: `Bid amount must be between ₹${task.budget.min} and ₹${task.budget.max}`,
        });
      }
    }

    // Update fields
    const updateFields = {};
    if (amount) updateFields.amount = parseFloat(amount);
    if (proposedTimeline) updateFields.proposedTimeline = proposedTimeline;
    if (message !== undefined) updateFields.message = message;
    if (experience !== undefined) updateFields.experience = experience;

    if (deliverables !== undefined) {
      updateFields.deliverables = Array.isArray(deliverables)
        ? deliverables
        : deliverables.split(",").map((d) => d.trim());
    }

    if (portfolio !== undefined) {
      updateFields.portfolio = Array.isArray(portfolio) ? portfolio : [];
    }

    const updatedBid = await Bid.findByIdAndUpdate(
      req.params.id,
      updateFields,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("bidder", "firstName lastName avatar rating stats")
      .populate("task", "title budget deadline");

    res.status(200).json({
      success: true,
      message: "Bid updated successfully",
      data: updatedBid,
    });
  } catch (error) {
    console.error("Update bid error:", error);

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
      message: "Server error updating bid",
    });
  }
};

// @desc    Withdraw bid
// @route   POST /api/bids/:id/withdraw
// @access  Private (Bidder only)
const withdrawBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    // Check if user owns the bid
    if (bid.bidder.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to withdraw this bid",
      });
    }

    // Check if bid can be withdrawn
    if (!bid.canBeWithdrawn()) {
      return res.status(400).json({
        success: false,
        message: "Bid cannot be withdrawn at this time",
      });
    }

    // Withdraw the bid
    await bid.withdraw();

    res.status(200).json({
      success: true,
      message: "Bid withdrawn successfully",
      data: bid,
    });
  } catch (error) {
    console.error("Withdraw bid error:", error);
    res.status(500).json({
      success: false,
      message: "Server error withdrawing bid",
    });
  }
};

// @desc    Delete bid
// @route   DELETE /api/bids/:id
// @access  Private (Bidder only)
const deleteBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    // Check if user owns the bid
    if (bid.bidder.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this bid",
      });
    }

    // Check if bid can be deleted (only withdrawn or rejected bids)
    if (bid.status !== "Withdrawn" && bid.status !== "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Only withdrawn or rejected bids can be deleted",
      });
    }

    // Delete the bid
    await Bid.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Bid deleted successfully",
    });
  } catch (error) {
    console.error("Delete bid error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting bid",
    });
  }
};

// @desc    Get bid statistics for a task
// @route   GET /api/bids/task/:taskId/stats
// @access  Private (Task Owner)
const getBidStats = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if user owns the task
    if (task.poster.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view bid statistics for this task",
      });
    }

    // Get comprehensive bid statistics
    const stats = await Bid.aggregate([
      {
        $match: {
          task: task._id,
          status: { $ne: "Withdrawn" },
        },
      },
      {
        $group: {
          _id: null,
          totalBids: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
          minAmount: { $min: "$amount" },
          maxAmount: { $max: "$amount" },
          pendingBids: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
          },
          acceptedBids: {
            $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] },
          },
          rejectedBids: {
            $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
          },
        },
      },
    ]);

    // Get bidder rating distribution
    const ratingDistribution = await Bid.aggregate([
      {
        $match: {
          task: task._id,
          status: { $ne: "Withdrawn" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "bidder",
          foreignField: "_id",
          as: "bidderInfo",
        },
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                {
                  case: {
                    $gte: [
                      { $arrayElemAt: ["$bidderInfo.rating.average", 0] },
                      4.5,
                    ],
                  },
                  then: "4.5+",
                },
                {
                  case: {
                    $gte: [
                      { $arrayElemAt: ["$bidderInfo.rating.average", 0] },
                      4.0,
                    ],
                  },
                  then: "4.0-4.4",
                },
                {
                  case: {
                    $gte: [
                      { $arrayElemAt: ["$bidderInfo.rating.average", 0] },
                      3.5,
                    ],
                  },
                  then: "3.5-3.9",
                },
                {
                  case: {
                    $gte: [
                      { $arrayElemAt: ["$bidderInfo.rating.average", 0] },
                      3.0,
                    ],
                  },
                  then: "3.0-3.4",
                },
                {
                  case: {
                    $gt: [
                      { $arrayElemAt: ["$bidderInfo.rating.average", 0] },
                      0,
                    ],
                  },
                  then: "Below 3.0",
                },
              ],
              default: "No Rating",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get timeline distribution
    const timelineDistribution = await Bid.aggregate([
      {
        $match: {
          task: task._id,
          status: { $ne: "Withdrawn" },
        },
      },
      {
        $group: {
          _id: "$proposedTimeline",
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    const result = {
      general: stats[0] || {
        totalBids: 0,
        avgAmount: 0,
        minAmount: 0,
        maxAmount: 0,
        pendingBids: 0,
        acceptedBids: 0,
        rejectedBids: 0,
      },
      ratingDistribution,
      timelineDistribution,
    };

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get bid stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching bid statistics",
    });
  }
};

// @desc    Highlight bid (premium feature placeholder)
// @route   POST /api/bids/:id/highlight
// @access  Private (Bidder only)
const highlightBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    // Check if user owns the bid
    if (bid.bidder.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to highlight this bid",
      });
    }

    // Check if bid is still pending
    if (bid.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending bids can be highlighted",
      });
    }

    // Toggle highlight status
    bid.isHighlighted = !bid.isHighlighted;
    await bid.save();

    res.status(200).json({
      success: true,
      message: bid.isHighlighted
        ? "Bid highlighted successfully"
        : "Bid highlight removed",
      data: bid,
    });
  } catch (error) {
    console.error("Highlight bid error:", error);
    res.status(500).json({
      success: false,
      message: "Server error highlighting bid",
    });
  }
};

// @desc    Get recommended bids for a user
// @route   GET /api/bids/recommendations
// @access  Private
const getRecommendedBids = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const limit = parseInt(req.query.limit, 10) || 10;

    // Get user's skills and categories they've worked on
    const userCategories = await Bid.aggregate([
      {
        $match: {
          bidder: user._id,
          status: "Accepted",
        },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "task",
          foreignField: "_id",
          as: "taskInfo",
        },
      },
      {
        $group: {
          _id: { $arrayElemAt: ["$taskInfo.category", 0] },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    const preferredCategories = userCategories.map((cat) => cat._id);

    // Build recommendation query
    const query = {
      status: "Open",
      deadline: { $gt: new Date() },
      poster: { $ne: user._id }, // Exclude user's own tasks
    };

    // Add category filter if user has history
    if (preferredCategories.length > 0) {
      query.category = { $in: preferredCategories };
    }

    // Add skill-based filtering
    if (user.skills && user.skills.length > 0) {
      query.$or = [
        { tags: { $in: user.skills } },
        { category: { $in: preferredCategories } },
        {
          $text: {
            $search: user.skills.join(" "),
            $caseSensitive: false,
          },
        },
      ];
    }

    // Get tasks user hasn't bidded on
    const userBiddedTasks = await Bid.find({
      bidder: user._id,
      status: { $ne: "Withdrawn" },
    }).distinct("task");

    query._id = { $nin: userBiddedTasks };

    // Execute query
    const recommendedTasks = await Task.find(query)
      .populate("poster", "firstName lastName avatar rating college")
      .sort({
        isUrgent: -1,
        deadline: 1,
        bidCount: 1, // Prefer tasks with fewer bids
        createdAt: -1,
      })
      .limit(limit);

    // Add recommendation reasons
    const tasksWithReasons = recommendedTasks.map((task) => {
      const reasons = [];

      if (preferredCategories.includes(task.category)) {
        reasons.push(`You've worked on ${task.category} tasks before`);
      }

      if (user.skills && task.tags.some((tag) => user.skills.includes(tag))) {
        reasons.push("Matches your skills");
      }

      if (task.isUrgent) {
        reasons.push("Urgent task");
      }

      if (task.bidCount < 3) {
        reasons.push("Low competition");
      }

      return {
        ...task.toObject(),
        recommendationReasons: reasons,
      };
    });

    res.status(200).json({
      success: true,
      count: tasksWithReasons.length,
      data: tasksWithReasons,
    });
  } catch (error) {
    console.error("Get recommended bids error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching recommendations",
    });
  }
};

// @desc    Get bid history analytics
// @route   GET /api/bids/analytics
// @access  Private
const getBidAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days, 10) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Bid performance over time
    const bidPerformance = await Bid.aggregate([
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

    // Success rate by category
    const categorySuccess = await Bid.aggregate([
      {
        $match: {
          bidder: userId,
        },
      },
      {
        $lookup: {
          from: "tasks",
          localField: "task",
          foreignField: "_id",
          as: "taskInfo",
        },
      },
      {
        $group: {
          _id: { $arrayElemAt: ["$taskInfo.category", 0] },
          totalBids: { $sum: 1 },
          acceptedBids: {
            $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] },
          },
          avgAmount: { $avg: "$amount" },
        },
      },
      {
        $addFields: {
          successRate: {
            $multiply: [{ $divide: ["$acceptedBids", "$totalBids"] }, 100],
          },
        },
      },
      {
        $sort: { successRate: -1 },
      },
    ]);

    // Competitive analysis
    const competitiveAnalysis = await Bid.aggregate([
      {
        $match: {
          bidder: userId,
          status: { $in: ["Accepted", "Rejected"] },
        },
      },
      {
        $lookup: {
          from: "bids",
          localField: "task",
          foreignField: "task",
          as: "allBids",
        },
      },
      {
        $addFields: {
          totalBidsOnTask: { $size: "$allBids" },
          userRank: {
            $size: {
              $filter: {
                input: "$allBids",
                cond: { $lt: ["$$this.amount", "$amount"] },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          avgCompetition: { $avg: "$totalBidsOnTask" },
          avgRank: { $avg: { $add: ["$userRank", 1] } },
          winsInHighCompetition: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Accepted"] },
                    { $gte: ["$totalBidsOnTask", 5] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        bidPerformance,
        categorySuccess,
        competitiveAnalysis: competitiveAnalysis[0] || {},
        period: `${days} days`,
      },
    });
  } catch (error) {
    console.error("Get bid analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching bid analytics",
    });
  }
};

module.exports = {
  createBid,
  getBids,
  getBid,
  updateBid,
  withdrawBid,
  deleteBid,
  getBidStats,
  highlightBid,
  getRecommendedBids,
  getBidAnalytics,
};
