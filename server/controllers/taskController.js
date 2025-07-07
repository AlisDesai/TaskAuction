// server/controllers/taskController.js
const { validationResult } = require("express-validator");
const Task = require("../models/Task");
const Bid = require("../models/Bid");
const User = require("../models/User");
const { deleteFile } = require("../middleware/upload");

// @desc    Get all tasks with filters and pagination
// @route   GET /api/tasks
// @access  Public
const getTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    // Build query
    const query = {};

    // Filter by status (default to Open for public view)
    if (req.query.status) {
      query.status = req.query.status;
    } else if (!req.user) {
      query.status = "Open"; // Only show open tasks to non-authenticated users
    }

    // Search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by budget range
    if (req.query.minBudget || req.query.maxBudget) {
      query.$and = [];
      if (req.query.minBudget) {
        query.$and.push({
          "budget.min": { $gte: parseInt(req.query.minBudget) },
        });
      }
      if (req.query.maxBudget) {
        query.$and.push({
          "budget.max": { $lte: parseInt(req.query.maxBudget) },
        });
      }
    }

    // Filter by deadline
    if (req.query.deadline) {
      const deadlineFilter = req.query.deadline;
      const now = new Date();

      switch (deadlineFilter) {
        case "today":
          query.deadline = {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          };
          break;
        case "week":
          query.deadline = {
            $gte: now,
            $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          };
          break;
        case "month":
          query.deadline = {
            $gte: now,
            $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          };
          break;
        case "urgent":
          query.isUrgent = true;
          break;
      }
    }

    // Filter by location
    if (req.query.location) {
      query.location = new RegExp(req.query.location, "i");
    }

    // Filter by college (if user is authenticated)
    if (req.query.sameCollege && req.user) {
      const poster = await User.findById(req.user.id);
      if (poster) {
        query["poster.college"] = poster.college;
      }
    }

    // Sort options
    let sort = {};
    switch (req.query.sort) {
      case "newest":
        sort = { createdAt: -1 };
        break;
      case "oldest":
        sort = { createdAt: 1 };
        break;
      case "deadline":
        sort = { deadline: 1 };
        break;
      case "budget_high":
        sort = { "budget.max": -1 };
        break;
      case "budget_low":
        sort = { "budget.min": 1 };
        break;
      case "popular":
        sort = { bidCount: -1 };
        break;
      case "urgent":
        sort = { isUrgent: -1, deadline: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Execute query
    const tasks = await Task.find(query)
      .populate("poster", "firstName lastName avatar rating college")
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

    // Add user-specific data if authenticated
    if (req.user) {
      for (let task of tasks) {
        // Check if user has already bidded
        const userBid = await Bid.findOne({
          task: task._id,
          bidder: req.user.id,
          status: { $ne: "Withdrawn" },
        });
        task._doc.userHasBidded = !!userBid;
        task._doc.userBid = userBid;
      }
    }

    res.status(200).json({
      success: true,
      count: tasks.length,
      pagination,
      data: tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching tasks",
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Public
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("poster", "firstName lastName avatar rating college phone")
      .populate("assignedTo", "firstName lastName avatar rating")
      .populate("acceptedBid");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check access permissions
    if (!req.user) {
      // Non-authenticated users can only see open tasks
      if (task.status !== "Open") {
        return res.status(403).json({
          success: false,
          message: "This task is not publicly accessible",
        });
      }
      // Hide sensitive info for non-authenticated users
      if (task.poster.phone) task.poster.phone = undefined;
    } else {
      // Check if user is involved in the task
      const isOwner = task.poster._id.toString() === req.user.id;
      const isAssigned =
        task.assignedTo && task.assignedTo._id.toString() === req.user.id;

      if (!isOwner && !isAssigned && task.status !== "Open") {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access this task",
        });
      }

      // Add user-specific data
      const userBid = await Bid.findOne({
        task: task._id,
        bidder: req.user.id,
        status: { $ne: "Withdrawn" },
      });

      task._doc.userHasBidded = !!userBid;
      task._doc.userBid = userBid;
      task._doc.isOwner = isOwner;
      task._doc.isAssigned = isAssigned;
    }

    // Get bid statistics
    const bidStats = await Bid.aggregate([
      { $match: { task: task._id, status: "Pending" } },
      {
        $group: {
          _id: null,
          avgAmount: { $avg: "$amount" },
          minAmount: { $min: "$amount" },
          maxAmount: { $max: "$amount" },
          totalBids: { $sum: 1 },
        },
      },
    ]);

    task._doc.bidStatistics = bidStats[0] || {
      avgAmount: 0,
      minAmount: 0,
      maxAmount: 0,
      totalBids: 0,
    };

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching task",
    });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
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

    const { title, description, category, budget, deadline, location, tags } =
      req.body;

    // Validate budget range
    if (budget.min > budget.max) {
      return res.status(400).json({
        success: false,
        message: "Minimum budget cannot be greater than maximum budget",
      });
    }

    // Process uploaded files
    const images = [];
    const attachments = [];

    if (req.filesInfo) {
      if (req.filesInfo.images) {
        images.push(...req.filesInfo.images);
      }
      if (req.filesInfo.documents) {
        attachments.push(...req.filesInfo.documents);
      }
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      category,
      budget: {
        min: parseFloat(budget.min),
        max: parseFloat(budget.max),
      },
      deadline: new Date(deadline),
      location,
      images,
      attachments,
      poster: req.user.id,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
    });

    // Populate poster info
    await task.populate("poster", "firstName lastName avatar rating");

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "stats.tasksPosted": 1 },
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    // Clean up uploaded files on error
    if (req.files) {
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
      message: "Server error creating task",
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (Task Owner)
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if task can be edited
    if (!task.canBeEdited()) {
      return res.status(400).json({
        success: false,
        message: "Task cannot be edited after receiving bids",
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

    const { title, description, category, budget, deadline, location, tags } =
      req.body;

    // Validate budget range if provided
    if (budget && budget.min > budget.max) {
      return res.status(400).json({
        success: false,
        message: "Minimum budget cannot be greater than maximum budget",
      });
    }

    // Update fields
    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (category) updateFields.category = category;
    if (budget) {
      updateFields.budget = {
        min: parseFloat(budget.min),
        max: parseFloat(budget.max),
      };
    }
    if (deadline) updateFields.deadline = new Date(deadline);
    if (location !== undefined) updateFields.location = location;
    if (tags !== undefined) {
      updateFields.tags = tags ? tags.split(",").map((tag) => tag.trim()) : [];
    }

    // Process new uploaded files if any
    if (req.filesInfo) {
      if (req.filesInfo.images) {
        updateFields.$push = { images: { $each: req.filesInfo.images } };
      }
      if (req.filesInfo.documents) {
        updateFields.$push = {
          ...updateFields.$push,
          attachments: { $each: req.filesInfo.documents },
        };
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateFields,
      {
        new: true,
        runValidators: true,
      }
    ).populate("poster", "firstName lastName avatar rating");

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error);

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
      message: "Server error updating task",
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Task Owner)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if task can be deleted
    if (task.status !== "Open" || task.bidCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete task with bids or after assignment",
      });
    }

    // Delete associated files
    for (const image of task.images) {
      const imagePath = image.url.replace(
        `${req.protocol}://${req.get("host")}`,
        "."
      );
      await deleteFile(imagePath);
    }

    for (const attachment of task.attachments) {
      const attachmentPath = attachment.url.replace(
        `${req.protocol}://${req.get("host")}`,
        "."
      );
      await deleteFile(attachmentPath);
    }

    // Delete the task
    await Task.findByIdAndDelete(req.params.id);

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "stats.tasksPosted": -1 },
    });

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting task",
    });
  }
};

// @desc    Get task bids
// @route   GET /api/tasks/:id/bids
// @access  Private (Task Owner)
const getTaskBids = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Build query
    const query = { task: req.params.id };

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    } else {
      query.status = { $ne: "Withdrawn" }; // Exclude withdrawn bids by default
    }

    // Sort options
    let sort = { createdAt: -1 };
    if (req.query.sort === "amount_low") {
      sort = { amount: 1 };
    } else if (req.query.sort === "amount_high") {
      sort = { amount: -1 };
    } else if (req.query.sort === "rating") {
      sort = { "bidder.rating.average": -1 };
    }

    // Execute query
    const bids = await Bid.find(query)
      .populate("bidder", "firstName lastName avatar rating stats")
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
    console.error("Get task bids error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching task bids",
    });
  }
};

// @desc    Accept bid
// @route   POST /api/tasks/:id/bids/:bidId/accept
// @access  Private (Task Owner)
const acceptBid = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    const bid = await Bid.findById(req.params.bidId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: "Bid not found",
      });
    }

    // Check if task can receive bids
    if (!task.canReceiveBids()) {
      return res.status(400).json({
        success: false,
        message: "This task is no longer accepting bids",
      });
    }

    // Check if bid belongs to this task
    if (bid.task.toString() !== task._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Bid does not belong to this task",
      });
    }

    // Check if bid is pending
    if (bid.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending bids can be accepted",
      });
    }

    // Accept the bid
    await bid.accept();

    // Update task
    task.status = "Assigned";
    task.assignedTo = bid.bidder;
    task.acceptedBid = bid._id;
    await task.save();

    // Reject all other pending bids
    await Bid.updateMany(
      {
        task: task._id,
        status: "Pending",
        _id: { $ne: bid._id },
      },
      {
        status: "Rejected",
        rejectedAt: new Date(),
      }
    );

    // Populate the response
    await bid.populate("bidder", "firstName lastName avatar rating");
    await task.populate("assignedTo", "firstName lastName avatar rating");

    res.status(200).json({
      success: true,
      message: "Bid accepted successfully",
      data: {
        task,
        acceptedBid: bid,
      },
    });
  } catch (error) {
    console.error("Accept bid error:", error);
    res.status(500).json({
      success: false,
      message: "Server error accepting bid",
    });
  }
};

// @desc    Mark task as completed
// @route   POST /api/tasks/:id/complete
// @access  Private (Task Owner)
const completeTask = async (req, res) => {
  try {
    const { rating, review } = req.body;

    const task = await Task.findById(req.params.id).populate(
      "assignedTo",
      "firstName lastName avatar rating"
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (task.status !== "In-Progress") {
      return res.status(400).json({
        success: false,
        message: "Only in-progress tasks can be marked as completed",
      });
    }

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Update task
    task.status = "Completed";
    task.completionDate = new Date();
    if (rating) {
      task.rating.bidderRating = rating;
      task.rating.review = review || "";
    }
    await task.save();

    // Update bidder's rating and stats
    if (rating && task.assignedTo) {
      const bidder = await User.findById(task.assignedTo._id);
      bidder.updateRating(rating);
      bidder.stats.tasksCompleted += 1;
      await bidder.save();
    }

    // Update accepted bid amount to user earnings
    const acceptedBid = await Bid.findById(task.acceptedBid);
    if (acceptedBid) {
      await User.findByIdAndUpdate(task.assignedTo._id, {
        $inc: { "stats.totalEarnings": acceptedBid.amount },
      });

      await User.findByIdAndUpdate(task.poster, {
        $inc: { "stats.totalSpent": acceptedBid.amount },
      });
    }

    res.status(200).json({
      success: true,
      message: "Task marked as completed successfully",
      data: task,
    });
  } catch (error) {
    console.error("Complete task error:", error);
    res.status(500).json({
      success: false,
      message: "Server error completing task",
    });
  }
};

// @desc    Start task (bidder marks as in-progress)
// @route   POST /api/tasks/:id/start
// @access  Private (Assigned Bidder)
const startTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!task.assignedTo || task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned bidder can start this task",
      });
    }

    if (task.status !== "Assigned") {
      return res.status(400).json({
        success: false,
        message: "Only assigned tasks can be started",
      });
    }

    // Update task status
    task.status = "In-Progress";
    await task.save();

    res.status(200).json({
      success: true,
      message: "Task started successfully",
      data: task,
    });
  } catch (error) {
    console.error("Start task error:", error);
    res.status(500).json({
      success: false,
      message: "Server error starting task",
    });
  }
};

// @desc    Close task
// @route   POST /api/tasks/:id/close
// @access  Private (Task Owner)
const closeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (task.status === "Closed") {
      return res.status(400).json({
        success: false,
        message: "Task is already closed",
      });
    }

    // Update task status
    task.status = "Closed";
    await task.save();

    // If task had pending bids, reject them
    await Bid.updateMany(
      {
        task: task._id,
        status: "Pending",
      },
      {
        status: "Rejected",
        rejectedAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: "Task closed successfully",
      data: task,
    });
  } catch (error) {
    console.error("Close task error:", error);
    res.status(500).json({
      success: false,
      message: "Server error closing task",
    });
  }
};

// @desc    Remove task image/attachment
// @route   DELETE /api/tasks/:id/files/:fileId
// @access  Private (Task Owner)
const removeTaskFile = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!task.canBeEdited()) {
      return res.status(400).json({
        success: false,
        message: "Cannot modify files after receiving bids",
      });
    }

    const { fileId } = req.params;
    const { type } = req.query; // 'image' or 'attachment'

    let fileToRemove = null;
    let filePath = null;

    if (type === "image") {
      const imageIndex = task.images.findIndex(
        (img) => img._id.toString() === fileId
      );
      if (imageIndex > -1) {
        fileToRemove = task.images[imageIndex];
        filePath = fileToRemove.url.replace(
          `${req.protocol}://${req.get("host")}`,
          "."
        );
        task.images.splice(imageIndex, 1);
      }
    } else if (type === "attachment") {
      const attachmentIndex = task.attachments.findIndex(
        (att) => att._id.toString() === fileId
      );
      if (attachmentIndex > -1) {
        fileToRemove = task.attachments[attachmentIndex];
        filePath = fileToRemove.url.replace(
          `${req.protocol}://${req.get("host")}`,
          "."
        );
        task.attachments.splice(attachmentIndex, 1);
      }
    }

    if (!fileToRemove) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Delete file from filesystem
    await deleteFile(filePath);

    // Save task
    await task.save();

    res.status(200).json({
      success: true,
      message: "File removed successfully",
    });
  } catch (error) {
    console.error("Remove task file error:", error);
    res.status(500).json({
      success: false,
      message: "Server error removing file",
    });
  }
};

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTaskBids,
  acceptBid,
  completeTask,
  startTask,
  closeTask,
  removeTaskFile,
};
