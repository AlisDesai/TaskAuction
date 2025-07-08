// server/routes/bids.js
const express = require("express");
const { body, query, param } = require("express-validator");
const {
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
} = require("../controllers/bidController");
const {
  protect,
  checkBidOwnership,
  bidCreationLimit,
} = require("../middleware/auth");

const router = express.Router();

// Validation rules
const createBidValidation = [
  body("taskId")
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ObjectId"),

  body("amount")
    .isFloat({ min: 50, max: 2000 })
    .withMessage("Bid amount must be between ₹50 and ₹2000"),

  body("proposedTimeline")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Proposed timeline must be between 5 and 200 characters"),

  body("message")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Message cannot exceed 1000 characters"),

  body("experience")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Experience description cannot exceed 500 characters"),

  body("deliverables")
    .optional()
    .custom((value) => {
      if (value) {
        const deliverables = Array.isArray(value)
          ? value
          : value.split(",").map((d) => d.trim());
        if (deliverables.length > 10) {
          throw new Error("Cannot have more than 10 deliverables");
        }
        for (const deliverable of deliverables) {
          if (deliverable.length > 100) {
            throw new Error("Each deliverable cannot exceed 100 characters");
          }
        }
      }
      return true;
    }),

  body("portfolio")
    .optional()
    .isArray({ max: 5 })
    .withMessage("Portfolio cannot have more than 5 items"),

  body("portfolio.*.title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Portfolio title must be between 1 and 100 characters"),

  body("portfolio.*.url")
    .optional()
    .isURL()
    .withMessage("Portfolio URL must be a valid URL"),

  body("portfolio.*.description")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Portfolio description cannot exceed 200 characters"),
];

const updateBidValidation = [
  body("amount")
    .optional()
    .isFloat({ min: 50, max: 2000 })
    .withMessage("Bid amount must be between ₹50 and ₹2000"),

  body("proposedTimeline")
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Proposed timeline must be between 5 and 200 characters"),

  body("message")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Message cannot exceed 1000 characters"),

  body("experience")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Experience description cannot exceed 500 characters"),

  body("deliverables")
    .optional()
    .custom((value) => {
      if (value) {
        const deliverables = Array.isArray(value)
          ? value
          : value.split(",").map((d) => d.trim());
        if (deliverables.length > 10) {
          throw new Error("Cannot have more than 10 deliverables");
        }
        for (const deliverable of deliverables) {
          if (deliverable.length > 100) {
            throw new Error("Each deliverable cannot exceed 100 characters");
          }
        }
      }
      return true;
    }),

  body("portfolio")
    .optional()
    .isArray({ max: 5 })
    .withMessage("Portfolio cannot have more than 5 items"),
];

const getBidsValidation = [
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
    .isIn(["my-bids", "received"])
    .withMessage("Type must be either my-bids or received"),

  query("taskId")
    .optional()
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ObjectId"),

  query("status")
    .optional()
    .isIn(["Pending", "Accepted", "Rejected", "Withdrawn"])
    .withMessage(
      "Status must be one of: Pending, Accepted, Rejected, Withdrawn"
    ),

  query("minAmount")
    .optional()
    .isFloat({ min: 50 })
    .withMessage("Minimum amount must be at least ₹50"),

  query("maxAmount")
    .optional()
    .isFloat({ max: 2000 })
    .withMessage("Maximum amount cannot exceed ₹2000"),

  query("sort")
    .optional()
    .isIn(["newest", "oldest", "amount_low", "amount_high"])
    .withMessage(
      "Sort must be one of: newest, oldest, amount_low, amount_high"
    ),
];

const getBidStatsValidation = [
  param("taskId")
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ObjectId"),
];

const getRecommendationsValidation = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("Limit must be between 1 and 20"),
];

const getAnalyticsValidation = [
  query("days")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Days must be between 1 and 365"),
];

// Protected routes - all bid routes require authentication
router.use(protect);

// Main bid routes
router.post("/", bidCreationLimit, createBidValidation, createBid);
router.get("/", getBidsValidation, getBids);
router.get(
  "/recommendations",
  getRecommendationsValidation,
  getRecommendedBids
);
router.get("/analytics", getAnalyticsValidation, getBidAnalytics);

// Specific bid routes
router.get("/:id", getBid);
router.put("/:id", checkBidOwnership, updateBidValidation, updateBid);
router.delete("/:id", checkBidOwnership, deleteBid);

// Bid actions
router.post("/:id/withdraw", checkBidOwnership, withdrawBid);
router.post("/:id/highlight", checkBidOwnership, highlightBid);

// Bid statistics for task owners
router.get("/task/:taskId/stats", getBidStatsValidation, getBidStats);

module.exports = router;
