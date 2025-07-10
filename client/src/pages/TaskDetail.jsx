// client/src/pages/TaskDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  MapPin,
  User,
  Calendar,
  IndianRupee,
  Users,
  AlertTriangle,
  Star,
  Badge,
  Timer,
  Edit,
  Trash2,
  MessageSquare,
  Share2,
  Flag,
  CheckCircle,
  XCircle,
  Play,
  Eye,
  Download,
  ExternalLink,
  AlertCircle,
  Loader,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import taskService from "../services/taskService";
import bidService from "../services/bidService";
import BidForm from "../components/Bids/BidForm";
import BidList from "../components/Bids/BidList";

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // State
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBidForm, setShowBidForm] = useState(false);
  const [userBid, setUserBid] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Fetch task details
  useEffect(() => {
    fetchTaskDetail();
  }, [taskId]);

  const fetchTaskDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await taskService.getTask(taskId);

      if (response.success) {
        setTask(response.task);

        // Check if user has already bid on this task
        if (isAuthenticated && user) {
          const bidResponse = await bidService.getBids({
            taskId,
            type: "my-bids",
            limit: 1,
          });

          if (bidResponse.success && bidResponse.bids.length > 0) {
            setUserBid(bidResponse.bids[0]);
          }
        }
      } else {
        setError(response.message || "Failed to load task");
      }
    } catch (err) {
      console.error("Error fetching task:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle bid submission
  const handleBidSuccess = (bid) => {
    setUserBid(bid);
    setShowBidForm(false);
    fetchTaskDetail(); // Refresh task data
  };

  // Handle bid edit
  const handleBidEdit = () => {
    setShowBidForm(true);
  };

  // Handle bid withdrawal
  const handleBidWithdraw = async () => {
    if (!userBid) return;

    try {
      setActionLoading(true);
      const response = await bidService.withdrawBid(userBid._id);

      if (response.success) {
        setUserBid(null);
        fetchTaskDetail();
      } else {
        alert(response.message || "Failed to withdraw bid");
      }
    } catch (error) {
      console.error("Error withdrawing bid:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async () => {
    try {
      setActionLoading(true);
      const response = await taskService.deleteTask(taskId);

      if (response.success) {
        navigate("/dashboard", { replace: true });
      } else {
        alert(response.message || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
      setDeleteConfirm(false);
    }
  };

  // Handle bid accept/reject
  const handleBidAccept = async (bidId) => {
    try {
      setActionLoading(true);
      const response = await taskService.acceptBid(taskId, bidId);

      if (response.success) {
        fetchTaskDetail();
      } else {
        alert(response.message || "Failed to accept bid");
      }
    } catch (error) {
      console.error("Error accepting bid:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBidReject = async (bidId) => {
    try {
      setActionLoading(true);
      // This would need to be implemented in bidService
      // const response = await bidService.rejectBid(bidId);
      console.log("Rejecting bid:", bidId);
      fetchTaskDetail();
    } catch (error) {
      console.error("Error rejecting bid:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate time remaining
  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;

    if (diff <= 0)
      return { text: "Expired", color: "text-red-600", urgent: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return {
        text: `${days} day${days > 1 ? "s" : ""} left`,
        color: days <= 1 ? "text-orange-600" : "text-gray-600",
        urgent: days <= 1,
      };
    } else {
      return {
        text: `${hours} hour${hours > 1 ? "s" : ""} left`,
        color: "text-red-600",
        urgent: true,
      };
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-green-100 text-green-800 border-green-200";
      case "Assigned":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "In-Progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Completed":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Closed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    switch (category) {
      case "Academic":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Campus Life":
        return "bg-green-50 text-green-700 border-green-200";
      case "Tech Help":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Personal":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Check permissions
  const isTaskOwner = task && user && task.poster._id === user._id;
  const canBid =
    task &&
    user &&
    task.poster._id !== user._id &&
    task.status === "Open" &&
    !userBid;
  const canEdit = isTaskOwner && task.status === "Open" && task.bidCount === 0;
  const canDelete =
    isTaskOwner && (task.status === "Open" || task.status === "Closed");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Task Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error ||
              "The task you're looking for doesn't exist or has been removed."}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const timeRemaining = getTimeRemaining(task.deadline);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Flag className="w-5 h-5" />
            </button>
            {canEdit && (
              <Link
                to={`/tasks/${task._id}/edit`}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </Link>
            )}
            {canDelete && (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-lg border ${getCategoryColor(
                      task.category
                    )}`}
                  >
                    {task.category}
                  </span>
                  {task.isUrgent && (
                    <span className="flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Urgent
                    </span>
                  )}
                </div>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-lg border ${getStatusColor(
                    task.status
                  )}`}
                >
                  {task.status}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {task.title}
              </h1>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center text-green-600">
                  <IndianRupee className="w-6 h-6 mr-2" />
                  <span className="font-bold text-2xl">
                    {task.budget.min === task.budget.max
                      ? `₹${task.budget.min}`
                      : `₹${task.budget.min} - ₹${task.budget.max}`}
                  </span>
                </div>

                <div
                  className={`flex items-center space-x-2 ${timeRemaining.color}`}
                >
                  {timeRemaining.urgent ? (
                    <Timer className="w-5 h-5" />
                  ) : (
                    <Calendar className="w-5 h-5" />
                  )}
                  <span className="font-semibold">{timeRemaining.text}</span>
                </div>
              </div>

              {/* Task Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Bids</p>
                    <p className="font-semibold">{task.bidCount || 0}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Views</p>
                    <p className="font-semibold">{task.viewCount || 0}</p>
                  </div>
                </div>
                {task.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold">{task.location}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {task.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Description
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            </div>

            {/* Images */}
            {task.images && task.images.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Images
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {task.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={`Task image ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <button className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-lg text-gray-700 hover:text-gray-900 transition-all">
                          <ExternalLink className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {task.attachments && task.attachments.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Attachments
                </h2>
                <div className="space-y-3">
                  {task.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Download className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {attachment.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {attachment.size}
                          </p>
                        </div>
                      </div>
                      <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bid Form */}
            {canBid && showBidForm && (
              <BidForm
                task={task}
                onSuccess={handleBidSuccess}
                onCancel={() => setShowBidForm(false)}
                className="bg-white rounded-xl shadow-sm border border-gray-200"
              />
            )}

            {/* Edit Bid Form */}
            {userBid && showBidForm && (
              <BidForm
                task={task}
                existingBid={userBid}
                isEdit={true}
                onSuccess={handleBidSuccess}
                onCancel={() => setShowBidForm(false)}
                className="bg-white rounded-xl shadow-sm border border-gray-200"
              />
            )}

            {/* Bids Section */}
            {(isTaskOwner || task.status !== "Open") && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <BidList
                  taskId={task._id}
                  type="all"
                  isTaskOwner={isTaskOwner}
                  onBidAccept={handleBidAccept}
                  onBidReject={handleBidReject}
                  pageTitle="Bids for this Task"
                  emptyMessage="No bids have been placed yet."
                  className="p-6"
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Poster */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Posted By
              </h3>
              <div className="flex items-center space-x-3 mb-4">
                {task.poster.avatar ? (
                  <img
                    src={task.poster.avatar}
                    alt={`${task.poster.firstName} ${task.poster.lastName}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {task.poster.firstName} {task.poster.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{task.poster.college}</p>
                </div>
              </div>

              {task.poster.rating && (
                <div className="flex items-center space-x-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="font-semibold">
                    {task.poster.rating.average.toFixed(1)}
                  </span>
                  <span className="text-gray-500">
                    ({task.poster.rating.count} reviews)
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {task.poster.stats?.tasksPosted || 0}
                  </p>
                  <p className="text-sm text-gray-600">Tasks Posted</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {task.poster.stats?.tasksCompleted || 0}
                  </p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>

              {!isTaskOwner && task.status === "Assigned" && (
                <Link
                  to={`/chat/${task._id}`}
                  className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat</span>
                </Link>
              )}
            </div>

            {/* User's Bid Status */}
            {userBid && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Bid
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold text-green-600">
                      ₹{userBid.amount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Timeline:</span>
                    <span className="font-semibold">
                      {userBid.proposedTimeline}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-md ${
                        userBid.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : userBid.status === "Accepted"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {userBid.status}
                    </span>
                  </div>
                </div>

                {userBid.status === "Pending" && (
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={handleBidEdit}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleBidWithdraw}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Withdraw
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {!isTaskOwner && task.status === "Open" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Actions
                </h3>

                {!isAuthenticated ? (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      Please log in to place a bid
                    </p>
                    <Link
                      to="/login"
                      className="w-full inline-block px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Log In
                    </Link>
                  </div>
                ) : userBid ? (
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-600 font-medium">
                      You have already placed a bid
                    </p>
                  </div>
                ) : canBid ? (
                  <button
                    onClick={() => setShowBidForm(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Place a Bid
                  </button>
                ) : (
                  <div className="text-center">
                    <XCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Bidding is not available</p>
                  </div>
                )}
              </div>
            )}

            {/* Task Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Task Posted</p>
                    <p className="text-xs text-gray-500">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {task.acceptedBid && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Bid Accepted</p>
                      <p className="text-xs text-gray-500">
                        {new Date(
                          task.acceptedBid.acceptedAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      timeRemaining.urgent ? "bg-red-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <div>
                    <p className="text-sm font-medium">Deadline</p>
                    <p className="text-xs text-gray-500">
                      {new Date(task.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this task? This action cannot be
              undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
