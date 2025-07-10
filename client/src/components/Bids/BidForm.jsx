// client/src/components/Bids/BidForm.jsx
import React, { useState, useEffect } from "react";
import {
  IndianRupee,
  Clock,
  MessageSquare,
  Plus,
  X,
  Briefcase,
  Award,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Send,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import bidService from "../../services/bidService";

const BidForm = ({
  task,
  existingBid = null,
  isEdit = false,
  onSuccess,
  onCancel,
  className = "",
}) => {
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    proposedTimeline: "",
    message: "",
    experience: "",
    deliverables: [""],
  });

  const [portfolio, setPortfolio] = useState([
    { title: "", url: "", description: "" },
  ]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Initialize form for edit mode
  useEffect(() => {
    if (isEdit && existingBid) {
      setFormData({
        amount: existingBid.amount?.toString() || "",
        proposedTimeline: existingBid.proposedTimeline || "",
        message: existingBid.message || "",
        experience: existingBid.experience || "",
        deliverables:
          existingBid.deliverables?.length > 0
            ? existingBid.deliverables
            : [""],
      });

      if (existingBid.portfolio?.length > 0) {
        setPortfolio(existingBid.portfolio);
      }
    }
  }, [isEdit, existingBid]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Handle deliverables
  const addDeliverable = () => {
    setFormData((prev) => ({
      ...prev,
      deliverables: [...prev.deliverables, ""],
    }));
  };

  const removeDeliverable = (index) => {
    setFormData((prev) => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index),
    }));
  };

  const updateDeliverable = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      deliverables: prev.deliverables.map((item, i) =>
        i === index ? value : item
      ),
    }));
  };

  // Handle portfolio
  const addPortfolioItem = () => {
    setPortfolio((prev) => [...prev, { title: "", url: "", description: "" }]);
  };

  const removePortfolioItem = (index) => {
    setPortfolio((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePortfolioItem = (index, field, value) => {
    setPortfolio((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    // Amount validation
    if (!formData.amount) {
      newErrors.amount = "Bid amount is required";
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = "Please enter a valid amount";
      } else if (amount < task.budget.min) {
        newErrors.amount = `Amount must be at least ₹${task.budget.min}`;
      } else if (amount > task.budget.max) {
        newErrors.amount = `Amount cannot exceed ₹${task.budget.max}`;
      }
    }

    // Timeline validation
    if (!formData.proposedTimeline.trim()) {
      newErrors.proposedTimeline = "Proposed timeline is required";
    } else if (formData.proposedTimeline.length > 200) {
      newErrors.proposedTimeline = "Timeline cannot exceed 200 characters";
    }

    // Message validation (optional but limited)
    if (formData.message && formData.message.length > 1000) {
      newErrors.message = "Message cannot exceed 1000 characters";
    }

    // Experience validation (optional but limited)
    if (formData.experience && formData.experience.length > 500) {
      newErrors.experience =
        "Experience description cannot exceed 500 characters";
    }

    // Deliverables validation
    const validDeliverables = formData.deliverables.filter((d) => d.trim());
    if (validDeliverables.length === 0) {
      newErrors.deliverables = "At least one deliverable is required";
    }

    // Portfolio validation (optional but validate URLs)
    portfolio.forEach((item, index) => {
      if (item.url && item.url.trim()) {
        try {
          new URL(item.url);
        } catch {
          newErrors[`portfolio_${index}`] = "Invalid URL format";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const bidData = {
        taskId: task._id,
        amount: parseFloat(formData.amount),
        proposedTimeline: formData.proposedTimeline.trim(),
        message: formData.message.trim(),
        experience: formData.experience.trim(),
        deliverables: formData.deliverables.filter((d) => d.trim()),
        portfolio: portfolio.filter(
          (item) => item.title.trim() || item.url.trim()
        ),
      };

      let result;
      if (isEdit) {
        result = await bidService.updateBid(existingBid._id, bidData);
      } else {
        result = await bidService.createBid(bidData);
      }

      setSubmitStatus("success");

      if (onSuccess) {
        onSuccess(result.data);
      }
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitStatus("error");
      setErrors({
        submit:
          error.message || `Failed to ${isEdit ? "update" : "submit"} bid`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user can bid
  const canBid = () => {
    if (!user) return false;
    if (task.poster === user.id) return false;
    if (task.status !== "Open") return false;
    if (new Date(task.deadline) <= new Date()) return false;
    return true;
  };

  if (!canBid() && !isEdit) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
          <p className="text-yellow-800">
            {task.poster === user?.id
              ? "You cannot bid on your own task"
              : "This task is no longer accepting bids"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">
          {isEdit ? "Edit Your Bid" : "Place Your Bid"}
        </h3>
        <p className="text-gray-600 mt-1">
          Budget: ₹{task.budget.min} - ₹{task.budget.max}
        </p>
      </div>

      {/* Success/Error Messages */}
      {submitStatus === "success" && (
        <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800">
              Bid {isEdit ? "updated" : "submitted"} successfully!
            </span>
          </div>
        </div>
      )}

      {submitStatus === "error" && errors.submit && (
        <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{errors.submit}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Bid Amount and Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bid Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bid Amount *
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${
                  errors.amount
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder={`₹${task.budget.min} - ₹${task.budget.max}`}
                min={task.budget.min}
                max={task.budget.max}
                disabled={isSubmitting}
              />
            </div>
            {errors.amount && (
              <p className="text-red-600 text-sm mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Timeline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proposed Timeline *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.proposedTimeline}
                onChange={(e) =>
                  handleInputChange("proposedTimeline", e.target.value)
                }
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${
                  errors.proposedTimeline
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="e.g., 3 days, 1 week, 2 hours"
                maxLength="200"
                disabled={isSubmitting}
              />
            </div>
            {errors.proposedTimeline && (
              <p className="text-red-600 text-sm mt-1">
                {errors.proposedTimeline}
              </p>
            )}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message (Optional)
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              rows="4"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none resize-none ${
                errors.message
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Introduce yourself and explain why you're the right person for this task..."
              maxLength="1000"
              disabled={isSubmitting}
            />
          </div>
          {errors.message && (
            <p className="text-red-600 text-sm mt-1">{errors.message}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            {formData.message.length}/1000 characters
          </p>
        </div>

        {/* Deliverables */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What will you deliver? *
          </label>
          <div className="space-y-3">
            {formData.deliverables.map((deliverable, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={deliverable}
                  onChange={(e) => updateDeliverable(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g., Completed Python script with documentation"
                  maxLength="100"
                  disabled={isSubmitting}
                />
                {formData.deliverables.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDeliverable(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addDeliverable}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              disabled={isSubmitting}
            >
              <Plus className="w-4 h-4" />
              <span>Add Deliverable</span>
            </button>
          </div>
          {errors.deliverables && (
            <p className="text-red-600 text-sm mt-1">{errors.deliverables}</p>
          )}
        </div>

        {/* Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Relevant Experience (Optional)
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              value={formData.experience}
              onChange={(e) => handleInputChange("experience", e.target.value)}
              rows="3"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none resize-none ${
                errors.experience
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Describe your relevant experience for this type of task..."
              maxLength="500"
              disabled={isSubmitting}
            />
          </div>
          {errors.experience && (
            <p className="text-red-600 text-sm mt-1">{errors.experience}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            {formData.experience.length}/500 characters
          </p>
        </div>

        {/* Portfolio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Portfolio/Previous Work (Optional)
          </label>
          <div className="space-y-4">
            {portfolio.map((item, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">
                    Portfolio Item {index + 1}
                  </h4>
                  {portfolio.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePortfolioItem(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      updatePortfolioItem(index, "title", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Project title"
                    maxLength="100"
                    disabled={isSubmitting}
                  />
                  <div className="relative">
                    <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={item.url}
                      onChange={(e) =>
                        updatePortfolioItem(index, "url", e.target.value)
                      }
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                        errors[`portfolio_${index}`]
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      placeholder="https://example.com"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <textarea
                  value={item.description}
                  onChange={(e) =>
                    updatePortfolioItem(index, "description", e.target.value)
                  }
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="Brief description of this work..."
                  maxLength="200"
                  disabled={isSubmitting}
                />

                {errors[`portfolio_${index}`] && (
                  <p className="text-red-600 text-sm">
                    {errors[`portfolio_${index}`]}
                  </p>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addPortfolioItem}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              disabled={isSubmitting}
            >
              <Plus className="w-4 h-4" />
              <span>Add Portfolio Item</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{isEdit ? "Updating..." : "Submitting..."}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{isEdit ? "Update Bid" : "Submit Bid"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BidForm;
