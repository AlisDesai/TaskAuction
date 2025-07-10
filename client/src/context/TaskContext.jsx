// client/src/context/TaskContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from "react";
import taskService from "../services/taskService";
import bidService from "../services/bidService";
import { useAuth } from "./AuthContext";

// Initial state
const initialState = {
  tasks: [],
  currentTask: null,
  myTasks: [],
  assignedTasks: [],
  myBids: [],
  receivedBids: [],
  taskBids: [],
  recommendations: [],
  isLoading: false,
  isTaskLoading: false,
  isBidsLoading: false,
  pagination: null,
  error: null,
  filters: {
    category: "",
    status: "",
    minBudget: "",
    maxBudget: "",
    deadline: "",
    search: "",
    sort: "newest",
  },
};

// Action types
const TASK_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_TASK_LOADING: "SET_TASK_LOADING",
  SET_BIDS_LOADING: "SET_BIDS_LOADING",
  SET_TASKS: "SET_TASKS",
  SET_CURRENT_TASK: "SET_CURRENT_TASK",
  SET_MY_TASKS: "SET_MY_TASKS",
  SET_ASSIGNED_TASKS: "SET_ASSIGNED_TASKS",
  SET_MY_BIDS: "SET_MY_BIDS",
  SET_RECEIVED_BIDS: "SET_RECEIVED_BIDS",
  SET_TASK_BIDS: "SET_TASK_BIDS",
  SET_RECOMMENDATIONS: "SET_RECOMMENDATIONS",
  ADD_TASK: "ADD_TASK",
  UPDATE_TASK: "UPDATE_TASK",
  REMOVE_TASK: "REMOVE_TASK",
  ADD_BID: "ADD_BID",
  UPDATE_BID: "UPDATE_BID",
  REMOVE_BID: "REMOVE_BID",
  SET_FILTERS: "SET_FILTERS",
  SET_PAGINATION: "SET_PAGINATION",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
  RESET_STATE: "RESET_STATE",
};

// Reducer function
function taskReducer(state, action) {
  switch (action.type) {
    case TASK_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case TASK_ACTIONS.SET_TASK_LOADING:
      return {
        ...state,
        isTaskLoading: action.payload,
      };

    case TASK_ACTIONS.SET_BIDS_LOADING:
      return {
        ...state,
        isBidsLoading: action.payload,
      };

    case TASK_ACTIONS.SET_TASKS:
      return {
        ...state,
        tasks: action.payload.tasks,
        pagination: action.payload.pagination,
        isLoading: false,
        error: null,
      };

    case TASK_ACTIONS.SET_CURRENT_TASK:
      return {
        ...state,
        currentTask: action.payload.task,
        isTaskLoading: false,
        error: null,
      };

    case TASK_ACTIONS.SET_MY_TASKS:
      return {
        ...state,
        myTasks: action.payload.tasks,
        isLoading: false,
        error: null,
      };

    case TASK_ACTIONS.SET_ASSIGNED_TASKS:
      return {
        ...state,
        assignedTasks: action.payload.tasks,
        isLoading: false,
        error: null,
      };

    case TASK_ACTIONS.SET_MY_BIDS:
      return {
        ...state,
        myBids: action.payload.bids,
        isBidsLoading: false,
        error: null,
      };

    case TASK_ACTIONS.SET_RECEIVED_BIDS:
      return {
        ...state,
        receivedBids: action.payload.bids,
        isBidsLoading: false,
        error: null,
      };

    case TASK_ACTIONS.SET_TASK_BIDS:
      return {
        ...state,
        taskBids: action.payload.bids,
        isBidsLoading: false,
        error: null,
      };

    case TASK_ACTIONS.SET_RECOMMENDATIONS:
      return {
        ...state,
        recommendations: action.payload.recommendations,
        isLoading: false,
        error: null,
      };

    case TASK_ACTIONS.ADD_TASK:
      return {
        ...state,
        tasks: [action.payload.task, ...state.tasks],
        myTasks: [action.payload.task, ...state.myTasks],
        error: null,
      };

    case TASK_ACTIONS.UPDATE_TASK:
      const updatedTasks = state.tasks.map((task) =>
        task._id === action.payload.task._id ? action.payload.task : task
      );
      const updatedMyTasks = state.myTasks.map((task) =>
        task._id === action.payload.task._id ? action.payload.task : task
      );
      const updatedAssignedTasks = state.assignedTasks.map((task) =>
        task._id === action.payload.task._id ? action.payload.task : task
      );

      return {
        ...state,
        tasks: updatedTasks,
        myTasks: updatedMyTasks,
        assignedTasks: updatedAssignedTasks,
        currentTask:
          state.currentTask?._id === action.payload.task._id
            ? action.payload.task
            : state.currentTask,
        error: null,
      };

    case TASK_ACTIONS.REMOVE_TASK:
      return {
        ...state,
        tasks: state.tasks.filter((task) => task._id !== action.payload.taskId),
        myTasks: state.myTasks.filter(
          (task) => task._id !== action.payload.taskId
        ),
        assignedTasks: state.assignedTasks.filter(
          (task) => task._id !== action.payload.taskId
        ),
        currentTask:
          state.currentTask?._id === action.payload.taskId
            ? null
            : state.currentTask,
        error: null,
      };

    case TASK_ACTIONS.ADD_BID:
      return {
        ...state,
        myBids: [action.payload.bid, ...state.myBids],
        taskBids:
          state.currentTask?._id === action.payload.bid.task._id
            ? [action.payload.bid, ...state.taskBids]
            : state.taskBids,
        error: null,
      };

    case TASK_ACTIONS.UPDATE_BID:
      const updatedMyBids = state.myBids.map((bid) =>
        bid._id === action.payload.bid._id ? action.payload.bid : bid
      );
      const updatedTaskBids = state.taskBids.map((bid) =>
        bid._id === action.payload.bid._id ? action.payload.bid : bid
      );
      const updatedReceivedBids = state.receivedBids.map((bid) =>
        bid._id === action.payload.bid._id ? action.payload.bid : bid
      );

      return {
        ...state,
        myBids: updatedMyBids,
        taskBids: updatedTaskBids,
        receivedBids: updatedReceivedBids,
        error: null,
      };

    case TASK_ACTIONS.REMOVE_BID:
      return {
        ...state,
        myBids: state.myBids.filter((bid) => bid._id !== action.payload.bidId),
        taskBids: state.taskBids.filter(
          (bid) => bid._id !== action.payload.bidId
        ),
        receivedBids: state.receivedBids.filter(
          (bid) => bid._id !== action.payload.bidId
        ),
        error: null,
      };

    case TASK_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload.filters,
        },
      };

    case TASK_ACTIONS.SET_PAGINATION:
      return {
        ...state,
        pagination: action.payload.pagination,
      };

    case TASK_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload.error,
        isLoading: false,
        isTaskLoading: false,
        isBidsLoading: false,
      };

    case TASK_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case TASK_ACTIONS.RESET_STATE:
      return initialState;

    default:
      return state;
  }
}

// Create context
const TaskContext = createContext();

// Custom hook to use task context
export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTask must be used within a TaskProvider");
  }
  return context;
};

// Task Provider component
export const TaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const { isAuthenticated, user } = useAuth();

  // Reset state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: TASK_ACTIONS.RESET_STATE });
    }
  }, [isAuthenticated]);

  // Fetch tasks with filters
  const fetchTasks = async (filters = {}, append = false) => {
    try {
      if (!append) {
        dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: true });
      }
      dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });

      const mergedFilters = { ...state.filters, ...filters };
      const result = await taskService.getTasks(mergedFilters);

      if (result.success) {
        const tasksToSet = append
          ? [...state.tasks, ...result.tasks]
          : result.tasks;

        dispatch({
          type: TASK_ACTIONS.SET_TASKS,
          payload: {
            tasks: tasksToSet,
            pagination: result.pagination,
          },
        });

        return result;
      } else {
        dispatch({
          type: TASK_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });
        return result;
      }
    } catch (error) {
      const errorMessage = "Failed to fetch tasks";
      dispatch({
        type: TASK_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });
      return { success: false, message: errorMessage };
    }
  };

  // Fetch single task
  const fetchTask = async (taskId) => {
    try {
      dispatch({ type: TASK_ACTIONS.SET_TASK_LOADING, payload: true });
      dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });

      const result = await taskService.getTask(taskId);

      if (result.success) {
        dispatch({
          type: TASK_ACTIONS.SET_CURRENT_TASK,
          payload: { task: result.task },
        });
        return result;
      } else {
        dispatch({
          type: TASK_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });
        return result;
      }
    } catch (error) {
      const errorMessage = "Failed to fetch task";
      dispatch({
        type: TASK_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });
      return { success: false, message: errorMessage };
    }
  };

  // Create task
  const createTask = async (taskData, files = {}) => {
    try {
      dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });

      const result = await taskService.createTask(taskData, files);

      if (result.success) {
        dispatch({
          type: TASK_ACTIONS.ADD_TASK,
          payload: { task: result.task },
        });
        return result;
      } else {
        dispatch({
          type: TASK_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });
        return result;
      }
    } catch (error) {
      const errorMessage = "Failed to create task";
      dispatch({
        type: TASK_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });
      return { success: false, message: errorMessage };
    } finally {
      dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Update task
  const updateTask = async (taskId, updateData, files = {}) => {
    try {
      dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });

      const result = await taskService.updateTask(taskId, updateData, files);

      if (result.success) {
        dispatch({
          type: TASK_ACTIONS.UPDATE_TASK,
          payload: { task: result.task },
        });
        return result;
      } else {
        dispatch({
          type: TASK_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });
        return result;
      }
    } catch (error) {
      const errorMessage = "Failed to update task";
      dispatch({
        type: TASK_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });
      return { success: false, message: errorMessage };
    } finally {
      dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });

      const result = await taskService.deleteTask(taskId);

      if (result.success) {
        dispatch({
          type: TASK_ACTIONS.REMOVE_TASK,
          payload: { taskId },
        });
        return result;
      } else {
        dispatch({
          type: TASK_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });
        return result;
      }
    } catch (error) {
      const errorMessage = "Failed to delete task";
      dispatch({
        type: TASK_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });
      return { success: false, message: errorMessage };
    } finally {
      dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Fetch my tasks
  const fetchMyTasks = async (filters = {}) => {
    try {
      dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });

      const result = await taskService.getMyTasks(filters);

      if (result.success) {
        dispatch({
          type: TASK_ACTIONS.SET_MY_TASKS,
          payload: { tasks: result.tasks },
        });
        return result;
      } else {
        dispatch({
          type: TASK_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });
        return result;
      }
    } catch (error) {
      const errorMessage = "Failed to fetch my tasks";
      dispatch({
        type: TASK_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });
      return { success: false, message: errorMessage };
    }
  };

  // Fetch assigned tasks
  const fetchAssignedTasks = async (filters = {}) => {
    try {
      dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });

      const result = await taskService.getAssignedTasks(filters);

      if (result.success) {
        dispatch({
          type: TASK_ACTIONS.SET_ASSIGNED_TASKS,
          payload: { tasks: result.tasks },
        });
        return result;
      } else {
        dispatch({
          type: TASK_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });
        return result;
      }
    } catch (error) {
      const errorMessage = "Failed to fetch assigned tasks";
      dispatch({
        type: TASK_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });
      return { success: false, message: errorMessage };
    }
  };

  // Create bid
  const createBid = async (bidData) => {
    try {
      dispatch({ type: TASK_ACTIONS.SET_BIDS_LOADING, payload: true });
      dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });

      const result = await bidService.createBid(bidData);

      if (result.success) {
        dispatch({
          type: TASK_ACTIONS.ADD_BID,
          payload: { bid: result.bid },
        });
        return result;
      } else {
        dispatch({
          type: TASK_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });
        return result;
      }
    } catch (error) {
      const errorMessage = "Failed to create bid";
      dispatch({
        type: TASK_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });
      return { success: false, message: errorMessage };
    } finally {
      dispatch({ type: TASK_ACTIONS.SET_BIDS_LOADING, payload: false });
    }
  };

  // Update bid
  const updateBid = async (bidId, updateData) => {
    try {
      dispatch({ type: TASK_ACTIONS.SET_BIDS_LOADING, payload: true });
      dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });

      const result = await bidService.updateBid(bidId, updateData);

      if (result.success) {
        dispatch({
          type: TASK_ACTIONS.UPDATE_BID,
          payload: { bid: result.bid },
        });
        return result;
      } else {
        dispatch({
          type: TASK_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });
        return result;
      }
    } catch (error) {
      const errorMessage = "Failed to update bid";
      dispatch({
        type: TASK_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });
      return { success: false, message: errorMessage };
    } finally {
      dispatch({ type: TASK_ACTIONS.SET_BIDS_LOADING, payload: false });
    }
  };

  // Withdraw bid
  const withdrawBid = async (bidId) => {
    try {
      dispatch({ type: TASK_ACTIONS.SET_BIDS_LOADING, payload: true });
      dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });

      const result = await bidService.withdrawBid(bidId);

      if (result.success) {
        dispatch({
          type: TASK_ACTIONS.UPDATE_BID,
          payload: { bid: result.bid },
        });
        return result;
      } else {
        dispatch({
          type: TASK_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });
        return result;
      }
    } catch (error) {
      const errorMessage = "Failed to withdraw bid";
      dispatch({
        type: TASK_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });
      return { success: false, message: errorMessage };
    } finally {
      dispatch({ type: TASK_ACTIONS.SET_BIDS_LOADING, payload: false });
    }
  };

  // Accept bid
  const acceptBid = async (taskId, bidId) => {
    try {
      dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });

      const result = await taskService.acceptBid(taskId, bidId);

      if (result.success) {
        dispatch({
          type: TASK_ACTIONS.UPDATE_TASK,
          payload: { task: result.task },
        });
        dispatch({
          type: TASK_ACTIONS.UPDATE_BID,
          payload: { bid: result.acceptedBid },
        });
        return result;
      } else {
        dispatch({
          type: TASK_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });
        return result;
      }
    } catch (error) {
      const errorMessage = "Failed to accept bid";
      dispatch({
        type: TASK_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });
      return { success: false, message: errorMessage };
    } finally {
      dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Fetch task bids
  const fetchTaskBids = async (taskId, filters = {}) => {
    try {
      dispatch({ type: TASK_ACTIONS.SET_BIDS_LOADING, payload: true });
      dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });

      const result = await taskService.getTaskBids(taskId, filters);

      if (result.success) {
        dispatch({
          type: TASK_ACTIONS.SET_TASK_BIDS,
          payload: { bids: result.bids },
        });
        return result;
      } else {
        dispatch({
          type: TASK_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });
        return result;
      }
    } catch (error) {
      const errorMessage = "Failed to fetch task bids";
      dispatch({
        type: TASK_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });
      return { success: false, message: errorMessage };
    }
  };

  // Fetch my bids
  const fetchMyBids = async (filters = {}) => {
    try {
      dispatch({ type: TASK_ACTIONS.SET_BIDS_LOADING, payload: true });
      dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });

      const result = await bidService.getMyBids(filters);

      if (result.success) {
        dispatch({
          type: TASK_ACTIONS.SET_MY_BIDS,
          payload: { bids: result.bids },
        });
        return result;
      } else {
        dispatch({
          type: TASK_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });
        return result;
      }
    } catch (error) {
      const errorMessage = "Failed to fetch my bids";
      dispatch({
        type: TASK_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });
      return { success: false, message: errorMessage };
    }
  };

  // Fetch received bids
  const fetchReceivedBids = async (filters = {}) => {
    try {
      dispatch({ type: TASK_ACTIONS.SET_BIDS_LOADING, payload: true });
      dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });

      const result = await bidService.getReceivedBids(filters);

      if (result.success) {
        dispatch({
          type: TASK_ACTIONS.SET_RECEIVED_BIDS,
          payload: { bids: result.bids },
        });
        return result;
      } else {
        dispatch({
          type: TASK_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });
        return result;
      }
    } catch (error) {
      const errorMessage = "Failed to fetch received bids";
      dispatch({
        type: TASK_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });
      return { success: false, message: errorMessage };
    }
  };

  // Fetch recommendations
  const fetchRecommendations = async (limit = 10) => {
    try {
      dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });

      const result = await bidService.getRecommendedBids(limit);

      if (result.success) {
        dispatch({
          type: TASK_ACTIONS.SET_RECOMMENDATIONS,
          payload: { recommendations: result.recommendations },
        });
        return result;
      } else {
        dispatch({
          type: TASK_ACTIONS.SET_ERROR,
          payload: { error: result.message },
        });
        return result;
      }
    } catch (error) {
      const errorMessage = "Failed to fetch recommendations";
      dispatch({
        type: TASK_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });
      return { success: false, message: errorMessage };
    }
  };

  // Set filters
  const setFilters = (filters) => {
    dispatch({
      type: TASK_ACTIONS.SET_FILTERS,
      payload: { filters },
    });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: TASK_ACTIONS.CLEAR_ERROR });
  };

  // Search tasks
  const searchTasks = async (searchQuery, filters = {}) => {
    try {
      const searchFilters = {
        ...filters,
        search: searchQuery,
      };
      return await fetchTasks(searchFilters);
    } catch (error) {
      const errorMessage = "Failed to search tasks";
      dispatch({
        type: TASK_ACTIONS.SET_ERROR,
        payload: { error: errorMessage },
      });
      return { success: false, message: errorMessage };
    }
  };

  // Task status actions
  const startTask = async (taskId) => {
    try {
      const result = await taskService.startTask(taskId);
      if (result.success) {
        dispatch({
          type: TASK_ACTIONS.UPDATE_TASK,
          payload: { task: result.task },
        });
      }
      return result;
    } catch (error) {
      return { success: false, message: "Failed to start task" };
    }
  };

  const completeTask = async (taskId, completionData = {}) => {
    try {
      const result = await taskService.completeTask(taskId, completionData);
      if (result.success) {
        dispatch({
          type: TASK_ACTIONS.UPDATE_TASK,
          payload: { task: result.task },
        });
      }
      return result;
    } catch (error) {
      return { success: false, message: "Failed to complete task" };
    }
  };

  const closeTask = async (taskId) => {
    try {
      const result = await taskService.closeTask(taskId);
      if (result.success) {
        dispatch({
          type: TASK_ACTIONS.UPDATE_TASK,
          payload: { task: result.task },
        });
      }
      return result;
    } catch (error) {
      return { success: false, message: "Failed to close task" };
    }
  };

  // Context value
  const value = {
    // State
    tasks: state.tasks,
    currentTask: state.currentTask,
    myTasks: state.myTasks,
    assignedTasks: state.assignedTasks,
    myBids: state.myBids,
    receivedBids: state.receivedBids,
    taskBids: state.taskBids,
    recommendations: state.recommendations,
    isLoading: state.isLoading,
    isTaskLoading: state.isTaskLoading,
    isBidsLoading: state.isBidsLoading,
    pagination: state.pagination,
    error: state.error,
    filters: state.filters,

    // Actions
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
    fetchMyTasks,
    fetchAssignedTasks,
    createBid,
    updateBid,
    withdrawBid,
    acceptBid,
    fetchTaskBids,
    fetchMyBids,
    fetchReceivedBids,
    fetchRecommendations,
    searchTasks,
    startTask,
    completeTask,
    closeTask,
    setFilters,
    clearError,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export default TaskContext;
