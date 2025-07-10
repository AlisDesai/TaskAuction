// client/src/services/api.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(
        `📥 ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          status: response.status,
          data: response.data,
        }
      );
    }

    return response;
  },
  (error) => {
    const originalRequest = error.config;

    // Log error in development
    if (import.meta.env.DEV) {
      console.error(
        `❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          data: error.response?.data,
        }
      );
    }

    // Handle 401 unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear token and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Only redirect if not already on login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }

    // Handle network errors
    if (!error.response) {
      const networkError = {
        message: "Network error. Please check your connection.",
        isNetworkError: true,
        originalError: error,
      };
      return Promise.reject(networkError);
    }

    // Handle server errors
    if (error.response.status >= 500) {
      const serverError = {
        message: "Server error. Please try again later.",
        isServerError: true,
        originalError: error,
      };
      return Promise.reject(serverError);
    }

    // Return formatted error response
    const formattedError = {
      message: error.response?.data?.message || "An error occurred",
      status: error.response?.status,
      data: error.response?.data,
      errors: error.response?.data?.errors,
      originalError: error,
    };

    return Promise.reject(formattedError);
  }
);

// API utility functions
export const apiUtils = {
  // Set auth token
  setAuthToken: (token) => {
    if (token) {
      localStorage.setItem("token", token);
      api.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      localStorage.removeItem("token");
      delete api.defaults.headers.Authorization;
    }
  },

  // Clear auth token
  clearAuthToken: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.Authorization;
  },

  // Get auth token
  getAuthToken: () => {
    return localStorage.getItem("token");
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem("token");
    return !!token;
  },

  // Handle file uploads
  uploadFile: async (url, formData, onUploadProgress) => {
    return api.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
  },

  // Download file
  downloadFile: async (url, filename) => {
    const response = await api.get(url, {
      responseType: "blob",
    });

    const blob = new Blob([response.data]);
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(link.href);
  },

  // Build query string from params
  buildQueryString: (params) => {
    const searchParams = new URLSearchParams();

    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          value.forEach((item) => searchParams.append(key, item));
        } else {
          searchParams.append(key, value);
        }
      }
    });

    return searchParams.toString();
  },

  // Format error message for UI display
  formatErrorMessage: (error) => {
    if (error.isNetworkError) {
      return "Connection failed. Please check your internet connection.";
    }

    if (error.isServerError) {
      return "Server error. Please try again later.";
    }

    if (error.errors && Array.isArray(error.errors)) {
      return error.errors.map((err) => err.msg || err.message).join(", ");
    }

    return error.message || "An unexpected error occurred.";
  },

  // Get file URL for uploads
  getFileUrl: (filePath) => {
    if (!filePath) return null;

    const uploadsBaseUrl =
      import.meta.env.VITE_UPLOADS_BASE_URL || "http://localhost:5000/uploads";

    // If already a full URL, return as is
    if (filePath.startsWith("http")) {
      return filePath;
    }

    // Remove leading slash if present
    const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;

    return `${uploadsBaseUrl}/${cleanPath}`;
  },
};

// Export both the api instance and utils
export { api };
export default api;
