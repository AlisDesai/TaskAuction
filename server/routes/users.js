// server/routes/users.js
const express = require("express");
const { body, query } = require("express-validator");
const {
  getUsers,
  getUserProfile,
  uploadAvatar,
  deleteAvatar,
  getDashboard,
  getUserTasks,
  getUserBids,
  getUserAnalytics,
} = require("../controllers/userController");
const { protect, optionalAuth } = require("../middleware/auth");
const {
  uploadAvatar: upload,
  handleUploadError,
  processUploadedFiles,
} = require("../middleware/upload");

const router = express.Router();

// Validation rules
const getUsersValidation = [
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

  query("skills")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        const skills = value.split(",").map((s) => s.trim());
        if (skills.some((skill) => skill.length > 50)) {
          throw new Error("Each skill cannot exceed 50 characters");
        }
      }
      return true;
    }),

  query("sort")
    .optional()
    .isIn(["rating", "newest", "name", "tasksCompleted"])
    .withMessage("Sort must be one of: rating, newest, name, tasksCompleted"),
];

const getUserTasksValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),

  query("type")
    .optional()
    .isIn(["posted", "assigned", "bidded"])
    .withMessage("Type must be one of: posted, assigned, bidded"),

  query("status")
    .optional()
    .isIn(["Open", "Assigned", "In-Progress", "Completed", "Closed"])
    .withMessage(
      "Status must be one of: Open, Assigned, In-Progress, Completed, Closed"
    ),

  query("sort")
    .optional()
    .isIn(["newest", "deadline", "budget"])
    .withMessage("Sort must be one of: newest, deadline, budget"),
];

const getUserBidsValidation = [
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
    .isIn(["newest", "amount"])
    .withMessage("Sort must be one of: newest, amount"),
];

const getAnalyticsValidation = [
  query("days")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Days must be between 1 and 365"),
];

// Public routes
router.get("/", optionalAuth, getUsersValidation, getUsers);
router.get("/:id", optionalAuth, getUserProfile);

// Protected routes
router.get("/me/dashboard", protect, getDashboard);
router.get("/me/tasks", protect, getUserTasksValidation, getUserTasks);
router.get("/me/bids", protect, getUserBidsValidation, getUserBids);
router.get("/me/analytics", protect, getAnalyticsValidation, getUserAnalytics);

// Avatar upload routes
router.post(
  "/me/avatar",
  protect,
  upload.single("avatar"),
  handleUploadError,
  processUploadedFiles,
  uploadAvatar
);

router.delete("/me/avatar", protect, deleteAvatar);

module.exports = router;
