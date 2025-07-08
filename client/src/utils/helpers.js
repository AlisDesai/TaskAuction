// client/src/utils/helpers.js

// Date and time utilities
export const formatDate = (date, options = {}) => {
  if (!date) return "";

  const {
    format = "short", // 'short', 'long', 'relative', 'time'
    includeTime = false,
    locale = "en-US",
  } = options;

  try {
    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    switch (format) {
      case "relative":
        return getRelativeTime(dateObj);
      case "time":
        return dateObj.toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
        });
      case "long":
        return dateObj.toLocaleDateString(locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
          ...(includeTime && {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      case "short":
      default:
        return dateObj.toLocaleDateString(locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
          ...(includeTime && {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
    }
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Invalid Date";
  }
};

export const getRelativeTime = (date) => {
  if (!date) return "";

  try {
    const now = new Date();
    const dateObj = new Date(date);
    const diffInSeconds = Math.floor((now - dateObj) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
  } catch (error) {
    console.error("Relative time error:", error);
    return "";
  }
};

export const getTimeRemaining = (deadline) => {
  if (!deadline) return null;

  try {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffInMs = deadlineDate - now;

    if (diffInMs <= 0) {
      return { expired: true, text: "Expired" };
    }

    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return {
        expired: false,
        urgent: diffInDays <= 1,
        text: `${diffInDays} day${diffInDays > 1 ? "s" : ""} left`,
        days: diffInDays,
        hours: diffInHours % 24,
        minutes: diffInMinutes % 60,
      };
    }

    if (diffInHours > 0) {
      return {
        expired: false,
        urgent: true,
        text: `${diffInHours} hour${diffInHours > 1 ? "s" : ""} left`,
        days: 0,
        hours: diffInHours,
        minutes: diffInMinutes % 60,
      };
    }

    return {
      expired: false,
      urgent: true,
      text: `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} left`,
      days: 0,
      hours: 0,
      minutes: diffInMinutes,
    };
  } catch (error) {
    console.error("Time remaining calculation error:", error);
    return null;
  }
};

// Currency utilities
export const formatCurrency = (amount, options = {}) => {
  if (amount === null || amount === undefined) return "";

  const {
    currency = "INR",
    locale = "en-IN",
    showSymbol = true,
    showDecimals = false,
  } = options;

  try {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount)) {
      return "";
    }

    if (showSymbol) {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0,
      }).format(numAmount);
    } else {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0,
      }).format(numAmount);
    }
  } catch (error) {
    console.error("Currency formatting error:", error);
    return `₹${amount}`;
  }
};

export const formatBudgetRange = (min, max) => {
  if (!min && !max) return "";
  if (min === max) return formatCurrency(min);
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
};

// String utilities
export const truncateText = (text, maxLength = 100, suffix = "...") => {
  if (!text || typeof text !== "string") return "";

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - suffix.length) + suffix;
};

export const capitalizeFirst = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    .split(" ")
    .map((word) => capitalizeFirst(word))
    .join(" ");
};

export const slugify = (text) => {
  if (!text || typeof text !== "string") return "";

  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

// Validation utilities
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== "string") return false;

  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ""));
};

export const isValidPassword = (password) => {
  if (!password || typeof password !== "string") return false;

  // At least 6 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  return passwordRegex.test(password);
};

export const isValidUrl = (url) => {
  if (!url || typeof url !== "string") return false;

  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// File utilities
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getFileExtension = (filename) => {
  if (!filename || typeof filename !== "string") return "";

  const lastDot = filename.lastIndexOf(".");
  return lastDot > 0 ? filename.slice(lastDot + 1).toLowerCase() : "";
};

export const isImageFile = (filename) => {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"];
  const extension = getFileExtension(filename);
  return imageExtensions.includes(extension);
};

export const isDocumentFile = (filename) => {
  const docExtensions = ["pdf", "doc", "docx", "txt", "rtf", "odt"];
  const extension = getFileExtension(filename);
  return docExtensions.includes(extension);
};

// Array utilities
export const groupBy = (array, key) => {
  if (!Array.isArray(array)) return {};

  return array.reduce((groups, item) => {
    const group = typeof key === "function" ? key(item) : item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, key, order = "asc") => {
  if (!Array.isArray(array)) return [];

  return [...array].sort((a, b) => {
    const aVal = typeof key === "function" ? key(a) : a[key];
    const bVal = typeof key === "function" ? key(b) : b[key];

    if (order === "desc") {
      return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
    }
    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
  });
};

export const removeDuplicates = (array, key) => {
  if (!Array.isArray(array)) return [];

  if (!key) {
    return [...new Set(array)];
  }

  const seen = new Set();
  return array.filter((item) => {
    const keyValue = typeof key === "function" ? key(item) : item[key];
    if (seen.has(keyValue)) {
      return false;
    }
    seen.add(keyValue);
    return true;
  });
};

// Local storage utilities
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Error writing to localStorage:", error);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Error removing from localStorage:", error);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error("Error clearing localStorage:", error);
      return false;
    }
  },
};

// Debounce utility
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle utility
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Error handling utilities
export const handleError = (error, context = "") => {
  console.error(`Error ${context}:`, error);

  if (error.isNetworkError) {
    return "Network connection failed. Please check your internet connection.";
  }

  if (error.isServerError) {
    return "Server error occurred. Please try again later.";
  }

  if (error.status === 401) {
    return "You are not authorized. Please log in again.";
  }

  if (error.status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (error.status === 404) {
    return "The requested resource was not found.";
  }

  if (error.errors && Array.isArray(error.errors)) {
    return error.errors.map((err) => err.msg || err.message).join(", ");
  }

  return error.message || "An unexpected error occurred.";
};

// Generate unique ID
export const generateId = (prefix = "") => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      return true;
    }
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
};

export default {
  formatDate,
  getRelativeTime,
  getTimeRemaining,
  formatCurrency,
  formatBudgetRange,
  truncateText,
  capitalizeFirst,
  capitalizeWords,
  slugify,
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidUrl,
  formatFileSize,
  getFileExtension,
  isImageFile,
  isDocumentFile,
  groupBy,
  sortBy,
  removeDuplicates,
  storage,
  debounce,
  throttle,
  handleError,
  generateId,
  copyToClipboard,
};
