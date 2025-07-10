// client/src/hooks/useSocket.js
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

// Socket connection hook for real-time features
export const useSocket = (options = {}) => {
  const { isAuthenticated, getAuthToken } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const listenersRef = useRef(new Map());
  const roomsRef = useRef(new Set());

  const {
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
    timeout = 20000,
    serverUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
  } = options;

  // Initialize socket connection
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    try {
      const token = getAuthToken();

      socketRef.current = io(serverUrl, {
        autoConnect: false,
        reconnection,
        reconnectionAttempts,
        reconnectionDelay,
        timeout,
        auth: {
          token,
        },
        transports: ["websocket", "polling"],
      });

      // Connection event handlers
      socketRef.current.on("connect", () => {
        console.log("Socket connected:", socketRef.current.id);
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempt(0);
      });

      socketRef.current.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        setIsConnected(false);

        if (reason === "io server disconnect") {
          // Server disconnected, need manual reconnection
          setTimeout(() => {
            if (socketRef.current && !socketRef.current.connected) {
              socketRef.current.connect();
            }
          }, reconnectionDelay);
        }
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setConnectionError(error.message);
        setIsConnected(false);
      });

      socketRef.current.on("reconnect", (attemptNumber) => {
        console.log("Socket reconnected after", attemptNumber, "attempts");
        setReconnectAttempt(attemptNumber);
        setConnectionError(null);
      });

      socketRef.current.on("reconnect_attempt", (attemptNumber) => {
        console.log("Socket reconnection attempt:", attemptNumber);
        setReconnectAttempt(attemptNumber);
      });

      socketRef.current.on("reconnect_error", (error) => {
        console.error("Socket reconnection error:", error);
        setConnectionError(error.message);
      });

      socketRef.current.on("reconnect_failed", () => {
        console.error("Socket reconnection failed");
        setConnectionError("Failed to reconnect to server");
      });

      // Authentication events
      socketRef.current.on("auth_error", (error) => {
        console.error("Socket auth error:", error);
        setConnectionError("Authentication failed");
        disconnect();
      });

      socketRef.current.on("auth_success", (data) => {
        console.log("Socket authenticated:", data);
      });

      // Connect the socket
      socketRef.current.connect();
    } catch (error) {
      console.error("Socket initialization error:", error);
      setConnectionError(error.message);
    }
  }, [
    serverUrl,
    reconnection,
    reconnectionAttempts,
    reconnectionDelay,
    timeout,
    getAuthToken,
  ]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setConnectionError(null);
      setReconnectAttempt(0);
      roomsRef.current.clear();
      listenersRef.current.clear();
    }
  }, []);

  // Emit event to server
  const emit = useCallback((event, data, callback) => {
    if (socketRef.current?.connected) {
      if (callback && typeof callback === "function") {
        socketRef.current.emit(event, data, callback);
      } else {
        socketRef.current.emit(event, data);
      }
      return true;
    } else {
      console.warn("Socket not connected. Cannot emit event:", event);
      return false;
    }
  }, []);

  // Listen to socket events
  const on = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);

      // Store listener for cleanup
      if (!listenersRef.current.has(event)) {
        listenersRef.current.set(event, new Set());
      }
      listenersRef.current.get(event).add(handler);
    }
  }, []);

  // Remove socket event listener
  const off = useCallback((event, handler) => {
    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event, handler);

        // Remove from stored listeners
        if (listenersRef.current.has(event)) {
          listenersRef.current.get(event).delete(handler);
        }
      } else {
        socketRef.current.off(event);
        listenersRef.current.delete(event);
      }
    }
  }, []);

  // Join a room
  const joinRoom = useCallback(
    (room) => {
      if (emit("join_room", { room })) {
        roomsRef.current.add(room);
        console.log("Joined room:", room);
        return true;
      }
      return false;
    },
    [emit]
  );

  // Leave a room
  const leaveRoom = useCallback(
    (room) => {
      if (emit("leave_room", { room })) {
        roomsRef.current.delete(room);
        console.log("Left room:", room);
        return true;
      }
      return false;
    },
    [emit]
  );

  // Send message to room
  const sendToRoom = useCallback(
    (room, event, data) => {
      return emit("room_message", { room, event, data });
    },
    [emit]
  );

  // Get socket ID
  const getSocketId = useCallback(() => {
    return socketRef.current?.id || null;
  }, []);

  // Check if in specific room
  const isInRoom = useCallback((room) => {
    return roomsRef.current.has(room);
  }, []);

  // Get all joined rooms
  const getJoinedRooms = useCallback(() => {
    return Array.from(roomsRef.current);
  }, []);

  // Reconnect manually
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    } else {
      connect();
    }
  }, [connect]);

  // Update authentication token
  const updateAuth = useCallback((newToken) => {
    if (socketRef.current) {
      socketRef.current.auth = { token: newToken };
      if (socketRef.current.connected) {
        // Reconnect with new token
        socketRef.current.disconnect();
        socketRef.current.connect();
      }
    }
  }, []);

  // Setup socket connection based on authentication
  useEffect(() => {
    if (isAuthenticated && autoConnect) {
      connect();
    } else if (!isAuthenticated && socketRef.current) {
      disconnect();
    }

    return () => {
      if (socketRef.current) {
        disconnect();
      }
    };
  }, [isAuthenticated, autoConnect, connect, disconnect]);

  // Update auth token when it changes
  useEffect(() => {
    if (isAuthenticated && socketRef.current) {
      const token = getAuthToken();
      updateAuth(token);
    }
  }, [isAuthenticated, getAuthToken, updateAuth]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        // Clean up all listeners
        listenersRef.current.forEach((handlers, event) => {
          handlers.forEach((handler) => {
            socketRef.current.off(event, handler);
          });
        });

        // Leave all rooms
        roomsRef.current.forEach((room) => {
          emit("leave_room", { room });
        });

        disconnect();
      }
    };
  }, [disconnect, emit]);

  return {
    // Connection state
    isConnected,
    connectionError,
    reconnectAttempt,
    socket: socketRef.current,
    socketId: getSocketId(),

    // Connection control
    connect,
    disconnect,
    reconnect,
    updateAuth,

    // Event handling
    emit,
    on,
    off,

    // Room management
    joinRoom,
    leaveRoom,
    sendToRoom,
    isInRoom,
    getJoinedRooms,

    // Status
    isAuthenticated: isAuthenticated && isConnected,
  };
};

// Hook for task-specific socket events
export const useTaskSocket = (taskId) => {
  const socket = useSocket();
  const [taskUpdates, setTaskUpdates] = useState([]);
  const [bidUpdates, setBidUpdates] = useState([]);
  const [messages, setMessages] = useState([]);

  // Join task room when taskId changes
  useEffect(() => {
    if (taskId && socket.isConnected) {
      const roomName = `task_${taskId}`;
      socket.joinRoom(roomName);

      return () => {
        socket.leaveRoom(roomName);
      };
    }
  }, [taskId, socket]);

  // Listen for task updates
  useEffect(() => {
    if (!socket.isConnected) return;

    const handleTaskUpdate = (data) => {
      setTaskUpdates((prev) => [data, ...prev.slice(0, 9)]); // Keep last 10 updates
    };

    const handleBidUpdate = (data) => {
      setBidUpdates((prev) => [data, ...prev.slice(0, 9)]); // Keep last 10 updates
    };

    const handleNewMessage = (data) => {
      setMessages((prev) => [data, ...prev.slice(0, 49)]); // Keep last 50 messages
    };

    socket.on("task_updated", handleTaskUpdate);
    socket.on("bid_updated", handleBidUpdate);
    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("task_updated", handleTaskUpdate);
      socket.off("bid_updated", handleBidUpdate);
      socket.off("new_message", handleNewMessage);
    };
  }, [socket]);

  // Send task update
  const sendTaskUpdate = useCallback(
    (updateData) => {
      if (taskId) {
        return socket.sendToRoom(`task_${taskId}`, "task_update", updateData);
      }
      return false;
    },
    [taskId, socket]
  );

  // Send bid update
  const sendBidUpdate = useCallback(
    (bidData) => {
      if (taskId) {
        return socket.sendToRoom(`task_${taskId}`, "bid_update", bidData);
      }
      return false;
    },
    [taskId, socket]
  );

  // Send message
  const sendMessage = useCallback(
    (messageData) => {
      if (taskId) {
        return socket.sendToRoom(`task_${taskId}`, "message", messageData);
      }
      return false;
    },
    [taskId, socket]
  );

  return {
    ...socket,
    taskUpdates,
    bidUpdates,
    messages,
    sendTaskUpdate,
    sendBidUpdate,
    sendMessage,
    clearUpdates: () => {
      setTaskUpdates([]);
      setBidUpdates([]);
      setMessages([]);
    },
  };
};

// Hook for notification socket events
export const useNotificationSocket = () => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen for notifications
  useEffect(() => {
    if (!socket.isConnected) return;

    const handleNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev.slice(0, 49)]); // Keep last 50
      setUnreadCount((prev) => prev + 1);
    };

    const handleUnreadCount = (count) => {
      setUnreadCount(count);
    };

    socket.on("notification", handleNotification);
    socket.on("unread_count", handleUnreadCount);

    return () => {
      socket.off("notification", handleNotification);
      socket.off("unread_count", handleUnreadCount);
    };
  }, [socket]);

  // Mark notification as read
  const markAsRead = useCallback(
    (notificationId) => {
      socket.emit("mark_notification_read", { notificationId });
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [socket]
  );

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    socket.emit("mark_all_notifications_read");
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true }))
    );
    setUnreadCount(0);
  }, [socket]);

  return {
    ...socket,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications: () => setNotifications([]),
  };
};

export default useSocket;
