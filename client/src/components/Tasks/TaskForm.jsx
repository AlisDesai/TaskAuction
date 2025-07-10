// client/src/components/Tasks/TaskForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Upload,
  X,
  MapPin,
  Calendar,
  IndianRupee,
  Tag,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Paperclip,
  Clock,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import taskService from "../../services/taskService";

const TaskForm = ({ task = null, isEdit = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget: { min: "", max: "" },
    deadline: "",
    location: "",
    priority: "Medium",
    tags: "",
  });

  const [files, setFiles] = useState({
    images: [],
    documents: [],
  });

  const [previewImages, setPreviewImages] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Categories
  const categories = [
    { value: "Academic", label: "Academic", icon: "📚" },
    { value: "Campus Life", label: "Campus Life", icon: "🏫" },
    { value: "Tech Help", label: "Tech Help", icon: "💻" },
    { value: "Personal", label: "Personal", icon: "👤" },
    { value: "Other", label: "Other", icon: "📝" },
  ];

  const priorities = [
    { value: "Low", label: "Low", color: "text-blue-600" },
    { value: "Medium", label: "Medium", color: "text-green-600" },
    { value: "High", label: "High", color: "text-orange-600" },
    { value: "Urgent", label: "Urgent", color: "text-red-600" },
  ];

  // Initialize form data for edit mode
  useEffect(() => {
    if (isEdit && task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        category: task.category || "",
        budget: {
          min: task.budget?.min?.toString() || "",
          max: task.budget?.max?.toString() || "",
        },
        deadline: task.deadline
          ? new Date(task.deadline).toISOString().slice(0, 16)
          : "",
        location: task.location || "",
        priority: task.priority || "Medium",
        tags: task.tags ? task.tags.join(", ") : "",
      });

      if (task.images) {
        setPreviewImages(
          task.images.map((img) => ({ ...img, isExisting: true }))
        );
      }
      if (task.attachments) {
        setAttachments(
          task.attachments.map((att) => ({ ...att, isExisting: true }))
        );
      }
    }
  }, [isEdit, task]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Handle file uploads
  const handleImageUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validImages = selectedFiles.filter((file) => {
      const isValid =
        file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024; // 5MB limit
      return isValid;
    });

    if (validImages.length !== selectedFiles.length) {
      setErrors((prev) => ({
        ...prev,
        images: "Some files were skipped. Please upload only images under 5MB.",
      }));
    }

    setFiles((prev) => ({
      ...prev,
      images: [...prev.images, ...validImages],
    }));

    // Create preview URLs
    validImages.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImages((prev) => [
          ...prev,
          {
            url: e.target.result,
            filename: file.name,
            file: file,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDocumentUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validDocs = selectedFiles.filter((file) => {
      const isValid = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValid;
    });

    if (validDocs.length !== selectedFiles.length) {
      setErrors((prev) => ({
        ...prev,
        documents: "Some files were skipped. Please upload files under 10MB.",
      }));
    }

    setFiles((prev) => ({
      ...prev,
      documents: [...prev.documents, ...validDocs],
    }));

    // Add to attachments list
    validDocs.forEach((file) => {
      setAttachments((prev) => [
        ...prev,
        {
          filename: file.name,
          originalName: file.name,
          file: file,
        },
      ]);
    });
  };

  // Remove files
  const removeImage = (index) => {
    const imageToRemove = previewImages[index];

    if (imageToRemove.isExisting) {
      // Handle removal of existing images in edit mode
      // You might want to track these for backend deletion
    } else {
      // Remove from files array
      const fileIndex = files.images.findIndex(
        (file) => file.name === imageToRemove.filename
      );
      if (fileIndex > -1) {
        setFiles((prev) => ({
          ...prev,
          images: prev.images.filter((_, i) => i !== fileIndex),
        }));
      }
    }

    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeDocument = (index) => {
    const docToRemove = attachments[index];

    if (!docToRemove.isExisting) {
      const fileIndex = files.documents.findIndex(
        (file) => file.name === docToRemove.filename
      );
      if (fileIndex > -1) {
        setFiles((prev) => ({
          ...prev,
          documents: prev.documents.filter((_, i) => i !== fileIndex),
        }));
      }
    }

    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title cannot exceed 100 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length > 2000) {
      newErrors.description = "Description cannot exceed 2000 characters";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.budget.min) {
      newErrors["budget.min"] = "Minimum budget is required";
    } else if (parseInt(formData.budget.min) < 50) {
      newErrors["budget.min"] = "Minimum budget must be at least ₹50";
    } else if (parseInt(formData.budget.min) > 2000) {
      newErrors["budget.min"] = "Minimum budget cannot exceed ₹2000";
    }

    if (!formData.budget.max) {
      newErrors["budget.max"] = "Maximum budget is required";
    } else if (parseInt(formData.budget.max) < 50) {
      newErrors["budget.max"] = "Maximum budget must be at least ₹50";
    } else if (parseInt(formData.budget.max) > 2000) {
      newErrors["budget.max"] = "Maximum budget cannot exceed ₹2000";
    }

    if (
      formData.budget.min &&
      formData.budget.max &&
      parseInt(formData.budget.min) > parseInt(formData.budget.max)
    ) {
      newErrors["budget.max"] =
        "Maximum budget must be greater than minimum budget";
    }

    if (!formData.deadline) {
      newErrors.deadline = "Deadline is required";
    } else if (new Date(formData.deadline) <= new Date()) {
      newErrors.deadline = "Deadline must be in the future";
    }

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
      const submitData = new FormData();

      // Add form data
      submitData.append("title", formData.title.trim());
      submitData.append("description", formData.description.trim());
      submitData.append("category", formData.category);
      submitData.append("budget[min]", formData.budget.min);
      submitData.append("budget[max]", formData.budget.max);
      submitData.append("deadline", formData.deadline);
      submitData.append("priority", formData.priority);

      if (formData.location.trim()) {
        submitData.append("location", formData.location.trim());
      }

      if (formData.tags.trim()) {
        submitData.append("tags", formData.tags.trim());
      }

      // Add files
      files.images.forEach((file) => {
        submitData.append("images", file);
      });

      files.documents.forEach((file) => {
        submitData.append("documents", file);
      });

      let result;
      if (isEdit) {
        result = await taskService.updateTask(task._id, submitData);
      } else {
        result = await taskService.createTask(submitData);
      }

      setSubmitStatus("success");

      setTimeout(() => {
        navigate(`/tasks/${result.data._id}`);
      }, 1500);
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitStatus("error");
      setErrors({ submit: error.message || "Failed to save task" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum datetime for deadline (current time + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Edit Task" : "Post a New Task"}
          </h2>
          <p className="text-gray-600 mt-2">
            {isEdit
              ? "Update your task details"
              : "Describe what you need help with and find the right person for the job"}
          </p>
        </div>

        {/* Success/Error Messages */}
        {submitStatus === "success" && (
          <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-800">
                Task {isEdit ? "updated" : "created"} successfully!
                Redirecting...
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
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${
                  errors.title
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                placeholder="e.g., Help with Python programming assignment"
                maxLength="100"
              />
            </div>
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {formData.title.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows="4"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none resize-none ${
                errors.description
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Provide detailed information about what you need help with..."
              maxLength="2000"
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {formData.description.length}/2000 characters
            </p>
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${
                  errors.category
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-600 text-sm mt-1">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange("priority", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Range (₹) *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.budget.min}
                    onChange={(e) =>
                      handleInputChange("budget.min", e.target.value)
                    }
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${
                      errors["budget.min"]
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="Minimum"
                    min="50"
                    max="2000"
                  />
                </div>
                {errors["budget.min"] && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors["budget.min"]}
                  </p>
                )}
              </div>
              <div>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.budget.max}
                    onChange={(e) =>
                      handleInputChange("budget.max", e.target.value)
                    }
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${
                      errors["budget.max"]
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="Maximum"
                    min="50"
                    max="2000"
                  />
                </div>
                {errors["budget.max"] && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors["budget.max"]}
                  </p>
                )}
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Budget range should be between ₹50 and ₹2000
            </p>
          </div>

          {/* Deadline and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) =>
                    handleInputChange("deadline", e.target.value)
                  }
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${
                    errors.deadline
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  min={getMinDateTime()}
                />
              </div>
              {errors.deadline && (
                <p className="text-red-600 text-sm mt-1">{errors.deadline}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (Optional)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g., Library, Hostel Room 204"
                  maxLength="100"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (Optional)
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g., python, urgent, assignment"
              />
            </div>
            <p className="text-gray-500 text-xs mt-1">
              Separate tags with commas. Tags help others find your task.
            </p>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2">
                    <span className="text-blue-600 hover:text-blue-500 font-medium">
                      Upload images
                    </span>
                    <span className="text-gray-500"> or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 5MB each
                  </p>
                </label>
              </div>
              {errors.images && (
                <p className="text-red-600 text-sm mt-1">{errors.images}</p>
              )}

              {/* Image Previews */}
              {previewImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {previewImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Documents */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documents (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleDocumentUpload}
                  className="hidden"
                  id="document-upload"
                />
                <label htmlFor="document-upload" className="cursor-pointer">
                  <Paperclip className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2">
                    <span className="text-blue-600 hover:text-blue-500 font-medium">
                      Upload documents
                    </span>
                    <span className="text-gray-500"> or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Any file type up to 10MB each
                  </p>
                </label>
              </div>
              {errors.documents && (
                <p className="text-red-600 text-sm mt-1">{errors.documents}</p>
              )}

              {/* Document List */}
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Paperclip className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 truncate">
                          {doc.originalName || doc.filename}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{isEdit ? "Updating..." : "Creating..."}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>{isEdit ? "Update Task" : "Post Task"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
