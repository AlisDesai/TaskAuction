// client/src/services/bidService.js
import api, { apiUtils } from "./api";
import { BID_ENDPOINTS } from "../constants/apiEndpoints";

class BidService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 3 * 60 * 1000; // 3 minutes for bids (shorter due to frequent updates)
  }

  // Get cache key
  getCacheKey(endpoint, params = {}) {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  // Check if cache is valid
  isCacheValid(cacheEntry) {
    return cacheEntry && Date.now() - cacheEntry.timestamp < this.cacheTimeout;
  }

  // Create new bid
  async createBid(bidData) {
    try {
      const {
        taskId,
        amount,
        proposedTimeline,
        message,
        deliverables,
        experience,
        portfolio,
      } = bidData;

      // Validate required fields
      if (!taskId || !amount || !proposedTimeline) {
        throw new Error("Task ID, amount, and proposed timeline are required");
      }

      // Validate amount
      if (amount < 50 || amount > 2000) {
        throw new Error("Bid amount must be between ₹50 and ₹2000");
      }

      // Process deliverables
      const processedDeliverables = deliverables
        ? Array.isArray(deliverables)
          ? deliverables
          : deliverables
              .split(",")
              .map((d) => d.trim())
              .filter((d) => d.length > 0)
        : [];

      // Validate portfolio format
      const processedPortfolio = portfolio
        ? Array.isArray(portfolio)
          ? portfolio.map((item) => ({
              title: item.title?.trim() || "",
              url: item.url?.trim() || "",
              description: item.description?.trim() || "",
            }))
          : []
        : [];

      const response = await api.post(BID_ENDPOINTS.CREATE_BID, {
        taskId,
        amount: parseFloat(amount),
        proposedTimeline: proposedTimeline.trim(),
        message: message ? message.trim() : undefined,
        deliverables: processedDeliverables,
        experience: experience ? experience.trim() : undefined,
        portfolio: processedPortfolio,
      });

      if (response.data.success) {
        // Clear relevant caches
        this.clearBidsCache();

        return {
          success: true,
          message: response.data.message,
          bid: response.data.data,
        };
      }

      throw new Error(response.data.message || "Failed to create bid");
    } catch (error) {
      console.error("Create bid error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Get all bids with filters
  async getBids(filters = {}) {
    try {
      const cacheKey = this.getCacheKey("getBids", filters);
      const cached = this.cache.get(cacheKey);

      if (this.isCacheValid(cached)) {
        return cached.data;
      }

      const queryString = apiUtils.buildQueryString(filters);
      const url = queryString
        ? `${BID_ENDPOINTS.GET_BIDS}?${queryString}`
        : BID_ENDPOINTS.GET_BIDS;

      const response = await api.get(url);

      if (response.data.success) {
        const result = {
          success: true,
          bids: response.data.data,
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

      throw new Error(response.data.message || "Failed to fetch bids");
    } catch (error) {
      console.error("Get bids error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        bids: [],
        pagination: null,
        count: 0,
      };
    }
  }

  // Get single bid by ID
  async getBid(bidId) {
    try {
      if (!bidId) {
        throw new Error("Bid ID is required");
      }

      const cacheKey = this.getCacheKey("getBid", { bidId });
      const cached = this.cache.get(cacheKey);

      if (this.isCacheValid(cached)) {
        return cached.data;
      }

      const response = await api.get(BID_ENDPOINTS.GET_BID(bidId));

      if (response.data.success) {
        const result = {
          success: true,
          bid: response.data.data,
        };

        // Cache the result
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });

        return result;
      }

      throw new Error(response.data.message || "Bid not found");
    } catch (error) {
      console.error("Get bid error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        bid: null,
      };
    }
  }

  // Update bid
  async updateBid(bidId, updateData) {
    try {
      if (!bidId) {
        throw new Error("Bid ID is required");
      }

      // Validate amount if provided
      if (
        updateData.amount &&
        (updateData.amount < 50 || updateData.amount > 2000)
      ) {
        throw new Error("Bid amount must be between ₹50 and ₹2000");
      }

      // Process deliverables if provided
      const processedData = { ...updateData };
      if (updateData.deliverables) {
        processedData.deliverables = Array.isArray(updateData.deliverables)
          ? updateData.deliverables
          : updateData.deliverables
              .split(",")
              .map((d) => d.trim())
              .filter((d) => d.length > 0);
      }

      // Process portfolio if provided
      if (updateData.portfolio) {
        processedData.portfolio = Array.isArray(updateData.portfolio)
          ? updateData.portfolio.map((item) => ({
              title: item.title?.trim() || "",
              url: item.url?.trim() || "",
              description: item.description?.trim() || "",
            }))
          : [];
      }

      // Trim string fields
      ["proposedTimeline", "message", "experience"].forEach((field) => {
        if (processedData[field]) {
          processedData[field] = processedData[field].trim();
        }
      });

      const response = await api.put(
        BID_ENDPOINTS.UPDATE_BID(bidId),
        processedData
      );

      if (response.data.success) {
        // Clear relevant caches
        this.clearBidCache(bidId);
        this.clearBidsCache();

        return {
          success: true,
          message: response.data.message,
          bid: response.data.data,
        };
      }

      throw new Error(response.data.message || "Failed to update bid");
    } catch (error) {
      console.error("Update bid error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Withdraw bid
  async withdrawBid(bidId) {
    try {
      if (!bidId) {
        throw new Error("Bid ID is required");
      }

      const response = await api.post(BID_ENDPOINTS.WITHDRAW_BID(bidId));

      if (response.data.success) {
        // Clear relevant caches
        this.clearBidCache(bidId);
        this.clearBidsCache();

        return {
          success: true,
          message: response.data.message,
          bid: response.data.data,
        };
      }

      throw new Error(response.data.message || "Failed to withdraw bid");
    } catch (error) {
      console.error("Withdraw bid error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Delete bid
  async deleteBid(bidId) {
    try {
      if (!bidId) {
        throw new Error("Bid ID is required");
      }

      const response = await api.delete(BID_ENDPOINTS.DELETE_BID(bidId));

      if (response.data.success) {
        // Clear relevant caches
        this.clearBidCache(bidId);
        this.clearBidsCache();

        return {
          success: true,
          message: response.data.message,
        };
      }

      throw new Error(response.data.message || "Failed to delete bid");
    } catch (error) {
      console.error("Delete bid error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Highlight bid
  async highlightBid(bidId) {
    try {
      if (!bidId) {
        throw new Error("Bid ID is required");
      }

      const response = await api.post(BID_ENDPOINTS.HIGHLIGHT_BID(bidId));

      if (response.data.success) {
        // Clear relevant caches
        this.clearBidCache(bidId);
        this.clearBidsCache();

        return {
          success: true,
          message: response.data.message,
          bid: response.data.data,
        };
      }

      throw new Error(response.data.message || "Failed to highlight bid");
    } catch (error) {
      console.error("Highlight bid error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
      };
    }
  }

  // Get bid statistics for a task
  async getBidStats(taskId) {
    try {
      if (!taskId) {
        throw new Error("Task ID is required");
      }

      const cacheKey = this.getCacheKey("getBidStats", { taskId });
      const cached = this.cache.get(cacheKey);

      if (this.isCacheValid(cached)) {
        return cached.data;
      }

      const response = await api.get(BID_ENDPOINTS.GET_BID_STATS(taskId));

      if (response.data.success) {
        const result = {
          success: true,
          stats: response.data.data,
        };

        // Cache the result with shorter timeout
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });

        return result;
      }

      throw new Error(
        response.data.message || "Failed to fetch bid statistics"
      );
    } catch (error) {
      console.error("Get bid stats error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        stats: null,
      };
    }
  }

  // Get recommended bids
  async getRecommendedBids(limit = 10) {
    try {
      const cacheKey = this.getCacheKey("getRecommendedBids", { limit });
      const cached = this.cache.get(cacheKey);

      if (this.isCacheValid(cached)) {
        return cached.data;
      }

      const response = await api.get(
        `${BID_ENDPOINTS.GET_RECOMMENDED_BIDS}?limit=${limit}`
      );

      if (response.data.success) {
        const result = {
          success: true,
          recommendations: response.data.data,
          count: response.data.count,
        };

        // Cache the result
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });

        return result;
      }

      throw new Error(
        response.data.message || "Failed to fetch recommendations"
      );
    } catch (error) {
      console.error("Get recommended bids error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        recommendations: [],
        count: 0,
      };
    }
  }

  // Get bid analytics
  async getBidAnalytics(days = 30) {
    try {
      const cacheKey = this.getCacheKey("getBidAnalytics", { days });
      const cached = this.cache.get(cacheKey);

      if (this.isCacheValid(cached)) {
        return cached.data;
      }

      const response = await api.get(
        `${BID_ENDPOINTS.GET_BID_ANALYTICS}?days=${days}`
      );

      if (response.data.success) {
        const result = {
          success: true,
          analytics: response.data.data,
        };

        // Cache the result with longer timeout for analytics
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });

        return result;
      }

      throw new Error(response.data.message || "Failed to fetch bid analytics");
    } catch (error) {
      console.error("Get bid analytics error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        analytics: null,
      };
    }
  }

  // Get my bids
  async getMyBids(filters = {}) {
    try {
      const myBidsFilters = {
        ...filters,
        type: "my-bids",
      };

      return await this.getBids(myBidsFilters);
    } catch (error) {
      console.error("Get my bids error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        bids: [],
        pagination: null,
        count: 0,
      };
    }
  }

  // Get received bids (for task owners)
  async getReceivedBids(filters = {}) {
    try {
      const receivedBidsFilters = {
        ...filters,
        type: "received",
      };

      return await this.getBids(receivedBidsFilters);
    } catch (error) {
      console.error("Get received bids error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        bids: [],
        pagination: null,
        count: 0,
      };
    }
  }

  // Get bids for specific task
  async getBidsForTask(taskId, filters = {}) {
    try {
      if (!taskId) {
        throw new Error("Task ID is required");
      }

      const taskBidsFilters = {
        ...filters,
        taskId,
      };

      return await this.getBids(taskBidsFilters);
    } catch (error) {
      console.error("Get bids for task error:", error);

      return {
        success: false,
        message: apiUtils.formatErrorMessage(error),
        bids: [],
        pagination: null,
        count: 0,
      };
    }
  }

  // Check if user can bid on task
  async canBidOnTask(taskId, userBids = []) {
    try {
      if (!taskId) {
        return { canBid: false, reason: "Task ID is required" };
      }

      // Check if user already has a bid on this task
      const existingBid = userBids.find(
        (bid) => bid.task._id === taskId && bid.status !== "Withdrawn"
      );

      if (existingBid) {
        return {
          canBid: false,
          reason: "You have already placed a bid on this task",
          existingBid,
        };
      }

      return { canBid: true };
    } catch (error) {
      console.error("Can bid on task error:", error);
      return { canBid: false, reason: "Error checking bid eligibility" };
    }
  }

  // Validate bid data
  validateBidData(bidData, taskBudget = null) {
    const errors = [];

    if (!bidData.amount) {
      errors.push("Bid amount is required");
    } else {
      const amount = parseFloat(bidData.amount);
      if (isNaN(amount) || amount < 50 || amount > 2000) {
        errors.push("Bid amount must be between ₹50 and ₹2000");
      }

      // Validate against task budget if provided
      if (taskBudget) {
        if (amount < taskBudget.min || amount > taskBudget.max) {
          errors.push(
            `Bid amount must be between ₹${taskBudget.min} and ₹${taskBudget.max}`
          );
        }
      }
    }

    if (
      !bidData.proposedTimeline ||
      bidData.proposedTimeline.trim().length < 5
    ) {
      errors.push("Proposed timeline must be at least 5 characters long");
    }

    if (bidData.message && bidData.message.length > 1000) {
      errors.push("Message cannot exceed 1000 characters");
    }

    if (bidData.experience && bidData.experience.length > 500) {
      errors.push("Experience description cannot exceed 500 characters");
    }

    if (bidData.deliverables) {
      const deliverables = Array.isArray(bidData.deliverables)
        ? bidData.deliverables
        : bidData.deliverables.split(",").map((d) => d.trim());

      if (deliverables.length > 10) {
        errors.push("Cannot have more than 10 deliverables");
      }

      const invalidDeliverables = deliverables.filter((d) => d.length > 100);
      if (invalidDeliverables.length > 0) {
        errors.push("Each deliverable cannot exceed 100 characters");
      }
    }

    if (bidData.portfolio) {
      const portfolio = Array.isArray(bidData.portfolio)
        ? bidData.portfolio
        : [];

      if (portfolio.length > 5) {
        errors.push("Cannot have more than 5 portfolio items");
      }

      for (const item of portfolio) {
        if (item.title && item.title.length > 100) {
          errors.push("Portfolio title cannot exceed 100 characters");
        }
        if (item.description && item.description.length > 200) {
          errors.push("Portfolio description cannot exceed 200 characters");
        }
        if (item.url && !this.isValidUrl(item.url)) {
          errors.push("Portfolio URL must be a valid URL");
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Helper method to validate URL
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Calculate bid competitiveness
  calculateBidCompetitiveness(bidAmount, taskBudget, otherBids = []) {
    try {
      if (!bidAmount || !taskBudget) {
        return { score: 0, level: "Unknown" };
      }

      const amount = parseFloat(bidAmount);
      const budgetRange = taskBudget.max - taskBudget.min;
      const relativePosition = (amount - taskBudget.min) / budgetRange;

      let score = 0;
      let level = "";

      // Base score on position within budget range
      if (relativePosition <= 0.3) {
        score = 90; // Very competitive (low price)
        level = "Very Competitive";
      } else if (relativePosition <= 0.5) {
        score = 75; // Competitive
        level = "Competitive";
      } else if (relativePosition <= 0.7) {
        score = 60; // Moderate
        level = "Moderate";
      } else if (relativePosition <= 0.9) {
        score = 40; // Less competitive
        level = "Less Competitive";
      } else {
        score = 20; // High price
        level = "High Price";
      }

      // Adjust based on other bids
      if (otherBids.length > 0) {
        const lowerBids = otherBids.filter((bid) => bid.amount < amount).length;
        const totalBids = otherBids.length;
        const rank = lowerBids + 1;

        // Adjust score based on ranking
        const rankingFactor = 1 - (rank - 1) / totalBids;
        score = Math.round(score * rankingFactor);
      }

      return {
        score: Math.max(0, Math.min(100, score)),
        level,
        rank:
          otherBids.length > 0
            ? otherBids.filter((bid) => bid.amount < amount).length + 1
            : 1,
        totalBids: otherBids.length + 1,
      };
    } catch (error) {
      console.error("Calculate bid competitiveness error:", error);
      return { score: 0, level: "Unknown" };
    }
  }

  // Get bid status color helper
  getBidStatusInfo(status) {
    const statusMap = {
      Pending: {
        color: "yellow",
        icon: "⏳",
        description: "Waiting for review",
      },
      Accepted: { color: "green", icon: "✅", description: "Bid accepted" },
      Rejected: { color: "red", icon: "❌", description: "Bid rejected" },
      Withdrawn: { color: "gray", icon: "↩️", description: "Bid withdrawn" },
    };

    return (
      statusMap[status] || {
        color: "gray",
        icon: "❓",
        description: "Unknown status",
      }
    );
  }

  // Format bid for display
  formatBidForDisplay(bid) {
    try {
      if (!bid) return null;

      return {
        ...bid,
        formattedAmount: `₹${bid.amount}`,
        statusInfo: this.getBidStatusInfo(bid.status),
        timeSinceBid: this.calculateTimeSince(bid.createdAt),
        canEdit:
          bid.status === "Pending" && new Date(bid.autoWithdrawAt) > new Date(),
        canWithdraw: bid.status === "Pending",
      };
    } catch (error) {
      console.error("Format bid for display error:", error);
      return bid;
    }
  }

  // Calculate time since bid
  calculateTimeSince(date) {
    try {
      const now = new Date();
      const bidDate = new Date(date);
      const diffTime = now - bidDate;
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

  // Clear specific bid cache
  clearBidCache(bidId) {
    const keysToDelete = [];
    for (const [key] of this.cache) {
      if (key.includes(`getBid_{"bidId":"${bidId}"`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  // Clear bids list cache
  clearBidsCache() {
    const keysToDelete = [];
    for (const [key] of this.cache) {
      if (key.startsWith("getBids_") || key.startsWith("getRecommendedBids_")) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  // Clear all cache
  clearCache() {
    this.cache.clear();
  }
}

// Create and export singleton instance
const bidService = new BidService();

export default bidService;
