// client/src/components/Tasks/TaskList.jsx
import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Grid,
  List,
  Search,
  Filter,
  SortAsc,
  AlertCircle,
  Loader,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import TaskCard from "./TaskCard";
import TaskFilters from "./TaskFilters";
import taskService from "../../services/taskService";
import { useAuth } from "../../hooks/useAuth";

const TaskList = ({
  showFilters = true,
  showCreateButton = true,
  initialFilters = {},
  pageTitle = "Available Tasks",
  emptyMessage = "No tasks found matching your criteria.",
}) => {
  const { user } = useAuth();

  // State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    minBudget: "",
    maxBudget: "",
    deadline: "",
    location: "",
    status: "Open",
    sort: "newest",
    sameCollege: false,
    ...initialFilters,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTasks: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch tasks
  const fetchTasks = async (page = 1, resetTasks = false) => {
    try {
      if (resetTasks) {
        setLoading(true);
      }

      setError(null);

      const queryParams = {
        page,
        limit: 20,
        ...filters,
      };

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

      const response = await taskService.getTasks(queryParams);

      if (resetTasks || page === 1) {
        setTasks(response.data);
      } else {
        // Append for pagination
        setTasks((prev) => [...prev, ...response.data]);
      }

      setPagination(response.pagination);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTasks(1, true);
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Handle search
  const handleSearch = (searchTerm) => {
    handleFilterChange({ search: searchTerm });
  };

  // Load more tasks (pagination)
  const loadMore = () => {
    if (pagination.hasNext && !loading) {
      fetchTasks(pagination.currentPage + 1, false);
    }
  };

  // Refresh tasks
  const refreshTasks = async () => {
    setRefreshing(true);
    await fetchTasks(1, true);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      search: "",
      category: "",
      minBudget: "",
      maxBudget: "",
      deadline: "",
      location: "",
      status: initialFilters.status || "Open",
      sort: "newest",
      sameCollege: false,
    });
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.minBudget || filters.maxBudget) count++;
    if (filters.deadline) count++;
    if (filters.location) count++;
    if (filters.status && filters.status !== "Open") count++;
    if (filters.sameCollege) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Sort options
  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "deadline", label: "Deadline" },
    { value: "budget_high", label: "Highest Budget" },
    { value: "budget_low", label: "Lowest Budget" },
    { value: "popular", label: "Most Bids" },
    { value: "urgent", label: "Urgent First" },
  ];

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-600 mt-1">
            {pagination.totalTasks} task{pagination.totalTasks !== 1 ? "s" : ""}{" "}
            available
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Create Task Button */}
          {showCreateButton && user && (
            <Link
              to="/tasks/create"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Post Task</span>
            </Link>
          )}

          {/* Refresh Button */}
          <button
            onClick={refreshTasks}
            disabled={refreshing}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              } rounded-l-lg transition-colors`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              } rounded-r-lg transition-colors`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

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

        {/* Filters Toggle */}
        {showFilters && (
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
              showFiltersPanel
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

      {/* Filters Panel */}
      {showFilters && showFiltersPanel && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <TaskFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearAll={clearAllFilters}
            showUserFilters={!!user}
          />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="text-red-800 font-medium">Error loading tasks</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchTasks(1, true)}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Tasks Grid/List */}
      {tasks.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              showBidButton={true}
              className={viewMode === "list" ? "max-w-none" : ""}
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
                No tasks found
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

              {showCreateButton && user && (
                <div className="mt-4">
                  <Link
                    to="/tasks/create"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Post the first task</span>
                  </Link>
                </div>
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
              `Load More (${pagination.totalTasks - tasks.length} remaining)`
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskList;
