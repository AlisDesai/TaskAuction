// client/src/components/Bids/BidList.jsx
import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  SortAsc,
  Filter,
  AlertCircle,
  Loader,
  Users,
  TrendingUp,
  Award,
  Eye,
  Search,
} from "lucide-react";
import BidCard from "./BidCard";
import bidService from "../../services/bidService";
import { useAuth } from "../../hooks/useAuth";

const BidList = ({
  taskId = null,
  type = "all", // 'all', 'my-bids', 'received'
  isTaskOwner = false,
  onBidAccept,
  onBidReject,
  onBidWithdraw,
  onBidDelete,
  onBidEdit,
  showFilters = true,
  pageTitle = "Bids",
  emptyMessage = "No bids found.",
  className = "",
}) => {
  const { user } = useAuth();

  // State
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    sort: "newest",
    minAmount: "",
    maxAmount: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBids: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  // Fetch bids
  const fetchBids = async (page = 1, resetBids = false) => {
    try {
      if (resetBids) {
        setLoading(true);
      }

      setError(null);

      const queryParams = {
        page,
        limit: 20,
        type,
        ...filters,
      };

      if (taskId) {
        queryParams.taskId = taskId;
      }

      // Remove empty filters
      Object.keys(queryParams).forEach((key) => {
        if (
          queryParams[key] === "" ||
          queryParams[key] === null ||
          queryParams[key] === undefined
        ) {
          delete queryParams[key];
        }
      });

      const response = await bidService.getBids(queryParams);

      if (resetBids || page === 1) {
        setBids(response.data);
      } else {
        // Append for pagination
        setBids((prev) => [...prev, ...response.data]);
      }

      setPagination(response.pagination);
    } catch (err) {
      console.error("Error fetching bids:", err);
      setError(err.message || "Failed to load bids");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch bid statistics (for task owners)
  const fetchBidStats = async () => {
    if (!taskId || !isTaskOwner) return;

    try {
      const response = await bidService.getBidStats(taskId);
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching bid stats:", err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchBids(1, true);
    if (isTaskOwner && taskId) {
      fetchBidStats();
    }
  }, [filters, taskId, type]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Load more bids (pagination)
  const loadMore = () => {
    if (pagination.hasNext && !loading) {
      fetchBids(pagination.currentPage + 1, false);
    }
  };

  // Refresh bids
  const refreshBids = async () => {
    setRefreshing(true);
    await fetchBids(1, true);
    if (isTaskOwner && taskId) {
      await fetchBidStats();
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      status: "",
      sort: "newest",
      minAmount: "",
      maxAmount: "",
    });
  };

  // Handle bid actions
  const handleBidAccept = async (bidId) => {
    try {
      if (onBidAccept) {
        await onBidAccept(bidId);
      }
      await refreshBids();
    } catch (error) {
      console.error("Error accepting bid:", error);
    }
  };

  const handleBidReject = async (bidId) => {
    try {
      if (onBidReject) {
        await onBidReject(bidId);
      }
      await refreshBids();
    } catch (error) {
      console.error("Error rejecting bid:", error);
    }
  };

  const handleBidWithdraw = async (bidId) => {
    try {
      if (onBidWithdraw) {
        await onBidWithdraw(bidId);
      } else {
        await bidService.withdrawBid(bidId);
      }
      await refreshBids();
    } catch (error) {
      console.error("Error withdrawing bid:", error);
    }
  };

  const handleBidDelete = async (bidId) => {
    try {
      if (onBidDelete) {
        await onBidDelete(bidId);
      } else {
        await bidService.deleteBid(bidId);
      }
      await refreshBids();
    } catch (error) {
      console.error("Error deleting bid:", error);
    }
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.minAmount || filters.maxAmount) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Sort options
  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "amount_high", label: "Highest Amount" },
    { value: "amount_low", label: "Lowest Amount" },
  ];

  // Status options
  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "Pending", label: "Pending" },
    { value: "Accepted", label: "Accepted" },
    { value: "Rejected", label: "Rejected" },
    { value: "Withdrawn", label: "Withdrawn" },
  ];

  if (loading && bids.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading bids...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Panel (for task owners) */}
      {isTaskOwner && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Bids</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.general.totalBids}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Avg Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{Math.round(stats.general.avgAmount || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Award className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Range</p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{stats.general.minAmount || 0} - ₹
                  {stats.general.maxAmount || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.general.pendingBids}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{pageTitle}</h2>
          <p className="text-gray-600 mt-1">
            {pagination.totalBids} bid{pagination.totalBids !== 1 ? "s" : ""}{" "}
            found
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Refresh Button */}
          <button
            onClick={refreshBids}
            disabled={refreshing}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Sort */}
        <div className="sm:w-48">
          <div className="relative">
            <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange({ sort: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter */}
        <div className="sm:w-40">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange({ status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filters Toggle */}
        {showFilters && (
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${showFiltersPanel
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && showFiltersPanel && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Advanced Filters
            </h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) =>
                    handleFilterChange({ minAmount: e.target.value })
                  }
                  placeholder="Min ₹"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <input
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) =>
                    handleFilterChange({ maxAmount: e.target.value })
                  }
                  placeholder="Max ₹"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="text-red-800 font-medium">Error loading bids</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchBids(1, true)}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Bids List */}
      {bids.length > 0 ? (
        <div className="space-y-4">
          {bids.map((bid) => (
            <BidCard
              key={bid._id}
              bid={bid}
              isTaskOwner={isTaskOwner}
              onAccept={handleBidAccept}
              onReject={handleBidReject}
              onWithdraw={handleBidWithdraw}
              onDelete={handleBidDelete}
              onEdit={onBidEdit}
              showActions={true}
            />
          ))}
        </div>
      ) : (
        !loading && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No bids found
              </h3>
              <p className="text-gray-600 mb-6">{emptyMessage}</p>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )
      )}

      {/* Load More Button */}
      {pagination.hasNext && (
        <div className="text-center pt-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              `Load More (${pagination.totalBids - bids.length} remaining)`
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default BidList;
