// server/routes/tasks.js
const express = require("express");
const { body, query, param } = require("express-validator");
const {
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
} = require("../controllers/taskController");
const {
  protect,
  optionalAuth,
  checkTaskOwnership,
  checkTaskInvolvement,
  checkTaskAccess,
  taskCreationLimit,
} = require("../middleware/auth");
const {
  uploadTaskFiles,
  handleUploadError,
  processUploadedFiles,
} = require("../middleware/upload");

const router = express.Router();

// Validation rules
const getTasksValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),

  query("search")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Search query must be between 2 and 100 characters"),

  query("category")
    .optional()
    .isIn(["Academic", "Campus Life", "Tech Help", "Personal", "Other"])
    .withMessage(
      "Category must be one of: Academic, Campus Life, Tech Help, Personal, Other"
    ),

  query("status")
    .optional()
    .isIn(["Open", "Assigned", "In-Progress", "Completed", "Closed"])
    .withMessage(
      "Status must be one of: Open, Assigned, In-Progress, Completed, Closed"
    ),

  query("minBudget")
    .optional()
    .isFloat({ min: 50, max: 2000 })
    .withMessage("Minimum budget must be between 50 and 2000"),

  query("maxBudget")
    .optional()
    .isFloat({ min: 50, max: 2000 })
    .withMessage("Maximum budget must be between 50 and 2000"),

  query("deadline")
    .optional()
    .isIn(["today", "week", "month", "urgent"])
    .withMessage("Deadline filter must be one of: today, week, month, urgent"),

  query("sort")
    .optional()
    .isIn([
      "newest",
      "oldest",
      "deadline",
      "budget_high",
      "budget_low",
      "popular",
      "urgent",
    ])
    .withMessage(
      "Sort must be one of: newest, oldest, deadline, budget_high, budget_low, popular, urgent"
    ),
];

const createTaskValidation = [
  body("title")
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Title must be between 5 and 100 characters"),

  body("description")
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage("Description must be between 20 and 2000 characters"),

  body("category")
    .isIn(["Academic", "Campus Life", "Tech Help", "Personal", "Other"])
    .withMessage(
      "Category must be one of: Academic, Campus Life, Tech Help, Personal, Other"
    ),

  body("budget.min")
    .isFloat({ min: 50, max: 2000 })
    .withMessage("Minimum budget must be between ₹50 and ₹2000"),

  body("budget.max")
    .isFloat({ min: 50, max: 2000 })
    .withMessage("Maximum budget must be between ₹50 and ₹2000")
    .custom((value, { req }) => {
      if (parseFloat(value) < parseFloat(req.body.budget.min)) {
        throw new Error(
          "Maximum budget must be greater than or equal to minimum budget"
        );
      }
      return true;
    }),

  body("deadline")
    .isISO8601()
    .withMessage("Deadline must be a valid date")
    .custom((value) => {
      const deadline = new Date(value);
      const now = new Date();
      const maxDeadline = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

      if (deadline <= now) {
        throw new Error("Deadline must be in the future");
      }

      if (deadline > maxDeadline) {
        throw new Error("Deadline cannot be more than 1 year in the future");
      }

      return true;
    }),

  body("location")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location cannot exceed 100 characters"),

  body("tags")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        const tags = value.split(",").map((tag) => tag.trim());
        if (tags.length > 10) {
          throw new Error("Cannot have more than 10 tags");
        }
        for (const tag of tags) {
          if (tag.length > 30) {
            throw new Error("Each tag cannot exceed 30 characters");
          }
        }
      }
      return true;
    }),
];

const updateTaskValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Title must be between 5 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage("Description must be between 20 and 2000 characters"),

  body("category")
    .optional()
    .isIn(["Academic", "Campus Life", "Tech Help", "Personal", "Other"])
    .withMessage(
      "Category must be one of: Academic, Campus Life, Tech Help, Personal, Other"
    ),

  body("budget.min")
    .optional()
    .isFloat({ min: 50, max: 2000 })
    .withMessage("Minimum budget must be between ₹50 and ₹2000"),

  body("budget.max")
    .optional()
    .isFloat({ min: 50, max: 2000 })
    .withMessage("Maximum budget must be between ₹50 and ₹2000"),

  body("deadline")
    .optional()
    .isISO8601()
    .withMessage("Deadline must be a valid date")
    .custom((value) => {
      if (value) {
        const deadline = new Date(value);
        const now = new Date();

        if (deadline <= now) {
          throw new Error("Deadline must be in the future");
        }
      }
      return true;
    }),

  body("location")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location cannot exceed 100 characters"),
];

const getTaskBidsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),

  query("status")
    .optional()
    .isIn(["Pending", "Accepted", "Rejected", "Withdrawn"])
    .withMessage(
      "Status must be one of: Pending, Accepted, Rejected, Withdrawn"
    ),

  query("sort")
    .optional()
    .isIn(["newest", "amount_low", "amount_high", "rating"])
    .withMessage(
      "Sort must be one of: newest, amount_low, amount_high, rating"
    ),
];

const completeTaskValidation = [
  body("rating")
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("review")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Review cannot exceed 500 characters"),
];

const removeFileValidation = [
  param("fileId")
    .isMongoId()
    .withMessage("File ID must be a valid MongoDB ObjectId"),

  query("type")
    .isIn(["image", "attachment"])
    .withMessage("File type must be either image or attachment"),
];

// Public routes
router.get("/", optionalAuth, getTasksValidation, getTasks);
router.get("/:id", optionalAuth, checkTaskAccess, getTask);

// Protected routes
router.post(
  "/",
  protect,
  taskCreationLimit,
  uploadTaskFiles,
  handleUploadError,
  processUploadedFiles,
  createTaskValidation,
  createTask
);

router.put(
  "/:id",
  protect,
  checkTaskOwnership,
  uploadTaskFiles,
  handleUploadError,
  processUploadedFiles,
  updateTaskValidation,
  updateTask
);

router.delete("/:id", protect, checkTaskOwnership, deleteTask);

// Task bids routes
router.get(
  "/:id/bids",
  protect,
  checkTaskOwnership,
  getTaskBidsValidation,
  getTaskBids
);
router.post("/:id/bids/:bidId/accept", protect, checkTaskOwnership, acceptBid);

// Task status management routes
router.post("/:id/start", protect, checkTaskInvolvement, startTask);
router.post(
  "/:id/complete",
  protect,
  checkTaskOwnership,
  completeTaskValidation,
  completeTask
);
router.post("/:id/close", protect, checkTaskOwnership, closeTask);

// File management routes
router.delete(
  "/:id/files/:fileId",
  protect,
  checkTaskOwnership,
  removeFileValidation,
  removeTaskFile
);

module.exports = router;
