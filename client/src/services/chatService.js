// client/src/services/chatService.js
import api, { apiUtils } from "./api";
import { CHAT_ENDPOINTS } from "../constants/apiEndpoints";

class ChatService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes for chat (very short due to real-time nature)
    this.messageListeners = new Set();
    this.connectionListeners = new Set();
  }

  // Get cache key
  getCacheKey(endpoint, params = {}) {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  // Check if cache is valid
  isCacheValid(cacheEntry) {
    return cacheEntry && Date.now() - cacheEntry.timestamp < this.cacheTimeout;
  }

  // Add message listener
  addMessageListener(callback) {
    if (typeof callback === "function") {
      this.messageListeners.add(callback);
    }
  }

  // Remove message listener
  removeMessageListener(callback) {
    this.messageListeners.delete(callback);
  }

  // Notify message listeners
  notifyMessageListeners(event, data) {
    this.messageListeners.forEach((callback) => {
      try {
        callback({ event, data });
      } catch (error) {
        console.error("Error in message listener:", error);
      }
    });
  }

  // Get conversation messages
  async getConversation(taskId, filters = {}) {
    try {
      if (!taskId) {
        throw new Error("Task ID is required");
      }

      const cacheKey = this.getCacheKey("getConversation", {
        taskId,
        ...filters,
      });
      const cached = this.cache.get(cacheKey);

      // For conversations, we use very short cache or skip caching for real-time updates
      if (this.isCacheValid(cached) && !filters.skipCache) {
        return cached.data;
      }

      const queryString = apiUtils.buildQueryString(filters);
      const url = queryString
        ? `${CHAT_ENDPOINTS.GET_CONVERSATION(taskId)}?${queryString}`
        : CHAT_ENDPOINTS.GET_CONVERSATION(taskId);

      const response = await api.get(url);

      if (response.data.success) {
        const result = {
          success: true,
          messages: response.data.data,
          pagination: response.data.pagination,
          count: response.data.count,
        };

        // Cache with very short timeout
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });

        return result;
      }

      throw new Error(response.data.message || "Failed to fetch conversation");
    } catch (error) {
      console.error("Get conversation error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        messages: [],
        pagination: null,
        count: 0,
      };
    }
  }

  // Send message
  async sendMessage(taskId, messageData, file = null) {
    try {
      if (!taskId) {
        throw new Error("Task ID is required");
      }

      const {
        content,
        type = "text",
        replyTo,
        priority = "normal",
      } = messageData;

      // Validate message content or file
      if (!content && !file) {
        throw new Error("Message content or file is required");
      }

      if (content && content.trim().length > 2000) {
        throw new Error("Message cannot exceed 2000 characters");
      }

      const formData = new FormData();

      if (content) {
        formData.append("content", content.trim());
      }

      formData.append("type", type);
      formData.append("priority", priority);

      if (replyTo) {
        formData.append("replyTo", replyTo);
      }

      if (file) {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error("File size cannot exceed 10MB");
        }
        formData.append("file", file);
      }

      const response = await apiUtils.uploadFile(
        CHAT_ENDPOINTS.SEND_MESSAGE(taskId),
        formData
      );

      if (response.data.success) {
        // Clear conversation cache
        this.clearConversationCache(taskId);

        // Notify listeners
        this.notifyMessageListeners("messageSent", response.data.data);

        return {
          success: true,
          message: response.data.message,
          data: response.data.data,
        };
      }

      throw new Error(response.data.message || "Failed to send message");
    } catch (error) {
      console.error("Send message error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Edit message
  async editMessage(messageId, content) {
    try {
      if (!messageId) {
        throw new Error("Message ID is required");
      }

      if (!content || content.trim().length === 0) {
        throw new Error("Message content is required");
      }

      if (content.trim().length > 2000) {
        throw new Error("Message cannot exceed 2000 characters");
      }

      const response = await api.put(CHAT_ENDPOINTS.EDIT_MESSAGE(messageId), {
        content: content.trim(),
      });

      if (response.data.success) {
        // Clear relevant caches
        this.clearMessageCache(messageId);

        // Notify listeners
        this.notifyMessageListeners("messageEdited", response.data.data);

        return {
          success: true,
          message: response.data.message,
          data: response.data.data,
        };
      }

      throw new Error(response.data.message || "Failed to edit message");
    } catch (error) {
      console.error("Edit message error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Delete message
  async deleteMessage(messageId) {
    try {
      if (!messageId) {
        throw new Error("Message ID is required");
      }

      const response = await api.delete(
        CHAT_ENDPOINTS.DELETE_MESSAGE(messageId)
      );

      if (response.data.success) {
        // Clear relevant caches
        this.clearMessageCache(messageId);

        // Notify listeners
        this.notifyMessageListeners("messageDeleted", { messageId });

        return {
          success: true,
          message: response.data.message,
        };
      }

      throw new Error(response.data.message || "Failed to delete message");
    } catch (error) {
      console.error("Delete message error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Add reaction to message
  async addReaction(messageId, emoji) {
    try {
      if (!messageId || !emoji) {
        throw new Error("Message ID and emoji are required");
      }

      const allowedEmojis = ["👍", "👎", "❤️", "😂", "😮", "😢", "😡"];
      if (!allowedEmojis.includes(emoji)) {
        throw new Error("Invalid emoji reaction");
      }

      const response = await api.post(CHAT_ENDPOINTS.ADD_REACTION(messageId), {
        emoji,
      });

      if (response.data.success) {
        // Clear relevant caches
        this.clearMessageCache(messageId);

        // Notify listeners
        this.notifyMessageListeners("reactionAdded", {
          messageId,
          emoji,
          reactions: response.data.data,
        });

        return {
          success: true,
          message: response.data.message,
          reactions: response.data.data,
        };
      }

      throw new Error(response.data.message || "Failed to add reaction");
    } catch (error) {
      console.error("Add reaction error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Remove reaction from message
  async removeReaction(messageId) {
    try {
      if (!messageId) {
        throw new Error("Message ID is required");
      }

      const response = await api.delete(
        CHAT_ENDPOINTS.REMOVE_REACTION(messageId)
      );

      if (response.data.success) {
        // Clear relevant caches
        this.clearMessageCache(messageId);

        // Notify listeners
        this.notifyMessageListeners("reactionRemoved", {
          messageId,
          reactions: response.data.data,
        });

        return {
          success: true,
          message: response.data.message,
          reactions: response.data.data,
        };
      }

      throw new Error(response.data.message || "Failed to remove reaction");
    } catch (error) {
      console.error("Remove reaction error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Get recent conversations
  async getConversations(limit = 10) {
    try {
      const cacheKey = this.getCacheKey("getConversations", { limit });
      const cached = this.cache.get(cacheKey);

      if (this.isCacheValid(cached)) {
        return cached.data;
      }

      const response = await api.get(
        `${CHAT_ENDPOINTS.GET_CONVERSATIONS}?limit=${limit}`
      );

      if (response.data.success) {
        const result = {
          success: true,
          conversations: response.data.data,
          count: response.data.count,
        };

        // Cache with short timeout
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });

        return result;
      }

      throw new Error(response.data.message || "Failed to fetch conversations");
    } catch (error) {
      console.error("Get conversations error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        conversations: [],
        count: 0,
      };
    }
  }

  // Get unread message count
  async getUnreadCount() {
    try {
      // Don't cache unread count as it changes frequently
      const response = await api.get(CHAT_ENDPOINTS.GET_UNREAD_COUNT);

      if (response.data.success) {
        return {
          success: true,
          unreadCount: response.data.data.unreadCount,
        };
      }

      throw new Error(response.data.message || "Failed to fetch unread count");
    } catch (error) {
      console.error("Get unread count error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        unreadCount: 0,
      };
    }
  }

  // Mark conversation as read
  async markConversationAsRead(taskId) {
    try {
      if (!taskId) {
        throw new Error("Task ID is required");
      }

      const response = await api.post(CHAT_ENDPOINTS.MARK_AS_READ(taskId));

      if (response.data.success) {
        // Clear conversation cache
        this.clearConversationCache(taskId);

        // Notify listeners
        this.notifyMessageListeners("conversationRead", { taskId });

        return {
          success: true,
          message: response.data.message,
          markedCount: response.data.data.markedCount,
        };
      }

      throw new Error(
        response.data.message || "Failed to mark conversation as read"
      );
    } catch (error) {
      console.error("Mark conversation as read error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Search messages in conversation
  async searchMessages(taskId, query, limit = 20) {
    try {
      if (!taskId || !query) {
        throw new Error("Task ID and search query are required");
      }

      if (query.trim().length < 2) {
        throw new Error("Search query must be at least 2 characters long");
      }

      const response = await api.get(
        `${CHAT_ENDPOINTS.SEARCH_MESSAGES(taskId)}?q=${encodeURIComponent(
          query
        )}&limit=${limit}`
      );

      if (response.data.success) {
        return {
          success: true,
          messages: response.data.data,
          count: response.data.count,
        };
      }

      throw new Error(response.data.message || "Failed to search messages");
    } catch (error) {
      console.error("Search messages error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        messages: [],
        count: 0,
      };
    }
  }

  // Get message by ID
  async getMessage(messageId) {
    try {
      if (!messageId) {
        throw new Error("Message ID is required");
      }

      const cacheKey = this.getCacheKey("getMessage", { messageId });
      const cached = this.cache.get(cacheKey);

      if (this.isCacheValid(cached)) {
        return cached.data;
      }

      const response = await api.get(CHAT_ENDPOINTS.GET_MESSAGE(messageId));

      if (response.data.success) {
        const result = {
          success: true,
          message: response.data.data,
        };

        // Cache the result
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });

        return result;
      }

      throw new Error(response.data.message || "Message not found");
    } catch (error) {
      console.error("Get message error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        message: null,
      };
    }
  }

  // Get chat statistics
  async getChatStats() {
    try {
      const cacheKey = this.getCacheKey("getChatStats", {});
      const cached = this.cache.get(cacheKey);

      // Use longer cache for stats
      if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
        return cached.data;
      }

      const response = await api.get(CHAT_ENDPOINTS.GET_CHAT_STATS);

      if (response.data.success) {
        const result = {
          success: true,
          stats: response.data.data,
        };

        // Cache with longer timeout
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });

        return result;
      }

      throw new Error(
        response.data.message || "Failed to fetch chat statistics"
      );
    } catch (error) {
      console.error("Get chat stats error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        stats: null,
      };
    }
  }

  // Download chat file
  async downloadFile(messageId, filename) {
    try {
      if (!messageId || !filename) {
        throw new Error("Message ID and filename are required");
      }

      await apiUtils.downloadFile(
        CHAT_ENDPOINTS.DOWNLOAD_FILE(messageId, filename),
        filename
      );

      return {
        success: true,
        message: "File downloaded successfully",
      };
    } catch (error) {
      console.error("Download file error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Validate message data
  validateMessageData(messageData, file = null) {
    const errors = [];

    if (!messageData.content && !file) {
      errors.push("Message content or file is required");
    }

    if (messageData.content) {
      if (messageData.content.trim().length === 0) {
        errors.push("Message content cannot be empty");
      } else if (messageData.content.length > 2000) {
        errors.push("Message cannot exceed 2000 characters");
      }
    }

    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        errors.push("File size cannot exceed 10MB");
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(file.type)) {
        errors.push("File type not supported");
      }
    }

    if (
      messageData.priority &&
      !["low", "normal", "high"].includes(messageData.priority)
    ) {
      errors.push("Priority must be low, normal, or high");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Format message for display
  formatMessageForDisplay(message) {
    try {
      if (!message) return null;

      return {
        ...message,
        formattedTime: this.formatMessageTime(message.createdAt),
        timeSince: this.calculateTimeSince(message.createdAt),
        canEdit: this.canEditMessage(message),
        canDelete: this.canDeleteMessage(message),
        isFile: message.attachments && message.attachments.length > 0,
        isImage: message.type === "image",
      };
    } catch (error) {
      console.error("Format message for display error:", error);
      return message;
    }
  }

  // Check if message can be edited
  canEditMessage(message) {
    try {
      if (
        !message ||
        message.isDeleted ||
        message.sender !== this.getCurrentUserId()
      ) {
        return false;
      }

      // Messages can only be edited within 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      return new Date(message.createdAt) > fifteenMinutesAgo;
    } catch (error) {
      console.error("Can edit message error:", error);
      return false;
    }
  }

  // Check if message can be deleted
  canDeleteMessage(message) {
    try {
      if (!message || message.isDeleted) {
        return false;
      }

      // User can delete their own messages
      return message.sender === this.getCurrentUserId();
    } catch (error) {
      console.error("Can delete message error:", error);
      return false;
    }
  }

  // Get current user ID (helper method)
  getCurrentUserId() {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?._id || null;
    } catch (error) {
      return null;
    }
  }

  // Format message time
  formatMessageTime(timestamp) {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Today - show time only
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      } else if (diffDays === 1) {
        // Yesterday
        return `Yesterday ${date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}`;
      } else if (diffDays < 7) {
        // This week - show day and time
        return date.toLocaleDateString("en-US", {
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      } else {
        // Older - show date and time
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }
    } catch (error) {
      console.error("Format message time error:", error);
      return "Unknown";
    }
  }

  // Calculate time since message
  calculateTimeSince(timestamp) {
    try {
      const now = new Date();
      const messageDate = new Date(timestamp);
      const diffTime = now - messageDate;
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
      } else {
        return "Just now";
      }
    } catch (error) {
      console.error("Calculate time since error:", error);
      return "Unknown";
    }
  }

  // Get file icon based on type
  getFileIcon(mimeType) {
    const iconMap = {
      "application/pdf": "📄",
      "application/msword": "📝",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "📝",
      "text/plain": "📄",
      "image/jpeg": "🖼️",
      "image/jpg": "🖼️",
      "image/png": "🖼️",
      "image/gif": "🖼️",
      "image/svg+xml": "🖼️",
    };

    return iconMap[mimeType] || "📎";
  }

  // Format file size
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Group messages by date
  groupMessagesByDate(messages) {
    try {
      if (!Array.isArray(messages)) return {};

      return messages.reduce((groups, message) => {
        const date = new Date(message.createdAt);
        const dateKey = date.toDateString();

        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }

        groups[dateKey].push(message);
        return groups;
      }, {});
    } catch (error) {
      console.error("Group messages by date error:", error);
      return {};
    }
  }

  // Check if message is from current user
  isMyMessage(message) {
    try {
      const currentUserId = this.getCurrentUserId();
      return (
        message.sender === currentUserId || message.sender._id === currentUserId
      );
    } catch (error) {
      console.error("Is my message error:", error);
      return false;
    }
  }

  // Get message reactions summary
  getReactionsSummary(reactions) {
    try {
      if (!Array.isArray(reactions) || reactions.length === 0) {
        return {};
      }

      const summary = {};
      const currentUserId = this.getCurrentUserId();

      reactions.forEach((reaction) => {
        const emoji = reaction.emoji;
        if (!summary[emoji]) {
          summary[emoji] = {
            count: 0,
            users: [],
            hasCurrentUser: false,
          };
        }

        summary[emoji].count++;
        summary[emoji].users.push(reaction.user);

        if (
          reaction.user === currentUserId ||
          reaction.user._id === currentUserId
        ) {
          summary[emoji].hasCurrentUser = true;
        }
      });

      return summary;
    } catch (error) {
      console.error("Get reactions summary error:", error);
      return {};
    }
  }

  // Clear conversation cache
  clearConversationCache(taskId) {
    const keysToDelete = [];
    for (const [key] of this.cache) {
      if (key.includes(`getConversation_{"taskId":"${taskId}"`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  // Clear message cache
  clearMessageCache(messageId) {
    const keysToDelete = [];
    for (const [key] of this.cache) {
      if (key.includes(`getMessage_{"messageId":"${messageId}"`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  // Clear conversations cache
  clearConversationsCache() {
    const keysToDelete = [];
    for (const [key] of this.cache) {
      if (key.startsWith("getConversations_")) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  // Clear all cache
  clearCache() {
    this.cache.clear();
  }

  // Get emoji list for reactions
  getAvailableEmojis() {
    return [
      { emoji: "👍", label: "Thumbs up" },
      { emoji: "👎", label: "Thumbs down" },
      { emoji: "❤️", label: "Heart" },
      { emoji: "😂", label: "Laughing" },
      { emoji: "😮", label: "Surprised" },
      { emoji: "😢", label: "Sad" },
      { emoji: "😡", label: "Angry" },
    ];
  }

  // Check if file type is supported
  isSupportedFileType(file) {
    const supportedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    return supportedTypes.includes(file.type);
  }

  // Cleanup listeners on destroy
  destroy() {
    this.messageListeners.clear();
    this.connectionListeners.clear();
    this.clearCache();
  }
}

// Create and export singleton instance
const chatService = new ChatService();

export default chatService;
