// client/src/services/authService.js
import api, { apiUtils } from "./api";
import { AUTH_ENDPOINTS } from "../constants/apiEndpoints";
import { storage } from "../utils/helpers";

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isInitialized = false;
    this.authListeners = new Set();

    // Initialize auth state on service creation
    this.initializeAuth();
  }

  // Initialize authentication state
  initializeAuth() {
    try {
      const token = storage.get("token");
      const user = storage.get("user");

      if (token && user) {
        this.currentUser = user;
        apiUtils.setAuthToken(token);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("Error initializing auth:", error);
      this.clearAuth();
    }
  }

  // Add auth state listener
  addAuthListener(callback) {
    if (typeof callback === "function") {
      this.authListeners.add(callback);
    }
  }

  // Remove auth state listener
  removeAuthListener(callback) {
    this.authListeners.delete(callback);
  }

  // Notify all listeners about auth state changes
  notifyAuthListeners(user, isAuthenticated) {
    this.authListeners.forEach((callback) => {
      try {
        callback({ user, isAuthenticated });
      } catch (error) {
        console.error("Error in auth listener:", error);
      }
    });
  }

  // Set authentication data
  setAuth(token, user) {
    try {
      this.currentUser = user;

      // Store in localStorage
      storage.set("token", token);
      storage.set("user", user);

      // Set token in API headers
      apiUtils.setAuthToken(token);

      // Notify listeners
      this.notifyAuthListeners(user, true);

      return true;
    } catch (error) {
      console.error("Error setting auth:", error);
      return false;
    }
  }

  // Clear authentication data
  clearAuth() {
    try {
      this.currentUser = null;

      // Clear from localStorage
      storage.remove("token");
      storage.remove("user");

      // Clear token from API headers
      apiUtils.clearAuthToken();

      // Notify listeners
      this.notifyAuthListeners(null, false);

      return true;
    } catch (error) {
      console.error("Error clearing auth:", error);
      return false;
    }
  }

  // Register new user
  async register(userData) {
    try {
      const { firstName, lastName, email, password, college, phone } = userData;

      // Validate required fields
      if (
        !firstName ||
        !lastName ||
        !email ||
        !password ||
        !college ||
        !phone
      ) {
        throw new Error("All fields are required");
      }

      const response = await api.post(AUTH_ENDPOINTS.REGISTER, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        college: college.trim(),
        phone: phone.trim(),
      });

      if (response.data.success) {
        const { token, user } = response.data;
        this.setAuth(token, user);

        return {
          success: true,
          message: response.data.message,
          user,
          token,
        };
      }

      throw new Error(response.data.message || "Registration failed");
    } catch (error) {
      console.error("Registration error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Login user
  async login(credentials) {
    try {
      const { email, password } = credentials;

      // Validate credentials
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const response = await api.post(AUTH_ENDPOINTS.LOGIN, {
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.data.success) {
        const { token, user } = response.data;
        this.setAuth(token, user);

        return {
          success: true,
          message: response.data.message,
          user,
          token,
        };
      }

      throw new Error(response.data.message || "Login failed");
    } catch (error) {
      console.error("Login error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Logout user
  async logout() {
    try {
      // Call logout endpoint if authenticated
      if (this.isAuthenticated()) {
        try {
          await api.post(AUTH_ENDPOINTS.LOGOUT);
        } catch (error) {
          // Continue with logout even if API call fails
          console.warn("Logout API call failed:", error);
        }
      }

      // Clear local auth state
      this.clearAuth();

      return {
        success: true,
        message: "Logged out successfully",
      };
    } catch (error) {
      console.error("Logout error:", error);

      // Force clear auth even on error
      this.clearAuth();

      return {
        success: false,
        message: "Logout completed with errors",
      };
    }
  }

  // Get current user info
  async getCurrentUser() {
    try {
      if (!this.isAuthenticated()) {
        throw new Error("Not authenticated");
      }

      const response = await api.get(AUTH_ENDPOINTS.GET_ME);

      if (response.data.success) {
        const user = response.data.data;

        // Update stored user data
        this.currentUser = user;
        storage.set("user", user);

        // Notify listeners
        this.notifyAuthListeners(user, true);

        return {
          success: true,
          user,
        };
      }

      throw new Error(response.data.message || "Failed to get user info");
    } catch (error) {
      console.error("Get current user error:", error);

      // If 401, clear auth
      if (error.status === 401) {
        this.clearAuth();
      }

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error("Not authenticated");
      }

      const response = await api.put(
        AUTH_ENDPOINTS.UPDATE_PROFILE,
        profileData
      );

      if (response.data.success) {
        const user = response.data.data;

        // Update stored user data
        this.currentUser = user;
        storage.set("user", user);

        // Notify listeners
        this.notifyAuthListeners(user, true);

        return {
          success: true,
          message: response.data.message,
          user,
        };
      }

      throw new Error(response.data.message || "Profile update failed");
    } catch (error) {
      console.error("Update profile error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error("Not authenticated");
      }

      const { currentPassword, newPassword } = passwordData;

      if (!currentPassword || !newPassword) {
        throw new Error("Both current and new passwords are required");
      }

      const response = await api.put(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
      });

      if (response.data.success) {
        const { token, user } = response.data;
        this.setAuth(token, user);

        return {
          success: true,
          message: response.data.message,
        };
      }

      throw new Error(response.data.message || "Password change failed");
    } catch (error) {
      console.error("Change password error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Verify token
  async verifyToken() {
    try {
      const token = storage.get("token");

      if (!token) {
        return {
          success: false,
          message: "No token found",
        };
      }

      const response = await api.get(AUTH_ENDPOINTS.VERIFY_TOKEN);

      if (response.data.success) {
        const user = response.data.data;

        // Update stored user data
        this.currentUser = user;
        storage.set("user", user);

        return {
          success: true,
          user,
        };
      }

      // Invalid token, clear auth
      this.clearAuth();

      return {
        success: false,
        message: response.data.message || "Invalid token",
      };
    } catch (error) {
      console.error("Token verification error:", error);

      // Clear auth on verification failure
      this.clearAuth();

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Delete account
  async deleteAccount(password) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error("Not authenticated");
      }

      if (!password) {
        throw new Error("Password is required to delete account");
      }

      const response = await api.delete(AUTH_ENDPOINTS.DELETE_ACCOUNT, {
        data: { password },
      });

      if (response.data.success) {
        // Clear auth after successful deletion
        this.clearAuth();

        return {
          success: true,
          message: response.data.message,
        };
      }

      throw new Error(response.data.message || "Account deletion failed");
    } catch (error) {
      console.error("Delete account error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Upload avatar
  async uploadAvatar(file) {
    try {
      if (!this.isAuthenticated()) {
        throw new Error("Not authenticated");
      }

      if (!file) {
        throw new Error("No file selected");
      }

      // Validate file type and size
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        throw new Error("Please select a valid image file (JPEG, PNG, or GIF)");
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error("File size must be less than 5MB");
      }

      const formData = new FormData();
      formData.append("avatar", file);

      const response = await apiUtils.uploadFile(
        AUTH_ENDPOINTS.UPLOAD_AVATAR,
        formData,
        (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      );

      if (response.data.success) {
        const user = response.data.data;

        // Update stored user data
        this.currentUser = user;
        storage.set("user", user);

        // Notify listeners
        this.notifyAuthListeners(user, true);

        return {
          success: true,
          message: response.data.message,
          user,
        };
      }

      throw new Error(response.data.message || "Avatar upload failed");
    } catch (error) {
      console.error("Upload avatar error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Delete avatar
  async deleteAvatar() {
    try {
      if (!this.isAuthenticated()) {
        throw new Error("Not authenticated");
      }

      const response = await api.delete(AUTH_ENDPOINTS.DELETE_AVATAR);

      if (response.data.success) {
        const user = response.data.data;

        // Update stored user data
        this.currentUser = user;
        storage.set("user", user);

        // Notify listeners
        this.notifyAuthListeners(user, true);

        return {
          success: true,
          message: response.data.message,
          user,
        };
      }

      throw new Error(response.data.message || "Avatar deletion failed");
    } catch (error) {
      console.error("Delete avatar error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!(apiUtils.getAuthToken() && this.currentUser);
  }

  // Get current user
  getUser() {
    return this.currentUser;
  }

  // Get auth token
  getToken() {
    return apiUtils.getAuthToken();
  }

  // Check if service is initialized
  getIsInitialized() {
    return this.isInitialized;
  }

  // Refresh user data
  async refreshUser() {
    if (this.isAuthenticated()) {
      return await this.getCurrentUser();
    }
    return { success: false, message: "Not authenticated" };
  }
}

// Create and export singleton instance
const authService = new AuthService();

export default authService;
