// client/src/services/taskService.js
import api, { apiUtils } from "./api";
import { TASK_ENDPOINTS } from "../constants/apiEndpoints";

class TaskService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get cache key
  getCacheKey(endpoint, params = {}) {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  // Check if cache is valid
  isCacheValid(cacheEntry) {
    return cacheEntry && Date.now() - cacheEntry.timestamp < this.cacheTimeout;
  }

  // Get all tasks with filters
  async getTasks(filters = {}) {
    try {
      const cacheKey = this.getCacheKey("getTasks", filters);
      const cached = this.cache.get(cacheKey);

      if (this.isCacheValid(cached)) {
        return cached.data;
      }

      const queryString = apiUtils.buildQueryString(filters);
      const url = queryString
        ? `${TASK_ENDPOINTS.GET_TASKS}?${queryString}`
        : TASK_ENDPOINTS.GET_TASKS;

      const response = await api.get(url);

      if (response.data.success) {
        const result = {
          success: true,
          tasks: response.data.data,
          pagination: response.data.pagination,
          count: response.data.count,
        };

        // Cache the result
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });

        return result;
      }

      throw new Error(response.data.message || "Failed to fetch tasks");
    } catch (error) {
      console.error("Get tasks error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        tasks: [],
        pagination: null,
        count: 0,
      };
    }
  }

  // Get single task by ID
  async getTask(taskId) {
    try {
      if (!taskId) {
        throw new Error("Task ID is required");
      }

      const cacheKey = this.getCacheKey("getTask", { taskId });
      const cached = this.cache.get(cacheKey);

      if (this.isCacheValid(cached)) {
        return cached.data;
      }

      const response = await api.get(TASK_ENDPOINTS.GET_TASK(taskId));

      if (response.data.success) {
        const result = {
          success: true,
          task: response.data.data,
        };

        // Cache the result with shorter timeout for single tasks
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });

        return result;
      }

      throw new Error(response.data.message || "Task not found");
    } catch (error) {
      console.error("Get task error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        task: null,
      };
    }
  }

  // Create new task
  async createTask(taskData, files = {}) {
    try {
      const { title, description, category, budget, deadline, location, tags } =
        taskData;

      // Validate required fields
      if (!title || !description || !category || !budget || !deadline) {
        throw new Error("All required fields must be provided");
      }

      // Validate budget
      if (budget.min > budget.max) {
        throw new Error("Minimum budget cannot be greater than maximum budget");
      }

      // Validate deadline
      const deadlineDate = new Date(deadline);
      if (deadlineDate <= new Date()) {
        throw new Error("Deadline must be in the future");
      }

      const formData = new FormData();

      // Add task data
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("budget[min]", budget.min.toString());
      formData.append("budget[max]", budget.max.toString());
      formData.append("deadline", deadlineDate.toISOString());

      if (location) {
        formData.append("location", location.trim());
      }

      if (tags && tags.length > 0) {
        formData.append("tags", Array.isArray(tags) ? tags.join(",") : tags);
      }

      // Add files
      if (files.images && files.images.length > 0) {
        files.images.forEach((image, index) => {
          formData.append("images", image);
        });
      }

      if (files.attachments && files.attachments.length > 0) {
        files.attachments.forEach((attachment, index) => {
          formData.append("documents", attachment);
        });
      }

      const response = await apiUtils.uploadFile(
        TASK_ENDPOINTS.CREATE_TASK,
        formData
      );

      if (response.data.success) {
        // Clear tasks cache
        this.clearTasksCache();

        return {
          success: true,
          message: response.data.message,
          task: response.data.data,
        };
      }

      throw new Error(response.data.message || "Failed to create task");
    } catch (error) {
      console.error("Create task error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Update task
  async updateTask(taskId, updateData, files = {}) {
    try {
      if (!taskId) {
        throw new Error("Task ID is required");
      }

      // Validate budget if provided
      if (updateData.budget && updateData.budget.min > updateData.budget.max) {
        throw new Error("Minimum budget cannot be greater than maximum budget");
      }

      // Validate deadline if provided
      if (updateData.deadline) {
        const deadlineDate = new Date(updateData.deadline);
        if (deadlineDate <= new Date()) {
          throw new Error("Deadline must be in the future");
        }
      }

      const formData = new FormData();

      // Add update data
      Object.keys(updateData).forEach((key) => {
        const value = updateData[key];
        if (value !== undefined && value !== null) {
          if (key === "budget") {
            if (value.min !== undefined)
              formData.append("budget[min]", value.min.toString());
            if (value.max !== undefined)
              formData.append("budget[max]", value.max.toString());
          } else if (key === "deadline") {
            formData.append(key, new Date(value).toISOString());
          } else if (key === "tags") {
            formData.append(
              key,
              Array.isArray(value) ? value.join(",") : value
            );
          } else {
            formData.append(
              key,
              typeof value === "string" ? value.trim() : value
            );
          }
        }
      });

      // Add files
      if (files.images && files.images.length > 0) {
        files.images.forEach((image) => {
          formData.append("images", image);
        });
      }

      if (files.attachments && files.attachments.length > 0) {
        files.attachments.forEach((attachment) => {
          formData.append("documents", attachment);
        });
      }

      const response = await apiUtils.uploadFile(
        TASK_ENDPOINTS.UPDATE_TASK(taskId),
        formData
      );

      if (response.data.success) {
        // Clear relevant caches
        this.clearTaskCache(taskId);
        this.clearTasksCache();

        return {
          success: true,
          message: response.data.message,
          task: response.data.data,
        };
      }

      throw new Error(response.data.message || "Failed to update task");
    } catch (error) {
      console.error("Update task error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Delete task
  async deleteTask(taskId) {
    try {
      if (!taskId) {
        throw new Error("Task ID is required");
      }

      const response = await api.delete(TASK_ENDPOINTS.DELETE_TASK(taskId));

      if (response.data.success) {
        // Clear relevant caches
        this.clearTaskCache(taskId);
        this.clearTasksCache();

        return {
          success: true,
          message: response.data.message,
        };
      }

      throw new Error(response.data.message || "Failed to delete task");
    } catch (error) {
      console.error("Delete task error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Get task bids
  async getTaskBids(taskId, filters = {}) {
    try {
      if (!taskId) {
        throw new Error("Task ID is required");
      }

      const queryString = apiUtils.buildQueryString(filters);
      const url = queryString
        ? `${TASK_ENDPOINTS.GET_TASK_BIDS(taskId)}?${queryString}`
        : TASK_ENDPOINTS.GET_TASK_BIDS(taskId);

      const response = await api.get(url);

      if (response.data.success) {
        return {
          success: true,
          bids: response.data.data,
          pagination: response.data.pagination,
          count: response.data.count,
        };
      }

      throw new Error(response.data.message || "Failed to fetch task bids");
    } catch (error) {
      console.error("Get task bids error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        bids: [],
        pagination: null,
        count: 0,
      };
    }
  }

  // Accept bid
  async acceptBid(taskId, bidId) {
    try {
      if (!taskId || !bidId) {
        throw new Error("Task ID and Bid ID are required");
      }

      const response = await api.post(TASK_ENDPOINTS.ACCEPT_BID(taskId, bidId));

      if (response.data.success) {
        // Clear relevant caches
        this.clearTaskCache(taskId);
        this.clearTasksCache();

        return {
          success: true,
          message: response.data.message,
          task: response.data.data.task,
          acceptedBid: response.data.data.acceptedBid,
        };
      }

      throw new Error(response.data.message || "Failed to accept bid");
    } catch (error) {
      console.error("Accept bid error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Start task
  async startTask(taskId) {
    try {
      if (!taskId) {
        throw new Error("Task ID is required");
      }

      const response = await api.post(TASK_ENDPOINTS.START_TASK(taskId));

      if (response.data.success) {
        // Clear relevant caches
        this.clearTaskCache(taskId);
        this.clearTasksCache();

        return {
          success: true,
          message: response.data.message,
          task: response.data.data,
        };
      }

      throw new Error(response.data.message || "Failed to start task");
    } catch (error) {
      console.error("Start task error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Complete task
  async completeTask(taskId, completionData = {}) {
    try {
      if (!taskId) {
        throw new Error("Task ID is required");
      }

      const { rating, review } = completionData;

      // Validate rating if provided
      if (rating && (rating < 1 || rating > 5)) {
        throw new Error("Rating must be between 1 and 5");
      }

      const response = await api.post(TASK_ENDPOINTS.COMPLETE_TASK(taskId), {
        rating,
        review: review ? review.trim() : undefined,
      });

      if (response.data.success) {
        // Clear relevant caches
        this.clearTaskCache(taskId);
        this.clearTasksCache();

        return {
          success: true,
          message: response.data.message,
          task: response.data.data,
        };
      }

      throw new Error(response.data.message || "Failed to complete task");
    } catch (error) {
      console.error("Complete task error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Close task
  async closeTask(taskId) {
    try {
      if (!taskId) {
        throw new Error("Task ID is required");
      }

      const response = await api.post(TASK_ENDPOINTS.CLOSE_TASK(taskId));

      if (response.data.success) {
        // Clear relevant caches
        this.clearTaskCache(taskId);
        this.clearTasksCache();

        return {
          success: true,
          message: response.data.message,
          task: response.data.data,
        };
      }

      throw new Error(response.data.message || "Failed to close task");
    } catch (error) {
      console.error("Close task error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Remove task file
  async removeTaskFile(taskId, fileId, type) {
    try {
      if (!taskId || !fileId || !type) {
        throw new Error("Task ID, File ID and type are required");
      }

      if (!["image", "attachment"].includes(type)) {
        throw new Error('Type must be either "image" or "attachment"');
      }

      const response = await api.delete(
        `${TASK_ENDPOINTS.REMOVE_TASK_FILE(taskId, fileId)}?type=${type}`
      );

      if (response.data.success) {
        // Clear relevant caches
        this.clearTaskCache(taskId);

        return {
          success: true,
          message: response.data.message,
        };
      }

      throw new Error(response.data.message || "Failed to remove file");
    } catch (error) {
      console.error("Remove task file error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Search tasks
  async searchTasks(searchQuery, filters = {}) {
    try {
      if (!searchQuery || searchQuery.trim().length < 2) {
        throw new Error("Search query must be at least 2 characters long");
      }

      const searchFilters = {
        ...filters,
        search: searchQuery.trim(),
      };

      return await this.getTasks(searchFilters);
    } catch (error) {
      console.error("Search tasks error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        tasks: [],
        pagination: null,
        count: 0,
      };
    }
  }

  // Get my tasks (posted by user)
  async getMyTasks(filters = {}) {
    try {
      // This would require authentication and backend filtering
      const myTasksFilters = {
        ...filters,
        myTasks: true,
      };

      return await this.getTasks(myTasksFilters);
    } catch (error) {
      console.error("Get my tasks error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        tasks: [],
        pagination: null,
        count: 0,
      };
    }
  }

  // Get assigned tasks (tasks user is working on)
  async getAssignedTasks(filters = {}) {
    try {
      const assignedFilters = {
        ...filters,
        assignedToMe: true,
      };

      return await this.getTasks(assignedFilters);
    } catch (error) {
      console.error("Get assigned tasks error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        tasks: [],
        pagination: null,
        count: 0,
      };
    }
  }

  // Validate task data
  validateTaskData(taskData) {
    const errors = [];

    if (!taskData.title || taskData.title.trim().length < 5) {
      errors.push("Title must be at least 5 characters long");
    }

    if (!taskData.description || taskData.description.trim().length < 20) {
      errors.push("Description must be at least 20 characters long");
    }

    if (!taskData.category) {
      errors.push("Category is required");
    }

    if (!taskData.budget || !taskData.budget.min || !taskData.budget.max) {
      errors.push("Budget range is required");
    } else {
      if (taskData.budget.min < 50 || taskData.budget.max > 2000) {
        errors.push("Budget must be between ₹50 and ₹2000");
      }
      if (taskData.budget.min > taskData.budget.max) {
        errors.push("Minimum budget cannot be greater than maximum budget");
      }
    }

    if (!taskData.deadline) {
      errors.push("Deadline is required");
    } else {
      const deadline = new Date(taskData.deadline);
      if (deadline <= new Date()) {
        errors.push("Deadline must be in the future");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Clear specific task cache
  clearTaskCache(taskId) {
    const keysToDelete = [];
    for (const [key] of this.cache) {
      if (key.includes(`getTask_{"taskId":"${taskId}"`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  // Clear tasks list cache
  clearTasksCache() {
    const keysToDelete = [];
    for (const [key] of this.cache) {
      if (key.startsWith("getTasks_")) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  // Clear all cache
  clearCache() {
    this.cache.clear();
  }

  // Get file URL helper
  getFileUrl(filePath) {
    return apiUtils.getFileUrl(filePath);
  }
}

// Create and export singleton instance
const taskService = new TaskService();

export default taskService;
