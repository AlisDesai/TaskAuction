// client/src/components/Chat/ChatWindow.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  MoreVertical,
  Search,
  Phone,
  Video,
  Info,
  User,
  Star,
  Calendar,
  Download,
  Edit,
  Trash2,
  Reply,
  Smile,
  AlertCircle,
  Loader,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import MessageInput from "./MessageInput";
import { useTaskSocket } from "../../hooks/useSocket";
import chatService from "../../services/chatService";
import { useAuth } from "../../context/AuthContext";

const ChatWindow = ({
  taskId,
  task = null,
  onClose = null,
  className = "",
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Socket for real-time messaging
  const socket = useTaskSocket(taskId);

  // State
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = false) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, []);

  // Load messages
  const loadMessages = useCallback(
    async (page = 1, append = false) => {
      try {
        if (!append) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        setError(null);

        const response = await chatService.getConversation(taskId, {
          page,
          limit: 50,
        });

        if (response.success) {
          if (append) {
            setMessages((prev) => [...response.messages, ...prev]);
          } else {
            setMessages(response.messages);
            setTimeout(() => scrollToBottom(), 100);
          }

          setHasMore(response.pagination?.hasNext || false);
          setCurrentPage(page);
        } else {
          throw new Error(response.message);
        }
      } catch (err) {
        console.error("Error loading messages:", err);
        setError(err.message || "Failed to load messages");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [taskId, scrollToBottom]
  );

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(() => {
    if (hasMore && !loadingMore) {
      loadMessages(currentPage + 1, true);
    }
  }, [hasMore, loadingMore, currentPage, loadMessages]);

  // Handle scroll for pagination
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container && container.scrollTop === 0 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  }, [hasMore, loadingMore, loadMoreMessages]);

  // Send message
  const handleSendMessage = useCallback(
    async (messageData, file = null) => {
      try {
        const response = await chatService.sendMessage(
          taskId,
          messageData,
          file
        );

        if (response.success) {
          // Add message to local state immediately for better UX
          const newMessage = {
            ...response.data,
            sender: user,
            createdAt: new Date().toISOString(),
            isOptimistic: true, // Mark as optimistic update
          };

          setMessages((prev) => [...prev, newMessage]);
          scrollToBottom(true);

          // Clear reply state
          setReplyingTo(null);

          // Emit via socket for real-time updates
          socket.emit("message_sent", {
            taskId,
            message: response.data,
          });

          return { success: true };
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        return {
          success: false,
          message: error.message || "Failed to send message",
        };
      }
    },
    [taskId, user, scrollToBottom, socket]
  );

  // Edit message
  const handleEditMessage = useCallback(
    async (messageId, content) => {
      try {
        const response = await chatService.editMessage(messageId, content);

        if (response.success) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === messageId ? { ...msg, ...response.data } : msg
            )
          );

          setEditingMessage(null);

          // Emit via socket
          socket.emit("message_edited", {
            taskId,
            messageId,
            message: response.data,
          });

          return { success: true };
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error("Error editing message:", error);
        return {
          success: false,
          message: error.message || "Failed to edit message",
        };
      }
    },
    [taskId, socket]
  );

  // Delete message
  const handleDeleteMessage = useCallback(
    async (messageId) => {
      try {
        const response = await chatService.deleteMessage(messageId);

        if (response.success) {
          setMessages((prev) => prev.filter((msg) => msg._id !== messageId));

          // Emit via socket
          socket.emit("message_deleted", {
            taskId,
            messageId,
          });

          return { success: true };
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error("Error deleting message:", error);
        return {
          success: false,
          message: error.message || "Failed to delete message",
        };
      }
    },
    [taskId, socket]
  );

  // Add reaction
  const handleAddReaction = useCallback(
    async (messageId, emoji) => {
      try {
        const response = await chatService.addReaction(messageId, emoji);

        if (response.success) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === messageId
                ? { ...msg, reactions: response.reactions }
                : msg
            )
          );

          // Emit via socket
          socket.emit("reaction_added", {
            taskId,
            messageId,
            emoji,
            reactions: response.reactions,
          });
        }
      } catch (error) {
        console.error("Error adding reaction:", error);
      }
    },
    [taskId, socket]
  );

  // Remove reaction
  const handleRemoveReaction = useCallback(
    async (messageId) => {
      try {
        const response = await chatService.removeReaction(messageId);

        if (response.success) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === messageId
                ? { ...msg, reactions: response.reactions }
                : msg
            )
          );

          // Emit via socket
          socket.emit("reaction_removed", {
            taskId,
            messageId,
            reactions: response.reactions,
          });
        }
      } catch (error) {
        console.error("Error removing reaction:", error);
      }
    },
    [taskId, socket]
  );

  // Search messages
  const handleSearch = useCallback(
    async (query) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await chatService.searchMessages(taskId, query);
        if (response.success) {
          setSearchResults(response.messages);
        }
      } catch (error) {
        console.error("Error searching messages:", error);
      }
    },
    [taskId]
  );

  // Get participant info
  const getParticipant = useCallback(() => {
    if (!task || !user) return null;

    if (task.poster._id === user.id) {
      return task.assignedTo;
    } else {
      return task.poster;
    }
  }, [task, user]);

  // Format message time
  const formatMessageTime = useCallback((timestamp) => {
    return chatService.formatMessageTime(timestamp);
  }, []);

  // Group messages by date
  const groupedMessages = chatService.groupMessagesByDate(messages);

  // Socket event listeners
  useEffect(() => {
    if (!socket.isConnected) return;

    // Join task room
    socket.joinRoom(`task_${taskId}`);

    // Listen for new messages
    socket.on("new_message", (data) => {
      if (data.taskId === taskId) {
        setMessages((prev) => {
          // Avoid duplicates
          const exists = prev.some((msg) => msg._id === data.message._id);
          if (!exists) {
            return [...prev, data.message];
          }
          return prev;
        });
        scrollToBottom(true);
      }
    });

    // Listen for message edits
    socket.on("message_edited", (data) => {
      if (data.taskId === taskId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId ? { ...msg, ...data.message } : msg
          )
        );
      }
    });

    // Listen for message deletions
    socket.on("message_deleted", (data) => {
      if (data.taskId === taskId) {
        setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
      }
    });

    // Listen for reactions
    socket.on("reaction_added", (data) => {
      if (data.taskId === taskId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId
              ? { ...msg, reactions: data.reactions }
              : msg
          )
        );
      }
    });

    socket.on("reaction_removed", (data) => {
      if (data.taskId === taskId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId
              ? { ...msg, reactions: data.reactions }
              : msg
          )
        );
      }
    });

    // Listen for typing indicators
    socket.on("user_typing", (data) => {
      if (data.taskId === taskId && data.userId !== user.id) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      }
    });

    socket.on("user_stopped_typing", (data) => {
      if (data.taskId === taskId) {
        setTypingUsers((prev) =>
          prev.filter((userId) => userId !== data.userId)
        );
      }
    });

    // Listen for online status
    socket.on("user_online", (data) => {
      const participant = getParticipant();
      if (participant && data.userId === participant._id) {
        setIsOnline(true);
        setLastSeen(null);
      }
    });

    socket.on("user_offline", (data) => {
      const participant = getParticipant();
      if (participant && data.userId === participant._id) {
        setIsOnline(false);
        setLastSeen(data.lastSeen);
      }
    });

    return () => {
      socket.leaveRoom(`task_${taskId}`);
      socket.off("new_message");
      socket.off("message_edited");
      socket.off("message_deleted");
      socket.off("reaction_added");
      socket.off("reaction_removed");
      socket.off("user_typing");
      socket.off("user_stopped_typing");
      socket.off("user_online");
      socket.off("user_offline");
    };
  }, [socket, taskId, user, scrollToBottom, getParticipant]);

  // Initial load
  useEffect(() => {
    if (taskId) {
      loadMessages();
      setParticipant(getParticipant());
    }
  }, [taskId, loadMessages, getParticipant]);

  // Mark conversation as read when component mounts or becomes visible
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await chatService.markConversationAsRead(taskId);
      } catch (error) {
        console.error("Error marking conversation as read:", error);
      }
    };

    if (taskId) {
      markAsRead();
    }
  }, [taskId]);

  // Handle search input
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, handleSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load chat
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => loadMessages()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {participant && (
            <>
              {participant.avatar ? (
                <img
                  src={participant.avatar}
                  alt={`${participant.firstName} ${participant.lastName}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900">
                  {participant.firstName} {participant.lastName}
                </h3>
                <div className="flex items-center space-x-2 text-sm">
                  {isOnline ? (
                    <span className="text-green-600 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      Online
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      {lastSeen
                        ? `Last seen ${formatMessageTime(lastSeen)}`
                        : "Offline"}
                    </span>
                  )}

                  {participant.rating?.average && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-gray-600">
                        {participant.rating.average.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Search messages"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </button>

          {task && (
            <Link
              to={`/tasks/${task._id}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="View task details"
            >
              <Info className="w-5 h-5 text-gray-600" />
            </Link>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="mt-2 max-h-32 overflow-y-auto">
              {searchResults.map((message) => (
                <div
                  key={message._id}
                  className="p-2 hover:bg-white rounded cursor-pointer text-sm"
                  onClick={() => {
                    // Scroll to message if visible
                    const messageElement = document.getElementById(
                      `message-${message._id}`
                    );
                    if (messageElement) {
                      messageElement.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }
                  }}
                >
                  <div className="font-medium text-gray-900">
                    {message.sender.firstName} {message.sender.lastName}
                  </div>
                  <div className="text-gray-600 truncate">
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {/* Load More Button */}
        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadMoreMessages}
              disabled={loadingMore}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <div className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                "Load older messages"
              )}
            </button>
          </div>
        )}

        {/* Messages grouped by date */}
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">
                {new Date(date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>

            {/* Messages for this date */}
            {dateMessages.map((message, index) => {
              const isMyMessage = chatService.isMyMessage(message);
              const showAvatar =
                !isMyMessage &&
                (index === 0 ||
                  dateMessages[index - 1]?.sender._id !== message.sender._id);

              return (
                <MessageBubble
                  key={message._id}
                  message={message}
                  isMyMessage={isMyMessage}
                  showAvatar={showAvatar}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                  onReply={(msg) => setReplyingTo(msg)}
                  onReaction={handleAddReaction}
                  onRemoveReaction={handleRemoveReaction}
                  editingMessage={editingMessage}
                  setEditingMessage={setEditingMessage}
                />
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-gray-500 text-sm">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
            <span>{participant?.firstName} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Replying to {replyingTo.sender.firstName}
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </div>
          <div className="text-sm text-gray-600 mt-1 truncate">
            {replyingTo.content}
          </div>
        </div>
      )}

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        disabled={!socket.isConnected}
        placeholder={socket.isConnected ? "Type a message..." : "Connecting..."}
        onTyping={(isTyping) => {
          if (socket.isConnected) {
            socket.emit(isTyping ? "user_typing" : "user_stopped_typing", {
              taskId,
            });
          }
        }}
      />
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({
  message,
  isMyMessage,
  showAvatar,
  onEdit,
  onDelete,
  onReply,
  onReaction,
  onRemoveReaction,
  editingMessage,
  setEditingMessage,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const canEdit = chatService.canEditMessage(message);
  const canDelete = chatService.canDeleteMessage(message);
  const reactionsSummary = chatService.getReactionsSummary(
    message.reactions || []
  );
  const availableEmojis = chatService.getAvailableEmojis();

  const handleEdit = () => {
    if (editContent.trim() !== message.content) {
      onEdit(message._id, editContent.trim());
    }
    setEditingMessage(null);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setEditingMessage(null);
  };

  return (
    <div
      id={`message-${message._id}`}
      className={`flex ${isMyMessage ? "justify-end" : "justify-start"} mb-4`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={`flex max-w-xs lg:max-w-md ${
          isMyMessage ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        {showAvatar && !isMyMessage && (
          <div className="flex-shrink-0 mr-2">
            {message.sender.avatar ? (
              <img
                src={message.sender.avatar}
                alt={`${message.sender.firstName} ${message.sender.lastName}`}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
            )}
          </div>
        )}

        {/* Message Content */}
        <div className="relative group">
          {/* Actions */}
          {showActions && (
            <div
              className={`absolute -top-8 ${
                isMyMessage ? "right-0" : "left-0"
              } flex items-center space-x-1 bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1 z-10`}
            >
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"
                title="Add reaction"
              >
                <Smile className="w-4 h-4" />
              </button>

              <button
                onClick={() => onReply(message)}
                className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"
                title="Reply"
              >
                <Reply className="w-4 h-4" />
              </button>

              {canEdit && (
                <button
                  onClick={() => setEditingMessage(message._id)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}

              {canDelete && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete this message?"
                      )
                    ) {
                      onDelete(message._id);
                    }
                  }}
                  className="p-1 hover:bg-gray-100 rounded text-red-600 hover:text-red-800"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Reaction Picker */}
          {showReactions && (
            <div
              className={`absolute -top-12 ${
                isMyMessage ? "right-0" : "left-0"
              } bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20`}
            >
              <div className="flex space-x-1">
                {availableEmojis.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReaction(message._id, emoji);
                      setShowReactions(false);
                    }}
                    className="p-1 hover:bg-gray-100 rounded text-lg"
                    title={label}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={`rounded-lg px-3 py-2 ${
              isMyMessage
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-900"
            } ${message.isOptimistic ? "opacity-70" : ""}`}
          >
            {/* Reply reference */}
            {message.replyTo && (
              <div
                className={`text-xs opacity-75 mb-1 p-2 rounded ${
                  isMyMessage ? "bg-blue-700" : "bg-gray-200"
                }`}
              >
                <div className="font-medium">
                  {message.replyTo.sender.firstName}
                </div>
                <div className="truncate">{message.replyTo.content}</div>
              </div>
            )}

            {/* Message content */}
            {editingMessage === message._id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-gray-900 text-sm resize-none"
                  rows="2"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Text content */}
                {message.content && (
                  <div className="break-words">
                    {message.content}
                    {message.isEdited && (
                      <span
                        className={`text-xs ml-2 ${
                          isMyMessage ? "text-blue-200" : "text-gray-500"
                        }`}
                      >
                        (edited)
                      </span>
                    )}
                  </div>
                )}

                {/* File attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment, index) => (
                      <div key={index}>
                        {message.type === "image" ? (
                          <img
                            src={attachment.url}
                            alt={attachment.originalName}
                            className="max-w-full h-auto rounded cursor-pointer hover:opacity-90"
                            onClick={() =>
                              window.open(attachment.url, "_blank")
                            }
                          />
                        ) : (
                          <div
                            className={`flex items-center space-x-2 p-2 rounded ${
                              isMyMessage ? "bg-blue-700" : "bg-white border"
                            }`}
                          >
                            <span className="text-lg">
                              {chatService.getFileIcon(attachment.mimeType)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div
                                className={`text-sm font-medium truncate ${
                                  isMyMessage ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {attachment.originalName}
                              </div>
                              <div
                                className={`text-xs ${
                                  isMyMessage
                                    ? "text-blue-200"
                                    : "text-gray-500"
                                }`}
                              >
                                {chatService.formatFileSize(
                                  attachment.fileSize
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                chatService.downloadFile(
                                  message._id,
                                  attachment.filename
                                )
                              }
                              className={`p-1 rounded hover:bg-opacity-75 ${
                                isMyMessage
                                  ? "text-white hover:bg-blue-800"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Reactions */}
          {Object.keys(reactionsSummary).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(reactionsSummary).map(([emoji, summary]) => (
                <button
                  key={emoji}
                  onClick={() => {
                    if (summary.hasCurrentUser) {
                      onRemoveReaction(message._id);
                    } else {
                      onReaction(message._id, emoji);
                    }
                  }}
                  className={`flex items-center space-x-1 px-2 py-1 text-xs rounded-full border transition-colors ${
                    summary.hasCurrentUser
                      ? "bg-blue-100 border-blue-300 text-blue-800"
                      : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{summary.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Message metadata */}
          <div
            className={`flex items-center space-x-1 mt-1 text-xs ${
              isMyMessage ? "justify-end text-blue-200" : "text-gray-500"
            }`}
          >
            <span>{chatService.formatMessageTime(message.createdAt)}</span>

            {isMyMessage && (
              <div className="flex items-center">
                {message.isOptimistic ? (
                  <Clock className="w-3 h-3" title="Sending..." />
                ) : message.isRead ? (
                  <CheckCircle2 className="w-3 h-3" title="Read" />
                ) : (
                  <CheckCircle2
                    className="w-3 h-3 opacity-50"
                    title="Delivered"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
