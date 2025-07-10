// client/src/context/AuthContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from "react";
import authService from "../services/authService";

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_INITIALIZED: "SET_INITIALIZED",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGOUT: "LOGOUT",
  UPDATE_USER: "UPDATE_USER",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
};

// Reducer function
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case AUTH_ACTIONS.SET_INITIALIZED:
      return {
        ...state,
        isInitialized: true,
        isLoading: false,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload.user,
        error: null,
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload.error,
        isLoading: false,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Set up auth service listener
  useEffect(() => {
    const handleAuthChange = ({ user, isAuthenticated }) => {
      if (isAuthenticated && user) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user },
        });
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGOUT,
        });
      }
    };

    // Add listener to auth service
    authService.addAuthListener(handleAuthChange);

    // Cleanup listener on unmount
    return () => {
      authService.removeAuthListener(handleAuthChange);
    };
  }, []);

  // Initialize authentication
  const initializeAuth = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      // Wait for auth service to initialize
      if (!authService.getIsInitialized()) {
        await new Promise((resolve) => {
          const checkInitialized = () => {
            if (authService.getIsInitialized()) {
              resolve();
            } else {
              setTimeout(checkInitialized, 100);
            }
          };
          checkInitialized();
        });
      }

      // Check if user is already authenticated
      if (authService.isAuthenticated()) {
        const user = authService.getUser();

        if (user) {
          // Verify token is still valid
          const result = await authService.verifyToken();

          if (result.success) {
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: { user: result.user },
            });
          } else {
            // Token is invalid, clear auth
            authService.clearAuth();
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: { error: "Failed to initialize authentication" },
      });
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_INITIALIZED });
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const result = await authService.login(credentials);

      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: result.user },
        });

        return {
          success: true,
          message: result.message,
        };
      } else {
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });

        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      const errorMessage = "Login failed. Please try again.";

      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const result = await authService.register(userData);

      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: result.user },
        });

        return {
          success: true,
          message: result.message,
        };
      } else {
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });

        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      const errorMessage = "Registration failed. Please try again.";

      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      await authService.logout();

      dispatch({ type: AUTH_ACTIONS.LOGOUT });

      return {
        success: true,
        message: "Logged out successfully",
      };
    } catch (error) {
      console.error("Logout error:", error);

      // Force logout even on error
      dispatch({ type: AUTH_ACTIONS.LOGOUT });

      return {
        success: false,
        message: "Logout completed with errors",
      };
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const result = await authService.updateProfile(profileData);

      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: { user: result.user },
        });

        return {
          success: true,
          message: result.message,
          user: result.user,
        };
      } else {
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });

        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      const errorMessage = "Profile update failed. Please try again.";

      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Change password function
  const changePassword = async (passwordData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const result = await authService.changePassword(passwordData);

      if (result.success) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });

        return {
          success: true,
          message: result.message,
        };
      } else {
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });

        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      const errorMessage = "Password change failed. Please try again.";

      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Upload avatar function
  const uploadAvatar = async (file) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const result = await authService.uploadAvatar(file);

      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: { user: result.user },
        });

        return {
          success: true,
          message: result.message,
          user: result.user,
        };
      } else {
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });

        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      const errorMessage = "Avatar upload failed. Please try again.";

      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Delete avatar function
  const deleteAvatar = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const result = await authService.deleteAvatar();

      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: { user: result.user },
        });

        return {
          success: true,
          message: result.message,
          user: result.user,
        };
      } else {
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });

        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      const errorMessage = "Avatar deletion failed. Please try again.";

      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Delete account function
  const deleteAccount = async (password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const result = await authService.deleteAccount(password);

      if (result.success) {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });

        return {
          success: true,
          message: result.message,
        };
      } else {
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });

        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      const errorMessage = "Account deletion failed. Please try again.";

      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      if (!state.isAuthenticated) {
        return { success: false, message: "Not authenticated" };
      }

      const result = await authService.getCurrentUser();

      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: { user: result.user },
        });

        return {
          success: true,
          user: result.user,
        };
      } else {
        // If getCurrentUser fails, it might be due to invalid token
        if (
          result.message.includes("401") ||
          result.message.includes("unauthorized")
        ) {
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }

        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      console.error("Refresh user error:", error);
      return {
        success: false,
        message: "Failed to refresh user data",
      };
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has permission
  const hasPermission = (permission) => {
    if (!state.isAuthenticated || !state.user) {
      return false;
    }

    // Add permission checking logic here if needed
    // For now, authenticated users have all permissions
    return true;
  };

  // Get user avatar URL
  const getAvatarUrl = () => {
    if (!state.user || !state.user.avatar) {
      return null;
    }

    // If avatar is already a full URL, return as is
    if (state.user.avatar.startsWith("http")) {
      return state.user.avatar;
    }

    // Construct full avatar URL
    const baseUrl =
      import.meta.env.VITE_UPLOADS_BASE_URL || "http://localhost:5000/uploads";
    return `${baseUrl}/${state.user.avatar}`;
  };

  // Get user full name
  const getUserFullName = () => {
    if (!state.user) {
      return "";
    }

    return `${state.user.firstName} ${state.user.lastName}`.trim();
  };

  // Get user initials
  const getUserInitials = () => {
    if (!state.user) {
      return "U";
    }

    const firstName = state.user.firstName || "";
    const lastName = state.user.lastName || "";

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  // Context value
  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteAvatar,
    deleteAccount,
    refreshUser,
    clearError,

    // Utilities
    hasPermission,
    getAvatarUrl,
    getUserFullName,
    getUserInitials,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
