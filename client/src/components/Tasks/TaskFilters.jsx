// client/src/components/Tasks/TaskFilters.jsx
import React from "react";
import {
  Tag,
  IndianRupee,
  Calendar,
  MapPin,
  X,
  GraduationCap,
  Clock,
} from "lucide-react";

const TaskFilters = ({
  filters,
  onFilterChange,
  onClearAll,
  showUserFilters = false,
}) => {
  // Categories
  const categories = [
    { value: "", label: "All Categories" },
    { value: "Academic", label: "Academic" },
    { value: "Campus Life", label: "Campus Life" },
    { value: "Tech Help", label: "Tech Help" },
    { value: "Personal", label: "Personal" },
    { value: "Other", label: "Other" },
  ];

  // Status options
  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "Open", label: "Open" },
    { value: "Assigned", label: "Assigned" },
    { value: "In-Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
    { value: "Closed", label: "Closed" },
  ];

  // Deadline options
  const deadlineOptions = [
    { value: "", label: "Any Deadline" },
    { value: "today", label: "Due Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "urgent", label: "Urgent Only" },
  ];

  // Budget presets
  const budgetPresets = [
    { min: "", max: "", label: "Any Budget" },
    { min: "50", max: "200", label: "₹50 - ₹200" },
    { min: "200", max: "500", label: "₹200 - ₹500" },
    { min: "500", max: "1000", label: "₹500 - ₹1000" },
    { min: "1000", max: "2000", label: "₹1000 - ₹2000" },
  ];

  const handleFilterChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  const handleBudgetPreset = (preset) => {
    onFilterChange({
      minBudget: preset.min,
      maxBudget: preset.max,
    });
  };

  const handleBudgetChange = (field, value) => {
    const numValue =
      value === "" ? "" : Math.max(0, Math.min(2000, parseInt(value) || 0));
    onFilterChange({ [field]: numValue.toString() });
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filters.search ||
      filters.category ||
      filters.minBudget ||
      filters.maxBudget ||
      filters.deadline ||
      filters.location ||
      (filters.status && filters.status !== "Open") ||
      filters.sameCollege
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Filter Tasks</h3>
        {hasActiveFilters() && (
          <button
            onClick={onClearAll}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-4 h-4 inline mr-1" />
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Deadline Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Deadline
          </label>
          <select
            value={filters.deadline}
            onChange={(e) => handleFilterChange("deadline", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {deadlineOptions.map((deadline) => (
              <option key={deadline.value} value={deadline.value}>
                {deadline.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Budget Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <IndianRupee className="w-4 h-4 inline mr-1" />
          Budget Range
        </label>

        {/* Budget Presets */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
          {budgetPresets.map((preset, index) => (
            <button
              key={index}
              onClick={() => handleBudgetPreset(preset)}
              className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                filters.minBudget === preset.min &&
                filters.maxBudget === preset.max
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom Budget Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Min Budget
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={filters.minBudget}
                onChange={(e) =>
                  handleBudgetChange("minBudget", e.target.value)
                }
                placeholder="50"
                min="50"
                max="2000"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Max Budget
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={filters.maxBudget}
                onChange={(e) =>
                  handleBudgetChange("maxBudget", e.target.value)
                }
                placeholder="2000"
                min="50"
                max="2000"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Budget range: ₹50 - ₹2000</p>
      </div>

      {/* Location Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          Location
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={filters.location}
            onChange={(e) => handleFilterChange("location", e.target.value)}
            placeholder="Search by location..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* User-specific Filters */}
      {showUserFilters && (
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">
            Personal Preferences
          </h4>

          <div className="space-y-3">
            {/* Same College Filter */}
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.sameCollege}
                onChange={(e) =>
                  handleFilterChange("sameCollege", e.target.checked)
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Same college only</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Active Filters
          </h4>
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                Category: {filters.category}
                <button
                  onClick={() => handleFilterChange("category", "")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.status && filters.status !== "Open" && (
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                Status: {filters.status}
                <button
                  onClick={() => handleFilterChange("status", "Open")}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(filters.minBudget || filters.maxBudget) && (
              <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md">
                Budget: ₹{filters.minBudget || "50"} - ₹
                {filters.maxBudget || "2000"}
                <button
                  onClick={() =>
                    onFilterChange({ minBudget: "", maxBudget: "" })
                  }
                  className="ml-1 text-yellow-600 hover:text-yellow-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.deadline && (
              <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-md">
                Deadline:{" "}
                {
                  deadlineOptions.find((d) => d.value === filters.deadline)
                    ?.label
                }
                <button
                  onClick={() => handleFilterChange("deadline", "")}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.location && (
              <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-md">
                Location: {filters.location}
                <button
                  onClick={() => handleFilterChange("location", "")}
                  className="ml-1 text-indigo-600 hover:text-indigo-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.sameCollege && (
              <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-md">
                Same College
                <button
                  onClick={() => handleFilterChange("sameCollege", false)}
                  className="ml-1 text-orange-600 hover:text-orange-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskFilters;
