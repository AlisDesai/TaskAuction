// server/routes/chat.js
const express = require("express");
const { body, query, param } = require("express-validator");
const {
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
} = require("../controllers/chatController");
const {
  protect,
  checkTaskInvolvement,
  messageLimit,
} = require("../middleware/auth");
const {
  uploadChatFiles,
  handleUploadError,
  processUploadedFiles,
} = require("../middleware/upload");

const router = express.Router();

// Validation rules
const getConversationValidation = [
  param("taskId")
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ObjectId"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

const sendMessageValidation = [
  param("taskId")
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ObjectId"),

  body("content")
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Message content must be between 1 and 2000 characters"),

  body("type")
    .optional()
    .isIn(["text", "file", "image", "system"])
    .withMessage("Message type must be one of: text, file, image, system"),

  body("replyTo")
    .optional()
    .isMongoId()
    .withMessage("Reply to must be a valid MongoDB ObjectId"),

  body("priority")
    .optional()
    .isIn(["low", "normal", "high"])
    .withMessage("Priority must be one of: low, normal, high"),
];

const editMessageValidation = [
  param("id")
    .isMongoId()
    .withMessage("Message ID must be a valid MongoDB ObjectId"),

  body("content")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Message content must be between 1 and 2000 characters"),
];

const addReactionValidation = [
  param("id")
    .isMongoId()
    .withMessage("Message ID must be a valid MongoDB ObjectId"),

  body("emoji")
    .isIn(["👍", "👎", "❤️", "😂", "😮", "😢", "😡"])
    .withMessage("Emoji must be one of the allowed reactions"),
];

const searchMessagesValidation = [
  param("taskId")
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ObjectId"),

  query("q")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Search query must be between 2 and 100 characters"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
];

const getConversationsValidation = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("Limit must be between 1 and 20"),
];

const downloadFileValidation = [
  param("messageId")
    .isMongoId()
    .withMessage("Message ID must be a valid MongoDB ObjectId"),

  param("filename")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Filename must be between 1 and 255 characters")
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage("Filename contains invalid characters"),
];

// All chat routes require authentication
router.use(protect);

// Conversation routes
router.get("/conversations", getConversationsValidation, getConversations);
router.get("/unread-count", getUnreadCount);
router.get("/stats", getChatStats);

// Task-specific conversation routes
router.get(
  "/task/:taskId",
  checkTaskInvolvement,
  getConversationValidation,
  getConversation
);
router.post(
  "/task/:taskId",
  checkTaskInvolvement,
  messageLimit,
  uploadChatFiles.single("file"),
  handleUploadError,
  processUploadedFiles,
  sendMessageValidation,
  sendMessage
);
router.post(
  "/task/:taskId/mark-read",
  checkTaskInvolvement,
  markConversationAsRead
);
router.get(
  "/task/:taskId/search",
  checkTaskInvolvement,
  searchMessagesValidation,
  searchMessages
);

// Message-specific routes
router.get("/messages/:id", getMessage);
router.put("/messages/:id", editMessageValidation, editMessage);
router.delete("/messages/:id", deleteMessage);
router.post("/messages/:id/reaction", addReactionValidation, addReaction);
router.delete("/messages/:id/reaction", removeReaction);

// File download route
router.get("/files/:messageId/:filename", downloadFileValidation, downloadFile);

module.exports = router;
