// server/middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    "./uploads",
    "./uploads/tasks",
    "./uploads/avatars",
    "./uploads/chat",
    "./uploads/temp",
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Initialize upload directories
createUploadDirs();

// File type validation
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocTypes = /pdf|doc|docx|txt|rtf/;
  const allowedTypes = new RegExp(
    `${allowedImageTypes.source}|${allowedDocTypes.source}`
  );

  // Check mime type
  const mimetype = allowedTypes.test(file.mimetype);
  // Check extension
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images (JPEG, JPG, PNG, GIF, WebP) and documents (PDF, DOC, DOCX, TXT, RTF) are allowed."
      )
    );
  }
};

// Storage configuration for different upload types
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      // Create unique filename with timestamp and random string
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const name = file.fieldname + "-" + uniqueSuffix + ext;
      cb(null, name);
    },
  });
};

// File size limits (in bytes)
const fileLimits = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  avatar: 2 * 1024 * 1024, // 2MB
};

// Generic upload configuration
const createUpload = (destination, fileLimit, maxFiles = 1) => {
  return multer({
    storage: createStorage(destination),
    fileFilter: fileFilter,
    limits: {
      fileSize: fileLimit,
      files: maxFiles,
    },
  });
};

// Specific upload configurations
const uploadTaskImages = createUpload("./uploads/tasks", fileLimits.image, 5);
const uploadTaskDocuments = createUpload(
  "./uploads/tasks",
  fileLimits.document,
  3
);
const uploadAvatar = createUpload("./uploads/avatars", fileLimits.avatar, 1);
const uploadChatFiles = createUpload("./uploads/chat", fileLimits.document, 1);

// Mixed upload for tasks (images and documents)
const uploadTaskFiles = multer({
  storage: createStorage("./uploads/tasks"),
  fileFilter: fileFilter,
  limits: {
    fileSize: fileLimits.document, // Use larger limit
    files: 8, // Max 8 files total
  },
}).fields([
  { name: "images", maxCount: 5 },
  { name: "documents", maxCount: 3 },
]);

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          success: false,
          message:
            "File too large. Maximum size allowed is based on file type.",
        });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          success: false,
          message:
            "Too many files. Please check the file limit for this upload.",
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          success: false,
          message:
            "Unexpected file field. Please check the allowed file fields.",
        });
      default:
        return res.status(400).json({
          success: false,
          message: "File upload error occurred.",
        });
    }
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "File upload failed.",
    });
  }
  next();
};

// File validation middleware
const validateFiles = (req, res, next) => {
  const files = req.files;
  const file = req.file;

  if (!files && !file) {
    return next();
  }

  try {
    // Validate single file
    if (file) {
      validateSingleFile(file);
    }

    // Validate multiple files
    if (files) {
      if (Array.isArray(files)) {
        files.forEach(validateSingleFile);
      } else {
        // Files object with field names
        Object.keys(files).forEach((fieldName) => {
          files[fieldName].forEach(validateSingleFile);
        });
      }
    }

    next();
  } catch (error) {
    // Clean up uploaded files on validation error
    cleanupFiles(req);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Single file validation helper
const validateSingleFile = (file) => {
  // Check file size based on type
  const isImage = /image/.test(file.mimetype);
  const maxSize = isImage ? fileLimits.image : fileLimits.document;

  if (file.size > maxSize) {
    throw new Error(
      `File ${file.originalname} exceeds size limit of ${
        maxSize / (1024 * 1024)
      }MB`
    );
  }

  // Check file extension
  const allowedExts = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".rtf",
  ];
  const fileExt = path.extname(file.originalname).toLowerCase();

  if (!allowedExts.includes(fileExt)) {
    throw new Error(
      `File ${
        file.originalname
      } has invalid extension. Allowed: ${allowedExts.join(", ")}`
    );
  }
};

// Clean up uploaded files
const cleanupFiles = (req) => {
  const files = req.files;
  const file = req.file;

  const filesToDelete = [];

  if (file) {
    filesToDelete.push(file.path);
  }

  if (files) {
    if (Array.isArray(files)) {
      files.forEach((f) => filesToDelete.push(f.path));
    } else {
      Object.keys(files).forEach((fieldName) => {
        files[fieldName].forEach((f) => filesToDelete.push(f.path));
      });
    }
  }

  filesToDelete.forEach((filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error("Error deleting file:", filePath, error);
    }
  });
};

// Delete file helper function
const deleteFile = (filePath) => {
  return new Promise((resolve) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      resolve(true);
    } catch (error) {
      console.error("Error deleting file:", filePath, error);
      resolve(false);
    }
  });
};

// Get file URL helper
const getFileUrl = (req, filePath) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const relativePath = filePath.replace("./uploads", "/uploads");
  return `${baseUrl}${relativePath}`;
};

// File info extractor
const extractFileInfo = (req, file) => {
  return {
    url: getFileUrl(req, file.path),
    filename: file.filename,
    originalName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
  };
};

// Process uploaded files middleware
const processUploadedFiles = (req, res, next) => {
  try {
    const files = req.files;
    const file = req.file;

    // Process single file
    if (file) {
      req.fileInfo = extractFileInfo(req, file);
    }

    // Process multiple files
    if (files) {
      req.filesInfo = {};

      if (Array.isArray(files)) {
        req.filesInfo.files = files.map((f) => extractFileInfo(req, f));
      } else {
        Object.keys(files).forEach((fieldName) => {
          req.filesInfo[fieldName] = files[fieldName].map((f) =>
            extractFileInfo(req, f)
          );
        });
      }
    }

    next();
  } catch (error) {
    cleanupFiles(req);
    return res.status(500).json({
      success: false,
      message: "Error processing uploaded files",
    });
  }
};

module.exports = {
  uploadTaskImages,
  uploadTaskDocuments,
  uploadTaskFiles,
  uploadAvatar,
  uploadChatFiles,
  handleUploadError,
  validateFiles,
  processUploadedFiles,
  cleanupFiles,
  deleteFile,
  getFileUrl,
  extractFileInfo,
};
