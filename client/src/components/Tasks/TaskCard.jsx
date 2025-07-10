// client/src/components/Tasks/TaskCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  MapPin,
  User,
  Calendar,
  IndianRupee,
  Users,
  AlertTriangle,
  Star,
  Badge,
  ArrowRight,
  Timer,
} from "lucide-react";

const TaskCard = ({ task, showBidButton = true, className = "" }) => {
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

  // Get status badge color
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

  // Format budget
  const formatBudget = (budget) => {
    if (budget.min === budget.max) {
      return `₹${budget.min}`;
    }
    return `₹${budget.min} - ₹${budget.max}`;
  };

  const timeRemaining = getTimeRemaining(task.deadline);

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${className}`}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-md border ${getCategoryColor(
                task.category
              )}`}
            >
              {task.category}
            </span>
            {task.isUrgent && (
              <span className="flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Urgent
              </span>
            )}
          </div>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(
              task.status
            )}`}
          >
            {task.status}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
          <Link to={`/tasks/${task._id}`}>{task.title}</Link>
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {task.description}
        </p>

        {/* Budget */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-green-600">
            <IndianRupee className="w-4 h-4 mr-1" />
            <span className="font-semibold text-lg">
              {formatBudget(task.budget)}
            </span>
          </div>

          {task.priority && task.priority !== "Medium" && (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-md ${
                task.priority === "High"
                  ? "bg-orange-100 text-orange-700"
                  : task.priority === "Urgent"
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {task.priority} Priority
            </span>
          )}
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {task.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md"
              >
                #{tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
                +{task.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
        <div className="flex items-center justify-between mb-3">
          {/* Poster Info */}
          <div className="flex items-center space-x-2">
            {task.poster?.avatar ? (
              <img
                src={task.poster.avatar}
                alt={`${task.poster.firstName} ${task.poster.lastName}`}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-blue-600" />
              </div>
            )}
            <span className="text-sm text-gray-600">
              {task.poster?.firstName} {task.poster?.lastName}
            </span>
            {task.poster?.rating?.average && (
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-500">
                  {task.poster.rating.average.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Bid Count */}
          <div className="flex items-center space-x-1 text-gray-500">
            <Users className="w-4 h-4" />
            <span className="text-sm">
              {task.bidCount || 0} bid{task.bidCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Location & Deadline */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {task.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-24">{task.location}</span>
              </div>
            )}
            <div
              className={`flex items-center space-x-1 ${timeRemaining.color}`}
            >
              {timeRemaining.urgent ? (
                <Timer className="w-3 h-3" />
              ) : (
                <Calendar className="w-3 h-3" />
              )}
              <span className="font-medium">{timeRemaining.text}</span>
            </div>
          </div>

          {/* Action Button */}
          {showBidButton && task.status === "Open" && (
            <Link
              to={`/tasks/${task._id}`}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>View Details</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}

          {task.userHasBidded && (
            <span className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-lg">
              <Badge className="w-3 h-3" />
              <span>Bidded</span>
            </span>
          )}
        </div>
      </div>

      {/* Image Preview */}
      {task.images && task.images.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex space-x-2 overflow-x-auto">
            {task.images.slice(0, 3).map((image, index) => (
              <img
                key={index}
                src={image.url}
                alt={`Task image ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
              />
            ))}
            {task.images.length > 3 && (
              <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                +{task.images.length - 3}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
