// client/src/components/Bids/BidCard.jsx
import React, { useState } from "react";
import {
  IndianRupee,
  Clock,
  User,
  Star,
  MessageCircle,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  Eye,
  Award,
  Calendar,
  Briefcase,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";

const BidCard = ({
  bid,
  isTaskOwner = false,
  onAccept,
  onReject,
  onWithdraw,
  onDelete,
  onEdit,
  showActions = true,
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showFullMessage, setShowFullMessage] = useState(false);

  // Handle action with loading state
  const handleAction = async (action, ...args) => {
    setIsLoading(true);
    try {
      await action(...args);
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "Withdrawn":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Format time since bid
  const formatTimeSince = (date) => {
    const now = new Date();
    const diffTime = now - new Date(date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return `${Math.max(1, diffMinutes)} minute${
        diffMinutes > 1 ? "s" : ""
      } ago`;
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${
        bid.isHighlighted ? "border-yellow-300 bg-yellow-50" : "border-gray-200"
      } ${className}`}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          {/* Bidder Info */}
          <div className="flex items-center space-x-3">
            {bid.bidder?.avatar ? (
              <img
                src={bid.bidder.avatar}
                alt={`${bid.bidder.firstName} ${bid.bidder.lastName}`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">
                {bid.bidder?.firstName} {bid.bidder?.lastName}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {bid.bidder?.rating?.average && (
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span>{bid.bidder.rating.average.toFixed(1)}</span>
                    <span>({bid.bidder.rating.count || 0})</span>
                  </div>
                )}
                {bid.bidder?.stats?.tasksCompleted && (
                  <div className="flex items-center space-x-1">
                    <Briefcase className="w-3 h-3" />
                    <span>{bid.bidder.stats.tasksCompleted} completed</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status and Highlight Badge */}
          <div className="flex items-center space-x-2">
            {bid.isHighlighted && (
              <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-md border border-yellow-200">
                <Award className="w-3 h-3 mr-1" />
                Featured
              </span>
            )}
            <span
              className={`px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(
                bid.status
              )}`}
            >
              {bid.status}
            </span>
          </div>
        </div>

        {/* Bid Amount and Timeline */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-green-600">
            <IndianRupee className="w-5 h-5 mr-1" />
            <span className="text-xl font-bold">₹{bid.amount}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-sm">{bid.proposedTimeline}</span>
          </div>
        </div>

        {/* Message */}
        {bid.message && (
          <div className="mb-4">
            <p
              className={`text-gray-700 text-sm ${
                showFullMessage ? "" : "line-clamp-3"
              }`}
            >
              {bid.message}
            </p>
            {bid.message.length > 150 && (
              <button
                onClick={() => setShowFullMessage(!showFullMessage)}
                className="text-blue-600 hover:text-blue-700 text-xs mt-1"
              >
                {showFullMessage ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {/* Deliverables */}
        {bid.deliverables && bid.deliverables.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Deliverables:
            </h4>
            <ul className="list-disc list-inside space-y-1">
              {bid.deliverables.slice(0, 3).map((deliverable, index) => (
                <li key={index} className="text-sm text-gray-600">
                  {deliverable}
                </li>
              ))}
              {bid.deliverables.length > 3 && (
                <li className="text-sm text-gray-500 italic">
                  +{bid.deliverables.length - 3} more deliverables
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Experience */}
        {bid.experience && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Relevant Experience:
            </h4>
            <p className="text-sm text-gray-600 line-clamp-2">
              {bid.experience}
            </p>
          </div>
        )}

        {/* Portfolio */}
        {bid.portfolio && bid.portfolio.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Portfolio:
            </h4>
            <div className="space-y-2">
              {bid.portfolio.slice(0, 2).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h5 className="text-sm font-medium text-gray-900">
                      {item.title}
                    </h5>
                    {item.description && (
                      <p className="text-xs text-gray-600">
                        {item.description}
                      </p>
                    )}
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
              {bid.portfolio.length > 2 && (
                <p className="text-xs text-gray-500 italic">
                  +{bid.portfolio.length - 2} more portfolio items
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
        <div className="flex items-center justify-between">
          {/* Time and Task Info */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{formatTimeSince(bid.createdAt)}</span>
            </div>

            {bid.task && (
              <Link
                to={`/tasks/${bid.task._id || bid.task}`}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
              >
                <Eye className="w-3 h-3" />
                <span>View Task</span>
              </Link>
            )}
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex items-center space-x-2">
              {/* Task Owner Actions */}
              {isTaskOwner && bid.status === "Pending" && (
                <>
                  <button
                    onClick={() => handleAction(onReject, bid._id)}
                    disabled={isLoading}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleAction(onAccept, bid._id)}
                    disabled={isLoading}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Accept</span>
                  </button>
                </>
              )}

              {/* Bidder Actions */}
              {!isTaskOwner && (
                <>
                  {bid.status === "Pending" && (
                    <>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(bid)}
                          disabled={isLoading}
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}
                      {onWithdraw && (
                        <button
                          onClick={() => handleAction(onWithdraw, bid._id)}
                          disabled={isLoading}
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>Withdraw</span>
                        </button>
                      )}
                    </>
                  )}

                  {(bid.status === "Withdrawn" || bid.status === "Rejected") &&
                    onDelete && (
                      <button
                        onClick={() => handleAction(onDelete, bid._id)}
                        disabled={isLoading}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                </>
              )}

              {/* Chat Button (for accepted bids) */}
              {bid.status === "Accepted" && (
                <Link
                  to={`/chat/${bid.task._id || bid.task}`}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>Chat</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default BidCard;
