// client/src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  IndianRupee,
  Users,
  Star,
  BarChart3,
  Calendar,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Award,
  Target,
  Activity,
  Eye,
  Filter,
  Search,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTask } from "../context/TaskContext";
import TaskCard from "../components/Tasks/TaskCard";
import BidCard from "../components/Bids/BidCard";
import ProtectedRoute from "./ProtectedRoute";

const Dashboard = () => {
  const { user, getUserStats, getUserRating, getUserRole } = useAuth();
  const {
    tasks,
    myTasks,
    assignedTasks,
    myBids,
    receivedBids,
    recommendations,
    isLoading,
    error,
    fetchTasks,
    fetchMyTasks,
    fetchAssignedTasks,
    fetchMyBids,
    fetchReceivedBids,
    fetchRecommendations,
    clearError,
  } = useTask();

  // Local state
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [quickFilters, setQuickFilters] = useState({
    taskType: "all", // 'all', 'urgent', 'recent'
    bidType: "all", // 'all', 'pending', 'accepted'
  });
  const [refreshing, setRefreshing] = useState(false);

  // Get user stats and role
  const userStats = getUserStats();
  const userRating = getUserRating();
  const userRole = getUserRole();

  // Initialize dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load all dashboard data
  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      clearError();

      // Fetch different data based on user activity
      const promises = [
        fetchTasks({ limit: 6, status: "Open" }), // Recent open tasks
        fetchMyTasks({ limit: 5 }),
        fetchMyBids({ limit: 5 }),
        fetchRecommendations(5),
      ];

      // Add assigned tasks if user has completed tasks
      if (userStats.tasksCompleted > 0) {
        promises.push(fetchAssignedTasks({ limit: 5 }));
      }

      // Add received bids if user has posted tasks
      if (userStats.tasksPosted > 0) {
        promises.push(fetchReceivedBids({ limit: 5 }));
      }

      await Promise.all(promises);

      // Calculate dashboard stats
      calculateDashboardStats();
    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate dashboard statistics
  const calculateDashboardStats = () => {
    const stats = {
      overview: {
        totalTasks: tasks.length,
        activeBids: myBids.filter((bid) => bid.status === "Pending").length,
        completedTasks: userStats.tasksCompleted,
        totalEarnings: userStats.totalEarnings || 0,
      },
      thisWeek: {
        newTasks: tasks.filter(
          (task) =>
            new Date(task.createdAt) >=
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        newBids: myBids.filter(
          (bid) =>
            new Date(bid.createdAt) >=
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        acceptedBids: myBids.filter(
          (bid) =>
            bid.status === "Accepted" &&
            new Date(bid.updatedAt) >=
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
      },
    };

    setDashboardStats(stats);
  };

  // Refresh dashboard data
  const handleRefresh = async () => {
    await loadDashboardData();
  };

  // Handle quick filter changes
  const handleQuickFilterChange = (type, value) => {
    setQuickFilters((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  // Filter tasks based on quick filters
  const getFilteredTasks = () => {
    let filtered = tasks;

    switch (quickFilters.taskType) {
      case "urgent":
        filtered = tasks.filter(
          (task) =>
            task.isUrgent ||
            new Date(task.deadline) <=
              new Date(Date.now() + 24 * 60 * 60 * 1000)
        );
        break;
      case "recent":
        filtered = tasks.filter(
          (task) =>
            new Date(task.createdAt) >=
            new Date(Date.now() - 24 * 60 * 60 * 1000)
        );
        break;
      default:
        filtered = tasks;
    }

    return filtered.slice(0, 6);
  };

  // Filter bids based on quick filters
  const getFilteredBids = () => {
    let filtered = myBids;

    switch (quickFilters.bidType) {
      case "pending":
        filtered = myBids.filter((bid) => bid.status === "Pending");
        break;
      case "accepted":
        filtered = myBids.filter((bid) => bid.status === "Accepted");
        break;
      default:
        filtered = myBids;
    }

    return filtered.slice(0, 5);
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Get welcome message based on user role
  const getWelcomeMessage = () => {
    switch (userRole) {
      case "poster":
        return "Ready to post your next task?";
      case "bidder":
        return "Find great tasks to work on!";
      case "mixed":
        return "Manage your tasks and bids in one place";
      default:
        return "Welcome to TaskAuction!";
    }
  };

  // Render stats cards
  const renderStatsCards = () => {
    const statCards = [
      {
        title: "Available Tasks",
        value: dashboardStats?.overview.totalTasks || 0,
        icon: Target,
        color: "blue",
        change: `+${dashboardStats?.thisWeek.newTasks || 0} this week`,
        href: "/dashboard?tab=browse",
      },
      {
        title: "Active Bids",
        value: dashboardStats?.overview.activeBids || 0,
        icon: TrendingUp,
        color: "yellow",
        change: `${dashboardStats?.thisWeek.newBids || 0} new bids`,
        href: "/dashboard?tab=my-bids",
      },
      {
        title: "Completed",
        value: dashboardStats?.overview.completedTasks || 0,
        icon: CheckCircle,
        color: "green",
        change: `${dashboardStats?.thisWeek.acceptedBids || 0} accepted`,
        href: "/dashboard?tab=completed",
      },
      {
        title: "Total Earnings",
        value: `₹${dashboardStats?.overview.totalEarnings || 0}`,
        icon: IndianRupee,
        color: "purple",
        change: userRating.hasRating
          ? `${userRating.average.toFixed(1)}★ rating`
          : "No ratings yet",
        href: "/profile",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link key={index} to={card.href} className="block group">
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-lg bg-${card.color}-100 text-${card.color}-600`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {card.value}
                </h3>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {card.title}
                </p>
                <p className="text-xs text-gray-500">{card.change}</p>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  // Render quick actions
  const renderQuickActions = () => {
    const actions = [
      {
        title: "Post New Task",
        description: "Get help with your tasks",
        icon: Plus,
        color: "blue",
        href: "/tasks/create",
        show: userRole !== "bidder",
      },
      {
        title: "Browse Tasks",
        description: "Find tasks to bid on",
        icon: Search,
        color: "green",
        href: "/tasks",
        show: userRole !== "poster",
      },
      {
        title: "My Profile",
        description: "Update your information",
        icon: Star,
        color: "purple",
        href: "/profile",
        show: true,
      },
      {
        title: "Analytics",
        description: "View your performance",
        icon: BarChart3,
        color: "orange",
        href: "/analytics",
        show: userStats.tasksPosted > 0 || userStats.tasksCompleted > 0,
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {actions
          .filter((action) => action.show)
          .map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} to={action.href} className="block group">
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                  <div
                    className={`p-2 rounded-lg bg-${action.color}-100 text-${action.color}-600 w-fit mb-3`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {action.title}
                  </h4>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </Link>
            );
          })}
      </div>
    );
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-3xl font-bold text-gray-900">
                  {getGreeting()}, {user?.firstName}! 👋
                </h1>
                <p className="text-gray-600 mt-1">{getWelcomeMessage()}</p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  <span>Refresh</span>
                </button>

                <Link
                  to="/tasks/create"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post Task</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <p className="text-red-800 font-medium">
                    Error loading dashboard
                  </p>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Stats Cards */}
          {dashboardStats && renderStatsCards()}

          {/* Quick Actions */}
          {renderQuickActions()}

          {/* Main Content Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: "overview", label: "Overview", icon: Activity },
                  { id: "browse", label: "Browse Tasks", icon: Search },
                  { id: "my-bids", label: "My Bids", icon: TrendingUp },
                  { id: "my-tasks", label: "My Tasks", icon: Target },
                  {
                    id: "recommendations",
                    label: "Recommended",
                    icon: Award,
                    show: recommendations.length > 0,
                  },
                ].map((tab) => {
                  if (tab.show === false) return null;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? "border-blue-600 text-blue-600"
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
              {activeTab === "overview" && (
                <div className="space-y-8">
                  {/* Recent Tasks */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Recent Tasks
                      </h3>
                      <div className="flex items-center space-x-2">
                        <select
                          value={quickFilters.taskType}
                          onChange={(e) =>
                            handleQuickFilterChange("taskType", e.target.value)
                          }
                          className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Tasks</option>
                          <option value="urgent">Urgent</option>
                          <option value="recent">Recent</option>
                        </select>
                        <Link
                          to="/tasks"
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View All
                        </Link>
                      </div>
                    </div>

                    {isLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className="bg-gray-100 rounded-lg h-64 animate-pulse"
                          ></div>
                        ))}
                      </div>
                    ) : getFilteredTasks().length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getFilteredTasks().map((task) => (
                          <TaskCard key={task._id} task={task} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">
                          No tasks found
                        </h4>
                        <p className="text-gray-600 mb-4">
                          Try adjusting your filters or check back later for new
                          tasks.
                        </p>
                        <Link
                          to="/tasks"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Browse All Tasks
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Recent Bids */}
                  {myBids.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Your Recent Bids
                        </h3>
                        <div className="flex items-center space-x-2">
                          <select
                            value={quickFilters.bidType}
                            onChange={(e) =>
                              handleQuickFilterChange("bidType", e.target.value)
                            }
                            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="all">All Bids</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                          </select>
                          <Link
                            to="/dashboard?tab=my-bids"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View All
                          </Link>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {getFilteredBids().map((bid) => (
                          <BidCard key={bid._id} bid={bid} showActions={true} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {recommendations.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <Award className="w-5 h-5 text-yellow-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Recommended for You
                          </h3>
                        </div>
                        <Link
                          to="/dashboard?tab=recommendations"
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View All
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommendations.slice(0, 4).map((task) => (
                          <TaskCard key={task._id} task={task} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "browse" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Available Tasks
                    </h3>
                    <Link
                      to="/tasks"
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View All Tasks</span>
                    </Link>
                  </div>

                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-gray-100 rounded-lg h-64 animate-pulse"
                        ></div>
                      ))}
                    </div>
                  ) : tasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {tasks.slice(0, 9).map((task) => (
                        <TaskCard key={task._id} task={task} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        No tasks available
                      </h4>
                      <p className="text-gray-600 mb-6">
                        Check back later for new task opportunities.
                      </p>
                      <Link
                        to="/tasks"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Browse All Tasks
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "my-bids" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      My Bids
                    </h3>
                    <Link
                      to="/bids"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View All Bids
                    </Link>
                  </div>

                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-gray-100 rounded-lg h-32 animate-pulse"
                        ></div>
                      ))}
                    </div>
                  ) : myBids.length > 0 ? (
                    <div className="space-y-4">
                      {myBids.slice(0, 10).map((bid) => (
                        <BidCard key={bid._id} bid={bid} showActions={true} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        No bids yet
                      </h4>
                      <p className="text-gray-600 mb-6">
                        Start bidding on tasks to see them here.
                      </p>
                      <Link
                        to="/tasks"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Browse Tasks
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "my-tasks" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      My Posted Tasks
                    </h3>
                    <Link
                      to="/tasks/create"
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Post New Task</span>
                    </Link>
                  </div>

                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-gray-100 rounded-lg h-64 animate-pulse"
                        ></div>
                      ))}
                    </div>
                  ) : myTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myTasks.map((task) => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          showBidButton={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        No tasks posted
                      </h4>
                      <p className="text-gray-600 mb-6">
                        Post your first task to get help from other students.
                      </p>
                      <Link
                        to="/tasks/create"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Post Your First Task
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "recommendations" && (
                <div>
                  <div className="flex items-center space-x-2 mb-6">
                    <Award className="w-6 h-6 text-yellow-600" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      Recommended Tasks
                    </h3>
                  </div>

                  {recommendations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recommendations.map((task) => (
                        <TaskCard key={task._id} task={task} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        No recommendations yet
                      </h4>
                      <p className="text-gray-600 mb-6">
                        Complete a few tasks to get personalized
                        recommendations.
                      </p>
                      <Link
                        to="/tasks"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Browse Tasks
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
