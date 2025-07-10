// client/src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Edit,
  MessageCircle,
  Shield,
  Settings,
  ExternalLink,
  Filter,
  Grid,
  List,
  Calendar,
  TrendingUp,
  Award,
  AlertTriangle,
  RefreshCw,
  User,
} from "lucide-react";

import ProfileCard from "../components/Profile/ProfileCard";
import TaskCard from "../components/Tasks/TaskCard";
import BidCard from "../components/Bids/BidCard";
import { ReadOnlyStars } from "../components/Profile/RatingStars";
import { useAuth } from "../hooks/useAuth";

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const {
    user: currentUser,
    isAuthenticated,
    isLoading: authLoading,
    updateProfile,
    getUserStats,
    getUserRating,
    formatUserForDisplay,
  } = useAuth();

  // State management
  const [profileUser, setProfileUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Tab and view state
  const [activeTab, setActiveTab] = useState("overview");
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [tasksFilter, setTasksFilter] = useState("all"); // all | active | completed
  const [bidsFilter, setBidsFilter] = useState("all"); // all | pending | accepted | rejected

  // Data state
  const [userTasks, setUserTasks] = useState([]);
  const [userBids, setUserBids] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);

  // Edit profile state
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Determine if viewing own profile
  useEffect(() => {
    if (!userId && currentUser) {
      // No userId means viewing own profile
      setIsOwnProfile(true);
      setProfileUser(currentUser);
    } else if (userId && currentUser) {
      // Check if userId matches current user
      setIsOwnProfile(userId === currentUser._id);
      if (userId === currentUser._id) {
        setProfileUser(currentUser);
      } else {
        // Load other user's profile
        loadUserProfile(userId);
      }
    } else if (userId && !currentUser) {
      // Not authenticated but trying to view specific profile
      loadUserProfile(userId);
    }
  }, [userId, currentUser]);

  // Load user profile data
  const loadUserProfile = async (targetUserId) => {
    setIsLoading(true);
    setError("");

    try {
      // This would call userService to get user profile
      // For now, we'll simulate with current user data
      if (targetUserId === currentUser?._id) {
        setProfileUser(currentUser);
        setIsOwnProfile(true);
      } else {
        // In a real app, this would fetch the user profile from API
        // For demo purposes, we'll show an error
        throw new Error("User profile not found");
      }

      // Load additional profile data
      await Promise.all([
        loadUserTasks(targetUserId),
        loadUserBids(targetUserId),
        loadUserReviews(targetUserId),
        loadUserStats(targetUserId),
      ]);
    } catch (err) {
      console.error("Error loading profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Load user tasks
  const loadUserTasks = async (targetUserId) => {
    try {
      // This would call taskService.getMyTasks() or similar
      // For now, return empty array
      setUserTasks([]);
    } catch (err) {
      console.error("Error loading user tasks:", err);
    }
  };

  // Load user bids
  const loadUserBids = async (targetUserId) => {
    try {
      // This would call bidService.getMyBids() or similar
      // For now, return empty array
      setUserBids([]);
    } catch (err) {
      console.error("Error loading user bids:", err);
    }
  };

  // Load user reviews
  const loadUserReviews = async (targetUserId) => {
    try {
      // This would call reviewService.getUserReviews() or similar
      // For now, return empty array
      setReviews([]);
    } catch (err) {
      console.error("Error loading user reviews:", err);
    }
  };

  // Load user statistics
  const loadUserStats = async (targetUserId) => {
    try {
      if (isOwnProfile && currentUser) {
        setStats(getUserStats());
      } else {
        // For other users, would fetch from API
        setStats({
          tasksPosted: 0,
          tasksCompleted: 0,
          totalEarnings: 0,
          totalSpent: 0,
        });
      }
    } catch (err) {
      console.error("Error loading user stats:", err);
    }
  };

  // Refresh profile data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (isOwnProfile) {
        await loadUserProfile(currentUser._id);
      } else {
        await loadUserProfile(userId);
      }
    } catch (err) {
      console.error("Error refreshing profile:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle edit profile
  const handleEditProfile = () => {
    if (isOwnProfile) {
      setShowEditProfile(true);
    }
  };

  // Handle back navigation
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  // Filter tasks based on current filter
  const getFilteredTasks = () => {
    return userTasks.filter((task) => {
      switch (tasksFilter) {
        case "active":
          return ["Open", "Assigned", "In-Progress"].includes(task.status);
        case "completed":
          return ["Completed", "Closed"].includes(task.status);
        default:
          return true;
      }
    });
  };

  // Filter bids based on current filter
  const getFilteredBids = () => {
    return userBids.filter((bid) => {
      switch (bidsFilter) {
        case "pending":
          return bid.status === "Pending";
        case "accepted":
          return bid.status === "Accepted";
        case "rejected":
          return bid.status === "Rejected";
        default:
          return true;
      }
    });
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Loading profile...
          </h3>
          <p className="text-gray-600">Please wait while we load the profile</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Profile Not Found
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {refreshing ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </div>
              ) : (
                "Try Again"
              )}
            </button>
            <button
              onClick={handleGoBack}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No profile data
  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Profile Not Available
          </h3>
          <p className="text-gray-600">
            The requested profile could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  const userRating = getUserRating();
  const userStats = stats || getUserStats();

  return (
    <>
      <Helmet>
        <title>
          {isOwnProfile
            ? "My Profile - TaskAuction"
            : `${profileUser.firstName} ${profileUser.lastName} - TaskAuction`}
        </title>
        <meta
          name="description"
          content={
            isOwnProfile
              ? "Manage your TaskAuction profile, view your tasks and bids, and track your activity"
              : `View ${profileUser.firstName} ${profileUser.lastName}'s profile on TaskAuction`
          }
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleGoBack}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {isOwnProfile ? "My Profile" : "User Profile"}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {isOwnProfile
                      ? "Manage your profile and view your activity"
                      : `${profileUser.firstName} ${profileUser.lastName}'s profile`}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh profile"
                >
                  <RefreshCw
                    className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                  />
                </button>

                {isOwnProfile && (
                  <Link
                    to="/settings"
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                )}

                {!isOwnProfile && isAuthenticated && (
                  <Link
                    to={`/chat/${profileUser._id}`}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Message</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card - Left Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <ProfileCard
                  user={profileUser}
                  isOwnProfile={isOwnProfile}
                  onEdit={handleEditProfile}
                  showFullDetails={true}
                  className="mb-6"
                />

                {/* Quick Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Quick Stats
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Success Rate:</span>
                      <span className="font-medium text-gray-900">
                        {userStats.tasksCompleted > 0
                          ? `${Math.round(
                              (userStats.tasksCompleted /
                                (userStats.tasksPosted +
                                  userStats.tasksCompleted)) *
                                100
                            )}%`
                          : "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Response Time:</span>
                      <span className="font-medium text-gray-900">
                        {profileUser.avgResponseTime || "< 1 hour"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Member Since:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(profileUser.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>

                    {profileUser.isVerified && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Verification:</span>
                        <div className="flex items-center space-x-1">
                          <Shield className="w-4 h-4 text-green-600" />
                          <span className="text-green-600 font-medium">
                            Verified
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {/* Tab Navigation */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    {[
                      { id: "overview", label: "Overview", icon: TrendingUp },
                      {
                        id: "tasks",
                        label: `Tasks (${userTasks.length})`,
                        icon: Grid,
                      },
                      {
                        id: "bids",
                        label: `Bids (${userBids.length})`,
                        icon: Award,
                      },
                      {
                        id: "reviews",
                        label: `Reviews (${reviews.length})`,
                        icon: MessageCircle,
                      },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === tab.id
                              ? "border-blue-500 text-blue-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Overview Tab */}
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      {/* Activity Summary */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Activity Summary
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {userStats.tasksPosted}
                            </div>
                            <div className="text-sm text-gray-600">
                              Tasks Posted
                            </div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {userStats.tasksCompleted}
                            </div>
                            <div className="text-sm text-gray-600">
                              Tasks Completed
                            </div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              ₹{userStats.totalEarnings.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">
                              Total Earned
                            </div>
                          </div>
                          <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">
                              ₹{userStats.totalSpent.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">
                              Total Spent
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Recent Activity
                        </h3>
                        <div className="space-y-3">
                          {/* Placeholder for recent activity */}
                          <div className="text-center py-8 text-gray-500">
                            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No recent activity to show</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tasks Tab */}
                  {activeTab === "tasks" && (
                    <div className="space-y-4">
                      {/* Filter Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <select
                            value={tasksFilter}
                            onChange={(e) => setTasksFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="all">All Tasks</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-lg transition-colors ${
                              viewMode === "grid"
                                ? "bg-blue-100 text-blue-600"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            <Grid className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-lg transition-colors ${
                              viewMode === "list"
                                ? "bg-blue-100 text-blue-600"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            <List className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Tasks List */}
                      <div
                        className={
                          viewMode === "grid"
                            ? "grid grid-cols-1 gap-4"
                            : "space-y-4"
                        }
                      >
                        {getFilteredTasks().length > 0 ? (
                          getFilteredTasks().map((task) => (
                            <TaskCard
                              key={task._id}
                              task={task}
                              showBidButton={!isOwnProfile}
                            />
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Grid className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No tasks found</p>
                            {isOwnProfile && (
                              <Link
                                to="/create-task"
                                className="inline-flex items-center space-x-2 mt-3 text-blue-600 hover:text-blue-700"
                              >
                                <span>Post your first task</span>
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bids Tab */}
                  {activeTab === "bids" && (
                    <div className="space-y-4">
                      {/* Filter Controls */}
                      <div className="flex items-center justify-between">
                        <select
                          value={bidsFilter}
                          onChange={(e) => setBidsFilter(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Bids</option>
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>

                      {/* Bids List */}
                      <div className="space-y-4">
                        {getFilteredBids().length > 0 ? (
                          getFilteredBids().map((bid) => (
                            <BidCard
                              key={bid._id}
                              bid={bid}
                              isTaskOwner={false}
                              showActions={isOwnProfile}
                            />
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No bids found</p>
                            {isOwnProfile && (
                              <Link
                                to="/tasks"
                                className="inline-flex items-center space-x-2 mt-3 text-blue-600 hover:text-blue-700"
                              >
                                <span>Browse tasks to bid on</span>
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reviews Tab */}
                  {activeTab === "reviews" && (
                    <div className="space-y-4">
                      {userRating.hasRating && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                          <div className="flex items-center justify-center space-x-4">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-gray-900">
                                {userRating.average.toFixed(1)}
                              </div>
                              <ReadOnlyStars
                                rating={userRating.average}
                                size="lg"
                              />
                              <div className="text-sm text-gray-600 mt-1">
                                Based on {userRating.count} review
                                {userRating.count !== 1 ? "s" : ""}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        {reviews.length > 0 ? (
                          reviews.map((review, index) => (
                            <div
                              key={index}
                              className="bg-white border border-gray-200 rounded-lg p-4"
                            >
                              {/* Review content would go here */}
                              <p className="text-gray-600">Review content...</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No reviews yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
