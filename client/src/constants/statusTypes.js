// client/src/constants/statusTypes.js

// Task Status Types
export const TASK_STATUS = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In-Progress",
  COMPLETED: "Completed",
  CLOSED: "Closed",
};

export const TASK_STATUS_OPTIONS = [
  {
    value: TASK_STATUS.OPEN,
    label: "Open",
    description: "Task is available for bidding",
    icon: "🔓",
    color: "bg-green-100 text-green-800 border-green-200",
    badgeColor: "bg-green-500",
    canEdit: true,
    canReceiveBids: true,
  },
  {
    value: TASK_STATUS.ASSIGNED,
    label: "Assigned",
    description: "Task has been assigned to a bidder",
    icon: "👤",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    badgeColor: "bg-blue-500",
    canEdit: false,
    canReceiveBids: false,
  },
  {
    value: TASK_STATUS.IN_PROGRESS,
    label: "In Progress",
    description: "Task is currently being worked on",
    icon: "⚙️",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    badgeColor: "bg-yellow-500",
    canEdit: false,
    canReceiveBids: false,
  },
  {
    value: TASK_STATUS.COMPLETED,
    label: "Completed",
    description: "Task has been completed successfully",
    icon: "✅",
    color: "bg-green-100 text-green-800 border-green-200",
    badgeColor: "bg-green-600",
    canEdit: false,
    canReceiveBids: false,
  },
  {
    value: TASK_STATUS.CLOSED,
    label: "Closed",
    description: "Task has been closed without completion",
    icon: "🔒",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    badgeColor: "bg-gray-500",
    canEdit: false,
    canReceiveBids: false,
  },
];

// Bid Status Types
export const BID_STATUS = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export const BID_STATUS_OPTIONS = [
  {
    value: BID_STATUS.PENDING,
    label: "Pending",
    description: "Bid is waiting for review",
    icon: "⏳",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    badgeColor: "bg-yellow-500",
    canEdit: true,
    canWithdraw: true,
  },
  {
    value: BID_STATUS.ACCEPTED,
    label: "Accepted",
    description: "Bid has been accepted",
    icon: "✅",
    color: "bg-green-100 text-green-800 border-green-200",
    badgeColor: "bg-green-500",
    canEdit: false,
    canWithdraw: false,
  },
  {
    value: BID_STATUS.REJECTED,
    label: "Rejected",
    description: "Bid has been rejected",
    icon: "❌",
    color: "bg-red-100 text-red-800 border-red-200",
    badgeColor: "bg-red-500",
    canEdit: false,
    canWithdraw: false,
  },
  {
    value: BID_STATUS.WITHDRAWN,
    label: "Withdrawn",
    description: "Bid has been withdrawn by bidder",
    icon: "↩️",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    badgeColor: "bg-gray-500",
    canEdit: false,
    canWithdraw: false,
  },
];

// Priority Types
export const PRIORITY_TYPES = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const PRIORITY_OPTIONS = [
  {
    value: PRIORITY_TYPES.LOW,
    label: "Low",
    icon: "⬇️",
    color: "bg-gray-100 text-gray-700",
    badgeColor: "bg-gray-400",
  },
  {
    value: PRIORITY_TYPES.MEDIUM,
    label: "Medium",
    icon: "➡️",
    color: "bg-blue-100 text-blue-700",
    badgeColor: "bg-blue-500",
  },
  {
    value: PRIORITY_TYPES.HIGH,
    label: "High",
    icon: "⬆️",
    color: "bg-orange-100 text-orange-700",
    badgeColor: "bg-orange-500",
  },
  {
    value: PRIORITY_TYPES.URGENT,
    label: "Urgent",
    icon: "🚨",
    color: "bg-red-100 text-red-700",
    badgeColor: "bg-red-500",
  },
];

// Message Types
export const MESSAGE_TYPES = {
  TEXT: "text",
  FILE: "file",
  IMAGE: "image",
  SYSTEM: "system",
};

// User Status
export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  VERIFIED: "verified",
  UNVERIFIED: "unverified",
};

// Utility functions
export const getTaskStatusInfo = (status) => {
  return (
    TASK_STATUS_OPTIONS.find((option) => option.value === status) ||
    TASK_STATUS_OPTIONS[0]
  );
};

export const getBidStatusInfo = (status) => {
  return (
    BID_STATUS_OPTIONS.find((option) => option.value === status) ||
    BID_STATUS_OPTIONS[0]
  );
};

export const getPriorityInfo = (priority) => {
  return (
    PRIORITY_OPTIONS.find((option) => option.value === priority) ||
    PRIORITY_OPTIONS[1]
  );
};

export const getStatusIcon = (status, type = "task") => {
  if (type === "task") {
    const statusInfo = getTaskStatusInfo(status);
    return statusInfo.icon;
  } else if (type === "bid") {
    const statusInfo = getBidStatusInfo(status);
    return statusInfo.icon;
  }
  return "📝";
};

export const getStatusColor = (status, type = "task") => {
  if (type === "task") {
    const statusInfo = getTaskStatusInfo(status);
    return statusInfo.color;
  } else if (type === "bid") {
    const statusInfo = getBidStatusInfo(status);
    return statusInfo.color;
  }
  return "bg-gray-100 text-gray-800";
};

export const getStatusBadgeColor = (status, type = "task") => {
  if (type === "task") {
    const statusInfo = getTaskStatusInfo(status);
    return statusInfo.badgeColor;
  } else if (type === "bid") {
    const statusInfo = getBidStatusInfo(status);
    return statusInfo.badgeColor;
  }
  return "bg-gray-500";
};

export const canEditTask = (status) => {
  const statusInfo = getTaskStatusInfo(status);
  return statusInfo.canEdit;
};

export const canTaskReceiveBids = (status) => {
  const statusInfo = getTaskStatusInfo(status);
  return statusInfo.canReceiveBids;
};

export const canEditBid = (status) => {
  const statusInfo = getBidStatusInfo(status);
  return statusInfo.canEdit;
};

export const canWithdrawBid = (status) => {
  const statusInfo = getBidStatusInfo(status);
  return statusInfo.canWithdraw;
};

// Status progression for tasks
export const TASK_STATUS_FLOW = {
  [TASK_STATUS.OPEN]: [TASK_STATUS.ASSIGNED, TASK_STATUS.CLOSED],
  [TASK_STATUS.ASSIGNED]: [TASK_STATUS.IN_PROGRESS, TASK_STATUS.CLOSED],
  [TASK_STATUS.IN_PROGRESS]: [TASK_STATUS.COMPLETED, TASK_STATUS.CLOSED],
  [TASK_STATUS.COMPLETED]: [],
  [TASK_STATUS.CLOSED]: [],
};

export const getNextPossibleStatuses = (currentStatus) => {
  return TASK_STATUS_FLOW[currentStatus] || [];
};

export const isStatusTransitionValid = (fromStatus, toStatus) => {
  const possibleStatuses = getNextPossibleStatuses(fromStatus);
  return possibleStatuses.includes(toStatus);
};

export default {
  TASK_STATUS,
  BID_STATUS,
  PRIORITY_TYPES,
  MESSAGE_TYPES,
  USER_STATUS,
  TASK_STATUS_OPTIONS,
  BID_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  getTaskStatusInfo,
  getBidStatusInfo,
  getPriorityInfo,
  getStatusIcon,
  getStatusColor,
  getStatusBadgeColor,
  canEditTask,
  canTaskReceiveBids,
  canEditBid,
  canWithdrawBid,
  getNextPossibleStatuses,
  isStatusTransitionValid,
};
