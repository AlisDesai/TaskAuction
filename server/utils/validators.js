// server/utils/validators.js
const { body, query, param } = require("express-validator");

// Common validation patterns
const mongoIdPattern = /^[0-9a-fA-F]{24}$/;
const phonePattern = /^\+?[1-9]\d{9,14}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Task categories
const TASK_CATEGORIES = [
  "Academic",
  "Campus Life",
  "Tech Help",
  "Personal",
  "Other",
];

// Task and bid statuses
const TASK_STATUSES = [
  "Open",
  "Assigned",
  "In-Progress",
  "Completed",
  "Closed",
];
const BID_STATUSES = ["Pending", "Accepted", "Rejected", "Withdrawn"];

// Common field validators
const validateMongoId = (field = "id") => {
  return param(field)
    .matches(mongoIdPattern)
    .withMessage(`${field} must be a valid MongoDB ObjectId`);
};

const validateEmail = (required = true) => {
  const validator = body("email").isEmail().normalizeEmail();
  return required ? validator.notEmpty() : validator.optional();
};

const validatePassword = (field = "password", required = true) => {
  const validator = body(field)
    .isLength({ min: 6 })
    .withMessage(`${field} must be at least 6 characters long`)
    .matches(passwordPattern)
    .withMessage(
      `${field} must contain at least one uppercase letter, one lowercase letter, and one number`
    );

  return required ? validator.notEmpty() : validator.optional();
};

const validatePhone = (required = true) => {
  const validator = body("phone").matches(phonePattern);
  return required ? validator.notEmpty() : validator.optional();
};

const validateName = (field, required = true) => {
  const validator = body(field)
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage(`${field} must be between 2 and 50 characters`)
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage(`${field} can only contain letters and spaces`);

  return required ? validator.notEmpty() : validator.optional();
};

const validateBudget = (minField = "budget.min", maxField = "budget.max") => {
  return [
    body(minField)
      .isFloat({ min: 50, max: 2000 })
      .withMessage("Minimum budget must be between ₹50 and ₹2000"),

    body(maxField)
      .isFloat({ min: 50, max: 2000 })
      .withMessage("Maximum budget must be between ₹50 and ₹2000")
      .custom((value, { req }) => {
        const minBudget = req.body.budget?.min || req.body.minBudget;
        if (parseFloat(value) < parseFloat(minBudget)) {
          throw new Error(
            "Maximum budget must be greater than or equal to minimum budget"
          );
        }
        return true;
      }),
  ];
};

const validatePagination = () => {
  return [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ];
};

// Specific validators for different entities

// User validators
const userValidators = {
  register: [
    validateName("firstName"),
    validateName("lastName"),
    validateEmail(),
    validatePassword(),
    body("college")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("College name must be between 2 and 100 characters"),
    validatePhone(),
  ],

  login: [
    validateEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],

  updateProfile: [
    validateName("firstName", false),
    validateName("lastName", false),
    validatePhone(false),
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
          skills.forEach((skill) => {
            if (skill.length > 50) {
              throw new Error("Each skill cannot exceed 50 characters");
            }
          });
        } else if (Array.isArray(value)) {
          if (value.length > 10) {
            throw new Error("Cannot have more than 10 skills");
          }
          value.forEach((skill) => {
            if (typeof skill !== "string" || skill.length > 50) {
              throw new Error(
                "Each skill must be a string and cannot exceed 50 characters"
              );
            }
          });
        }
        return true;
      }),
  ],

  changePassword: [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    validatePassword("newPassword"),
  ],
};

// Task validators
const taskValidators = {
  create: [
    body("title")
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage("Title must be between 5 and 100 characters"),

    body("description")
      .trim()
      .isLength({ min: 20, max: 2000 })
      .withMessage("Description must be between 20 and 2000 characters"),

    body("category")
      .isIn(TASK_CATEGORIES)
      .withMessage(`Category must be one of: ${TASK_CATEGORIES.join(", ")}`),

    ...validateBudget(),

    body("deadline")
      .isISO8601()
      .withMessage("Deadline must be a valid date")
      .custom((value) => {
        const deadline = new Date(value);
        const now = new Date();
        const maxDeadline = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

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
          tags.forEach((tag) => {
            if (tag.length > 30) {
              throw new Error("Each tag cannot exceed 30 characters");
            }
          });
        }
        return true;
      }),
  ],

  update: [
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
      .isIn(TASK_CATEGORIES)
      .withMessage(`Category must be one of: ${TASK_CATEGORIES.join(", ")}`),

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
  ],

  filters: [
    ...validatePagination(),
    query("search")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Search query must be between 2 and 100 characters"),

    query("category")
      .optional()
      .isIn(TASK_CATEGORIES)
      .withMessage(`Category must be one of: ${TASK_CATEGORIES.join(", ")}`),

    query("status")
      .optional()
      .isIn(TASK_STATUSES)
      .withMessage(`Status must be one of: ${TASK_STATUSES.join(", ")}`),

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
      .withMessage(
        "Deadline filter must be one of: today, week, month, urgent"
      ),

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
  ],

  complete: [
    body("rating")
      .optional()
      .isFloat({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),

    body("review")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Review cannot exceed 500 characters"),
  ],
};

// Bid validators
const bidValidators = {
  create: [
    body("taskId")
      .matches(mongoIdPattern)
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
          deliverables.forEach((deliverable) => {
            if (deliverable.length > 100) {
              throw new Error("Each deliverable cannot exceed 100 characters");
            }
          });
        }
        return true;
      }),

    body("portfolio")
      .optional()
      .isArray({ max: 5 })
      .withMessage("Portfolio cannot have more than 5 items"),
  ],

  update: [
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
  ],

  filters: [
    ...validatePagination(),
    query("type")
      .optional()
      .isIn(["my-bids", "received"])
      .withMessage("Type must be either my-bids or received"),

    query("taskId")
      .optional()
      .matches(mongoIdPattern)
      .withMessage("Task ID must be a valid MongoDB ObjectId"),

    query("status")
      .optional()
      .isIn(BID_STATUSES)
      .withMessage(`Status must be one of: ${BID_STATUSES.join(", ")}`),

    query("sort")
      .optional()
      .isIn(["newest", "oldest", "amount_low", "amount_high"])
      .withMessage(
        "Sort must be one of: newest, oldest, amount_low, amount_high"
      ),
  ],
};

// Chat validators
const chatValidators = {
  sendMessage: [
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
      .matches(mongoIdPattern)
      .withMessage("Reply to must be a valid MongoDB ObjectId"),

    body("priority")
      .optional()
      .isIn(["low", "normal", "high"])
      .withMessage("Priority must be one of: low, normal, high"),
  ],

  editMessage: [
    body("content")
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage("Message content must be between 1 and 2000 characters"),
  ],

  addReaction: [
    body("emoji")
      .isIn(["👍", "👎", "❤️", "😂", "😮", "😢", "😡"])
      .withMessage("Emoji must be one of the allowed reactions"),
  ],

  search: [
    query("q")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Search query must be between 2 and 100 characters"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
};

// Custom validation functions
const customValidators = {
  // Validate file type
  validateFileType: (allowedTypes) => (req, res, next) => {
    if (req.file) {
      const fileType = req.file.mimetype;
      if (!allowedTypes.includes(fileType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid file type. Allowed types: ${allowedTypes.join(
            ", "
          )}`,
        });
      }
    }
    next();
  },

  // Validate file size
  validateFileSize: (maxSize) => (req, res, next) => {
    if (req.file && req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File size too large. Maximum size: ${
          maxSize / (1024 * 1024)
        }MB`,
      });
    }
    next();
  },

  // Validate array length
  validateArrayLength: (field, min = 0, max = 10) => {
    return body(field)
      .optional()
      .isArray({ min, max })
      .withMessage(`${field} must be an array with ${min}-${max} items`);
  },

  // Validate future date
  validateFutureDate: (field) => {
    return body(field).custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error(`${field} must be in the future`);
      }
      return true;
    });
  },

  // Validate college email domain
  validateCollegeEmail: () => {
    return body("email").custom((value) => {
      const domain = value.split("@")[1];
      const collegeDomains = [
        ".edu",
        ".ac.",
        "university",
        "college",
        "institute",
      ];
      const isValid = collegeDomains.some(
        (collegeDomain) =>
          domain.includes(collegeDomain) || domain.endsWith(".edu")
      );

      if (!isValid) {
        throw new Error("Please use a valid college/university email address");
      }
      return true;
    });
  },
};

module.exports = {
  // Validation patterns
  mongoIdPattern,
  phonePattern,
  passwordPattern,
  emailPattern,

  // Constants
  TASK_CATEGORIES,
  TASK_STATUSES,
  BID_STATUSES,

  // Common validators
  validateMongoId,
  validateEmail,
  validatePassword,
  validatePhone,
  validateName,
  validateBudget,
  validatePagination,

  // Entity-specific validators
  userValidators,
  taskValidators,
  bidValidators,
  chatValidators,

  // Custom validators
  customValidators,
};
