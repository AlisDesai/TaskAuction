// server/routes/auth.js
const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  verifyToken,
  deleteAccount,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const {
  uploadAvatar,
  handleUploadError,
  processUploadedFiles,
} = require("../middleware/upload");

const router = express.Router();

// Validation rules
const registerValidation = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("First name can only contain letters and spaces"),

  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Last name can only contain letters and spaces"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address")
    .isLength({ max: 100 })
    .withMessage("Email cannot exceed 100 characters"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),

  body("college")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("College name must be between 2 and 100 characters"),

  body("phone")
    .matches(/^\+?[1-9]\d{9,14}$/)
    .withMessage("Please provide a valid phone number"),
];

const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password").notEmpty().withMessage("Password is required"),
];

const updateProfileValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("First name can only contain letters and spaces"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Last name can only contain letters and spaces"),

  body("phone")
    .optional()
    .matches(/^\+?[1-9]\d{9,14}$/)
    .withMessage("Please provide a valid phone number"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),

  body("location")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location cannot exceed 100 characters"),

  body("skills")
    .optional()
    .custom((value) => {
      if (typeof value === "string") {
        const skills = value.split(",").map((s) => s.trim());
        if (skills.length > 10) {
          throw new Error("Cannot have more than 10 skills");
        }
        for (const skill of skills) {
          if (skill.length > 50) {
            throw new Error("Each skill cannot exceed 50 characters");
          }
        }
      } else if (Array.isArray(value)) {
        if (value.length > 10) {
          throw new Error("Cannot have more than 10 skills");
        }
        for (const skill of value) {
          if (typeof skill !== "string" || skill.length > 50) {
            throw new Error(
              "Each skill must be a string and cannot exceed 50 characters"
            );
          }
        }
      }
      return true;
    }),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
];

// Public routes
router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.get("/verify", verifyToken);

// Protected routes
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfileValidation, updateProfile);
router.put("/password", protect, changePasswordValidation, changePassword);
router.delete("/account", protect, deleteAccount);

// Avatar upload route
router.post(
  "/avatar",
  protect,
  uploadAvatar.single("avatar"),
  handleUploadError,
  processUploadedFiles,
  require("../controllers/userController").uploadAvatar
);

router.delete(
  "/avatar",
  protect,
  require("../controllers/userController").deleteAvatar
);

module.exports = router;
