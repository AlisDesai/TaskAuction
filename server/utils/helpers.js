// server/utils/helpers.js
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Date and time utilities
const dateHelpers = {
  // Format date to readable string
  formatDate: (date, format = "YYYY-MM-DD") => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    switch (format) {
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`;
      case "DD/MM/YYYY":
        return `${day}/${month}/${year}`;
      case "YYYY-MM-DD HH:mm":
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      default:
        return d.toLocaleDateString();
    }
  },

  // Get time ago string
  getTimeAgo: (date) => {
    const now = new Date();
    const diffTime = now - new Date(date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60)
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffWeeks < 4)
      return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
    if (diffMonths < 12)
      return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;

    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
  },

  // Check if date is within range
  isDateInRange: (date, startDate, endDate) => {
    const checkDate = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return checkDate >= start && checkDate <= end;
  },

  // Get date range
  getDateRange: (days) => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    return { startDate, endDate };
  },

  // Check if deadline is urgent (within 24 hours)
  isUrgent: (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffHours = (deadlineDate - now) / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours > 0;
  },
};

// String utilities
const stringHelpers = {
  // Capitalize first letter
  capitalize: (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Generate slug from string
  generateSlug: (str) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  },

  // Truncate string
  truncate: (str, length = 100, suffix = "...") => {
    if (str.length <= length) return str;
    return str.substring(0, length).trim() + suffix;
  },

  // Clean phone number
  cleanPhone: (phone) => {
    return phone.replace(/[^\d+]/g, "");
  },

  // Mask email
  maskEmail: (email) => {
    const [username, domain] = email.split("@");
    const maskedUsername =
      username.charAt(0) +
      "*".repeat(username.length - 2) +
      username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  },

  // Generate random string
  generateRandomString: (length = 10) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Extract file extension
  getFileExtension: (filename) => {
    return filename.split(".").pop().toLowerCase();
  },
};

// Number and currency utilities
const numberHelpers = {
  // Format currency
  formatCurrency: (amount, currency = "₹") => {
    return `${currency}${amount.toLocaleString("en-IN")}`;
  },

  // Calculate percentage
  calculatePercentage: (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  },

  // Round to decimal places
  roundTo: (num, decimals = 2) => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  },

  // Generate random number in range
  randomInRange: (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Calculate average
  calculateAverage: (numbers) => {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return sum / numbers.length;
  },
};

// Array utilities
const arrayHelpers = {
  // Remove duplicates
  removeDuplicates: (arr) => {
    return [...new Set(arr)];
  },

  // Chunk array into smaller arrays
  chunk: (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  },

  // Shuffle array
  shuffle: (arr) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // Group array by property
  groupBy: (arr, key) => {
    return arr.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },
};

// Security utilities
const securityHelpers = {
  // Generate JWT token
  generateToken: (payload, expiresIn = "7d") => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  },

  // Verify JWT token
  verifyToken: (token) => {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  },

  // Hash password
  hashPassword: async (password) => {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, rounds);
  },

  // Compare password
  comparePassword: async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
  },

  // Generate verification token
  generateVerificationToken: () => {
    return crypto.randomBytes(32).toString("hex");
  },

  // Generate OTP
  generateOTP: (length = 6) => {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  },

  // Sanitize user input
  sanitizeInput: (input) => {
    if (typeof input !== "string") return input;
    return input.replace(/[<>]/g, "").trim();
  },
};

// File utilities
const fileHelpers = {
  // Get file size in readable format
  formatFileSize: (bytes) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  // Check if file is image
  isImage: (mimetype) => {
    return mimetype.startsWith("image/");
  },

  // Check if file is document
  isDocument: (mimetype) => {
    const documentTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/rtf",
    ];
    return documentTypes.includes(mimetype);
  },

  // Generate unique filename
  generateUniqueFilename: (originalName) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const extension = stringHelpers.getFileExtension(originalName);
    return `${timestamp}-${random}.${extension}`;
  },
};

// Validation utilities
const validationHelpers = {
  // Check if email is from college domain
  isCollegeEmail: (email) => {
    const domain = email.split("@")[1];
    const collegeDomains = [
      ".edu",
      ".ac.",
      "university",
      "college",
      "institute",
    ];
    return collegeDomains.some(
      (collegeDomain) =>
        domain.includes(collegeDomain) || domain.endsWith(".edu")
    );
  },

  // Validate phone number
  isValidPhone: (phone) => {
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(phone);
  },

  // Validate MongoDB ObjectId
  isValidObjectId: (id) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  },

  // Check password strength
  checkPasswordStrength: (password) => {
    const minLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const score = [
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    ].filter(Boolean).length;

    if (score < 3) return "weak";
    if (score < 4) return "medium";
    return "strong";
  },
};

// Response utilities
const responseHelpers = {
  // Success response
  successResponse: (res, data, message = "Success", statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  },

  // Error response
  errorResponse: (
    res,
    message = "Internal server error",
    statusCode = 500,
    errors = null
  ) => {
    const response = {
      success: false,
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  },

  // Pagination response
  paginationResponse: (res, data, pagination, message = "Success") => {
    return res.status(200).json({
      success: true,
      message,
      count: data.length,
      pagination,
      data,
    });
  },
};

// Search utilities
const searchHelpers = {
  // Build search query
  buildSearchQuery: (searchTerm, fields) => {
    if (!searchTerm) return {};

    const searchRegex = new RegExp(searchTerm, "i");
    return {
      $or: fields.map((field) => ({ [field]: searchRegex })),
    };
  },

  // Build filter query
  buildFilterQuery: (filters) => {
    const query = {};

    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          query[key] = { $in: value };
        } else if (
          typeof value === "object" &&
          value.min !== undefined &&
          value.max !== undefined
        ) {
          query[key] = { $gte: value.min, $lte: value.max };
        } else {
          query[key] = value;
        }
      }
    });

    return query;
  },

  // Build sort query
  buildSortQuery: (sortBy, sortOrder = "desc") => {
    const order = sortOrder === "asc" ? 1 : -1;
    return { [sortBy]: order };
  },
};

// Logging utilities
const logHelpers = {
  // Log error
  logError: (error, context = "") => {
    const timestamp = new Date().toISOString();
    const errorLog = {
      timestamp,
      context,
      message: error.message,
      stack: error.stack,
    };

    console.error("Error:", JSON.stringify(errorLog, null, 2));

    // In production, you might want to send this to a logging service
    // like Winston, Morgan, or external services like Sentry
  },

  // Log info
  logInfo: (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: "info",
      message,
      data,
    };

    console.log("Info:", JSON.stringify(logEntry, null, 2));
  },

  // Log warning
  logWarning: (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: "warning",
      message,
      data,
    };

    console.warn("Warning:", JSON.stringify(logEntry, null, 2));
  },
};

// Utility to clean up expired data
const cleanupHelpers = {
  // Clean expired tokens
  cleanExpiredTokens: async (
    model,
    tokenField = "resetPasswordToken",
    expiryField = "resetPasswordExpire"
  ) => {
    try {
      const result = await model.updateMany(
        { [expiryField]: { $lt: new Date() } },
        { $unset: { [tokenField]: 1, [expiryField]: 1 } }
      );
      return result.modifiedCount;
    } catch (error) {
      logHelpers.logError(error, "cleanExpiredTokens");
      return 0;
    }
  },

  // Clean old files
  cleanOldFiles: async (directory, days = 30) => {
    const fs = require("fs").promises;
    const path = require("path");

    try {
      const files = await fs.readdir(directory);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      logHelpers.logError(error, "cleanOldFiles");
      return 0;
    }
  },
};

module.exports = {
  dateHelpers,
  stringHelpers,
  numberHelpers,
  arrayHelpers,
  securityHelpers,
  fileHelpers,
  validationHelpers,
  responseHelpers,
  searchHelpers,
  logHelpers,
  cleanupHelpers,
};
