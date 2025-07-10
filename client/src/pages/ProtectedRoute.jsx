// client/src/pages/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader, AlertCircle, RefreshCw } from "lucide-react";

const ProtectedRoute = ({
  children,
  requireAuth = true,
  redirectTo = "/login",
  fallback = null,
  requireVerification = false,
  requirePermissions = [],
  allowedRoles = [],
  minLevel = null,
}) => {
  const {
    isAuthenticated,
    isLoading,
    isInitialized,
    user,
    error,
    hasPermission,
    isVerified,
    getUserRole,
    retryAuth,
    canRetry,
  } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth is being checked
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Checking authentication...
          </h3>
          <p className="text-gray-600">
            Please wait while we verify your access
          </p>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error && canRetry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Authentication Error
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={retryAuth}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    // Store the attempted location for redirect after login
    return (
      <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
    );
  }

  // Check if route should be hidden from authenticated users (like login/register pages)
  if (!requireAuth && isAuthenticated) {
    // Redirect authenticated users away from auth pages
    const redirectPath = location.state?.from || "/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  // Check verification requirement
  if (requireAuth && requireVerification && !isVerified()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Account Verification Required
          </h3>
          <p className="text-gray-600 mb-4">
            Please verify your email address to access this feature.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => (window.location.href = "/verify-email")}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Verify Email
            </button>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check permissions
  if (requireAuth && requirePermissions.length > 0) {
    const hasRequiredPermissions = requirePermissions.every((permission) =>
      hasPermission(permission)
    );

    if (!hasRequiredPermissions) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // Check user roles
  if (requireAuth && allowedRoles.length > 0) {
    const userRole = getUserRole();

    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Role Restricted
            </h3>
            <p className="text-gray-600 mb-4">
              This page is only available for {allowedRoles.join(", ")} users.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Your role: {userRole}</p>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Check minimum user level (if implemented)
  if (requireAuth && minLevel !== null && user?.level < minLevel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Level Requirement Not Met
          </h3>
          <p className="text-gray-600 mb-4">
            You need to be level {minLevel} or higher to access this feature.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Your level: {user?.level || 0}
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // All checks passed, render the protected content
  return fallback || children;
};

// Higher-order component for easier usage
export const withProtection = (Component, protectionOptions = {}) => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute {...protectionOptions}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// Pre-configured route protection components
export const AuthenticatedRoute = ({ children, ...props }) => (
  <ProtectedRoute requireAuth={true} {...props}>
    {children}
  </ProtectedRoute>
);

export const UnauthenticatedRoute = ({ children, ...props }) => (
  <ProtectedRoute requireAuth={false} redirectTo="/dashboard" {...props}>
    {children}
  </ProtectedRoute>
);

export const VerifiedRoute = ({ children, ...props }) => (
  <ProtectedRoute requireAuth={true} requireVerification={true} {...props}>
    {children}
  </ProtectedRoute>
);

export const AdminRoute = ({ children, ...props }) => (
  <ProtectedRoute requireAuth={true} allowedRoles={["admin"]} {...props}>
    {children}
  </ProtectedRoute>
);

export const ModeratorRoute = ({ children, ...props }) => (
  <ProtectedRoute
    requireAuth={true}
    allowedRoles={["admin", "moderator"]}
    {...props}
  >
    {children}
  </ProtectedRoute>
);

export const PosterRoute = ({ children, ...props }) => (
  <ProtectedRoute
    requireAuth={true}
    allowedRoles={["poster", "mixed", "admin"]}
    {...props}
  >
    {children}
  </ProtectedRoute>
);

export const BidderRoute = ({ children, ...props }) => (
  <ProtectedRoute
    requireAuth={true}
    allowedRoles={["bidder", "mixed", "admin"]}
    {...props}
  >
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
