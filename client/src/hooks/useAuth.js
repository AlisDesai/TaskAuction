// client/src/hooks/useAuth.js
import { useState, useEffect, useCallback } from "react";
import { useAuth as useAuthContext } from "../context/AuthContext";

// Custom hook for authentication with additional utilities
export const useAuth = () => {
  const authContext = useAuthContext();
  const [authState, setAuthState] = useState({
    isCheckingAuth: true,
    hasError: false,
    retryCount: 0,
  });

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authContext.isInitialized) {
          setAuthState((prev) => ({
            ...prev,
            isCheckingAuth: false,
            hasError: false,
          }));
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthState((prev) => ({
          ...prev,
          isCheckingAuth: false,
          hasError: true,
        }));
      }
    };

    checkAuth();
  }, [authContext.isInitialized]);

  // Get authentication token for API requests and socket connections
  const getAuthToken = useCallback(() => {
    try {
      // Check localStorage first
      const token = localStorage.getItem("token");
      if (token) {
        return token;
      }

      // Check sessionStorage as fallback
      const sessionToken = sessionStorage.getItem("token");
      if (sessionToken) {
        return sessionToken;
      }

      // Check if user object has token
      if (authContext.user && authContext.user.token) {
        return authContext.user.token;
      }

      return null;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  }, [authContext.user]);

  // Check if token is valid (not expired)
  const isTokenValid = useCallback(() => {
    try {
      const token = getAuthToken();
      if (!token) return false;

      // Decode JWT token to check expiration
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      const now = Date.now() / 1000;

      return payload.exp > now;
    } catch (error) {
      console.error("Error validating token:", error);
      return false;
    }
  }, [getAuthToken]);

  // Retry authentication check
  const retryAuth = useCallback(async () => {
    setAuthState((prev) => ({
      ...prev,
      isCheckingAuth: true,
      retryCount: prev.retryCount + 1,
    }));

    try {
      await authContext.refreshUser();
      setAuthState((prev) => ({
        ...prev,
        isCheckingAuth: false,
        hasError: false,
      }));
    } catch (error) {
      console.error("Auth retry error:", error);
      setAuthState((prev) => ({
        ...prev,
        isCheckingAuth: false,
        hasError: true,
      }));
    }
  }, [authContext]);

  // Login with error handling
  const login = useCallback(
    async (credentials) => {
      try {
        const result = await authContext.login(credentials);

        if (result.success) {
          setAuthState((prev) => ({
            ...prev,
            hasError: false,
            retryCount: 0,
          }));
        }

        return result;
      } catch (error) {
        console.error("Login error:", error);
        setAuthState((prev) => ({
          ...prev,
          hasError: true,
        }));
        return {
          success: false,
          message: "Login failed. Please try again.",
        };
      }
    },
    [authContext]
  );

  // Register with error handling
  const register = useCallback(
    async (userData) => {
      try {
        const result = await authContext.register(userData);

        if (result.success) {
          setAuthState((prev) => ({
            ...prev,
            hasError: false,
            retryCount: 0,
          }));
        }

        return result;
      } catch (error) {
        console.error("Register error:", error);
        setAuthState((prev) => ({
          ...prev,
          hasError: true,
        }));
        return {
          success: false,
          message: "Registration failed. Please try again.",
        };
      }
    },
    [authContext]
  );

  // Logout with cleanup
  const logout = useCallback(async () => {
    try {
      const result = await authContext.logout();

      setAuthState({
        isCheckingAuth: false,
        hasError: false,
        retryCount: 0,
      });

      return result;
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        message: "Logout failed. Please try again.",
      };
    }
  }, [authContext]);

  // Check if user has specific permission
  const hasPermission = useCallback(
    (permission) => {
      return authContext.hasPermission(permission);
    },
    [authContext]
  );

  // Check if user owns resource
  const isOwner = useCallback(
    (resourceUserId) => {
      if (!authContext.user || !resourceUserId) {
        return false;
      }
      return (
        authContext.user._id === resourceUserId ||
        authContext.user._id === resourceUserId._id
      );
    },
    [authContext.user]
  );

  // Check if user can edit resource
  const canEdit = useCallback(
    (resource, additionalChecks = () => true) => {
      if (!authContext.isAuthenticated || !resource) {
        return false;
      }

      const isResourceOwner = isOwner(
        resource.poster || resource.user || resource.owner
      );
      return isResourceOwner && additionalChecks(resource);
    },
    [authContext.isAuthenticated, isOwner]
  );

  // Check if user can delete resource
  const canDelete = useCallback(
    (resource, additionalChecks = () => true) => {
      return canEdit(resource, additionalChecks);
    },
    [canEdit]
  );

  // Get user initials for avatar fallback
  const getUserInitials = useCallback(() => {
    return authContext.getUserInitials();
  }, [authContext]);

  // Get user full name
  const getUserFullName = useCallback(() => {
    return authContext.getUserFullName();
  }, [authContext]);

  // Get user avatar URL
  const getAvatarUrl = useCallback(() => {
    return authContext.getAvatarUrl();
  }, [authContext]);

  // Check if user profile is complete
  const isProfileComplete = useCallback(() => {
    if (!authContext.user) {
      return false;
    }

    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "college",
      "phone",
    ];
    return requiredFields.every((field) => authContext.user[field]);
  }, [authContext.user]);

  // Get user stats summary
  const getUserStats = useCallback(() => {
    if (!authContext.user || !authContext.user.stats) {
      return {
        tasksPosted: 0,
        tasksCompleted: 0,
        totalEarnings: 0,
        totalSpent: 0,
      };
    }

    return authContext.user.stats;
  }, [authContext.user]);

  // Get user rating info
  const getUserRating = useCallback(() => {
    if (!authContext.user || !authContext.user.rating) {
      return {
        average: 0,
        count: 0,
        hasRating: false,
      };
    }

    return {
      ...authContext.user.rating,
      hasRating: authContext.user.rating.count > 0,
    };
  }, [authContext.user]);

  // Check if user is verified
  const isVerified = useCallback(() => {
    return authContext.user?.isVerified || false;
  }, [authContext.user]);

  // Get user role/type based on activity
  const getUserRole = useCallback(() => {
    if (!authContext.user) {
      return "guest";
    }

    const stats = getUserStats();

    if (stats.tasksPosted > stats.tasksCompleted) {
      return "poster"; // Primarily posts tasks
    } else if (stats.tasksCompleted > stats.tasksPosted) {
      return "bidder"; // Primarily completes tasks
    } else if (stats.tasksPosted > 0 || stats.tasksCompleted > 0) {
      return "mixed"; // Both posts and completes tasks
    } else {
      return "new"; // New user with no activity
    }
  }, [authContext.user, getUserStats]);

  // Check if user is active (has recent activity)
  const isActiveUser = useCallback(() => {
    if (!authContext.user) {
      return false;
    }

    const lastLogin = new Date(authContext.user.lastLogin);
    const now = new Date();
    const daysSinceLastLogin = (now - lastLogin) / (1000 * 60 * 60 * 24);

    return daysSinceLastLogin <= 30; // Active if logged in within 30 days
  }, [authContext.user]);

  // Format user for display
  const formatUserForDisplay = useCallback(
    (user = authContext.user) => {
      if (!user) {
        return null;
      }

      return {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        avatar: getAvatarUrl(),
        initials: getUserInitials(),
        college: user.college,
        rating: getUserRating(),
        stats: getUserStats(),
        isVerified: user.isVerified,
        role: getUserRole(),
        isActive: isActiveUser(),
      };
    },
    [
      authContext.user,
      getAvatarUrl,
      getUserInitials,
      getUserRating,
      getUserStats,
      getUserRole,
      isActiveUser,
    ]
  );

  // Validate user session
  const validateSession = useCallback(async () => {
    try {
      if (!authContext.isAuthenticated) {
        return { valid: false, reason: "Not authenticated" };
      }

      // Check if token is still valid
      if (!isTokenValid()) {
        return { valid: false, reason: "Token expired" };
      }

      const result = await authContext.refreshUser();

      if (result.success) {
        return { valid: true };
      } else {
        return { valid: false, reason: result.message };
      }
    } catch (error) {
      console.error("Session validation error:", error);
      return { valid: false, reason: "Session validation failed" };
    }
  }, [authContext, isTokenValid]);

  // Clear all auth errors
  const clearError = useCallback(() => {
    authContext.clearError();
    setAuthState((prev) => ({
      ...prev,
      hasError: false,
    }));
  }, [authContext]);

  // Check if user can perform action based on time restrictions
  const canPerformTimedAction = useCallback(
    (lastActionTime, cooldownMinutes = 5) => {
      if (!lastActionTime) {
        return true;
      }

      const now = new Date();
      const lastAction = new Date(lastActionTime);
      const minutesSinceLastAction = (now - lastAction) / (1000 * 60);

      return minutesSinceLastAction >= cooldownMinutes;
    },
    []
  );

  // Get authentication status summary
  const getAuthStatus = useCallback(() => {
    return {
      isAuthenticated: authContext.isAuthenticated,
      isLoading: authContext.isLoading || authState.isCheckingAuth,
      isInitialized: authContext.isInitialized,
      hasError: authContext.error || authState.hasError,
      error: authContext.error,
      user: authContext.user,
      canRetry: authState.hasError && authState.retryCount < 3,
      tokenValid: isTokenValid(),
    };
  }, [authContext, authState, isTokenValid]);

  // Update user profile with optimistic updates
  const updateProfile = useCallback(
    async (profileData) => {
      try {
        const result = await authContext.updateProfile(profileData);
        return result;
      } catch (error) {
        console.error("Update profile error:", error);
        return {
          success: false,
          message: "Profile update failed. Please try again.",
        };
      }
    },
    [authContext]
  );

  // Change password with validation
  const changePassword = useCallback(
    async (passwordData) => {
      try {
        // Client-side validation
        if (!passwordData.currentPassword || !passwordData.newPassword) {
          return {
            success: false,
            message: "Both current and new passwords are required",
          };
        }

        if (passwordData.currentPassword === passwordData.newPassword) {
          return {
            success: false,
            message: "New password must be different from current password",
          };
        }

        const result = await authContext.changePassword(passwordData);
        return result;
      } catch (error) {
        console.error("Change password error:", error);
        return {
          success: false,
          message: "Password change failed. Please try again.",
        };
      }
    },
    [authContext]
  );

  return {
    // Basic auth state
    ...authContext,

    // Extended state
    isCheckingAuth: authState.isCheckingAuth,
    hasError: authState.hasError,
    canRetry: authState.hasError && authState.retryCount < 3,

    // Enhanced actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    retryAuth,
    clearError,
    validateSession,

    // Permission checks
    hasPermission,
    isOwner,
    canEdit,
    canDelete,
    canPerformTimedAction,

    // User utilities
    getUserInitials,
    getUserFullName,
    getAvatarUrl,
    getUserStats,
    getUserRating,
    getUserRole,
    isProfileComplete,
    isVerified,
    isActiveUser,
    formatUserForDisplay,

    // Status helpers
    getAuthStatus,

    // Token management - ESSENTIAL FOR SOCKET CONNECTION
    getAuthToken,
    isTokenValid,
  };
};

export default useAuth;