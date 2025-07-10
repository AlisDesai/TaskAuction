// client/src/constants/apiEndpoints.js

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Auth endpoints
export const AUTH_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  VERIFY_TOKEN: `${API_BASE_URL}/auth/verify`,
  GET_ME: `${API_BASE_URL}/auth/me`,
  UPDATE_PROFILE: `${API_BASE_URL}/auth/profile`,
  CHANGE_PASSWORD: `${API_BASE_URL}/auth/password`,
  DELETE_ACCOUNT: `${API_BASE_URL}/auth/account`,
  UPLOAD_AVATAR: `${API_BASE_URL}/auth/avatar`,
  DELETE_AVATAR: `${API_BASE_URL}/auth/avatar`,
};

// User endpoints
export const USER_ENDPOINTS = {
  GET_USERS: `${API_BASE_URL}/users`,
  GET_USER_PROFILE: (id) => `${API_BASE_URL}/users/${id}`,
  GET_DASHBOARD: `${API_BASE_URL}/users/me/dashboard`,
  GET_USER_TASKS: `${API_BASE_URL}/users/me/tasks`,
  GET_USER_BIDS: `${API_BASE_URL}/users/me/bids`,
  GET_USER_ANALYTICS: `${API_BASE_URL}/users/me/analytics`,
  UPLOAD_AVATAR: `${API_BASE_URL}/users/me/avatar`,
  DELETE_AVATAR: `${API_BASE_URL}/users/me/avatar`,
};

// Task endpoints
export const TASK_ENDPOINTS = {
  GET_TASKS: `${API_BASE_URL}/tasks`,
  GET_TASK: (id) => `${API_BASE_URL}/tasks/${id}`,
  CREATE_TASK: `${API_BASE_URL}/tasks`,
  UPDATE_TASK: (id) => `${API_BASE_URL}/tasks/${id}`,
  DELETE_TASK: (id) => `${API_BASE_URL}/tasks/${id}`,
  GET_TASK_BIDS: (id) => `${API_BASE_URL}/tasks/${id}/bids`,
  ACCEPT_BID: (taskId, bidId) =>
    `${API_BASE_URL}/tasks/${taskId}/bids/${bidId}/accept`,
  START_TASK: (id) => `${API_BASE_URL}/tasks/${id}/start`,
  COMPLETE_TASK: (id) => `${API_BASE_URL}/tasks/${id}/complete`,
  CLOSE_TASK: (id) => `${API_BASE_URL}/tasks/${id}/close`,
  REMOVE_TASK_FILE: (taskId, fileId) =>
    `${API_BASE_URL}/tasks/${taskId}/files/${fileId}`,
};

// Bid endpoints
export const BID_ENDPOINTS = {
  CREATE_BID: `${API_BASE_URL}/bids`,
  GET_BIDS: `${API_BASE_URL}/bids`,
  GET_BID: (id) => `${API_BASE_URL}/bids/${id}`,
  UPDATE_BID: (id) => `${API_BASE_URL}/bids/${id}`,
  DELETE_BID: (id) => `${API_BASE_URL}/bids/${id}`,
  WITHDRAW_BID: (id) => `${API_BASE_URL}/bids/${id}/withdraw`,
  HIGHLIGHT_BID: (id) => `${API_BASE_URL}/bids/${id}/highlight`,
  GET_BID_STATS: (taskId) => `${API_BASE_URL}/bids/task/${taskId}/stats`,
  GET_RECOMMENDED_BIDS: `${API_BASE_URL}/bids/recommendations`,
  GET_BID_ANALYTICS: `${API_BASE_URL}/bids/analytics`,
};

// Chat endpoints
export const CHAT_ENDPOINTS = {
  GET_CONVERSATIONS: `${API_BASE_URL}/chat/conversations`,
  GET_UNREAD_COUNT: `${API_BASE_URL}/chat/unread-count`,
  GET_CHAT_STATS: `${API_BASE_URL}/chat/stats`,
  GET_CONVERSATION: (taskId) => `${API_BASE_URL}/chat/task/${taskId}`,
  SEND_MESSAGE: (taskId) => `${API_BASE_URL}/chat/task/${taskId}`,
  MARK_AS_READ: (taskId) => `${API_BASE_URL}/chat/task/${taskId}/mark-read`,
  SEARCH_MESSAGES: (taskId) => `${API_BASE_URL}/chat/task/${taskId}/search`,
  GET_MESSAGE: (id) => `${API_BASE_URL}/chat/messages/${id}`,
  EDIT_MESSAGE: (id) => `${API_BASE_URL}/chat/messages/${id}`,
  DELETE_MESSAGE: (id) => `${API_BASE_URL}/chat/messages/${id}`,
  ADD_REACTION: (id) => `${API_BASE_URL}/chat/messages/${id}/reaction`,
  REMOVE_REACTION: (id) => `${API_BASE_URL}/chat/messages/${id}/reaction`,
  DOWNLOAD_FILE: (messageId, filename) =>
    `${API_BASE_URL}/chat/files/${messageId}/${filename}`,
};

// File upload endpoints
export const UPLOAD_ENDPOINTS = {
  TASK_FILES: `${API_BASE_URL}/tasks`,
  CHAT_FILES: (taskId) => `${API_BASE_URL}/chat/task/${taskId}`,
  AVATAR: `${API_BASE_URL}/auth/avatar`,
  UPLOADS_BASE:
    import.meta.env.VITE_UPLOADS_BASE_URL || "http://localhost:5000/uploads",
};

// Health check
export const HEALTH_ENDPOINT = `${API_BASE_URL}/health`;

export default {
  AUTH_ENDPOINTS,
  USER_ENDPOINTS,
  TASK_ENDPOINTS,
  BID_ENDPOINTS,
  CHAT_ENDPOINTS,
  UPLOAD_ENDPOINTS,
  HEALTH_ENDPOINT,
  API_BASE_URL,
};
