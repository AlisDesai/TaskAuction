// client/src/pages/Chat.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  MessageCircle,
  AlertTriangle,
  Loader,
  Users,
  Settings,
} from "lucide-react";

import ChatWindow from "../components/Chat/ChatWindow";
import { useAuth } from "../hooks/useAuth";
import taskService from "../services/taskService";

const Chat = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // State
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [canChat, setCanChat] = useState(false);

  // Load task data
  useEffect(() => {
    const loadTask = async () => {
      if (!taskId || !isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const result = await taskService.getTask(taskId);

        if (result.success) {
          setTask(result.task);

          // Check if user can chat for this task
          const userCanChat = checkChatPermission(result.task, user);
          setCanChat(userCanChat);

          if (!userCanChat) {
            setError("You don't have permission to chat for this task");
          }
        } else {
          setError(result.message || "Task not found");
        }
      } catch (err) {
        console.error("Error loading task:", err);
        setError("Failed to load task details");
      } finally {
        setIsLoading(false);
      }
    };

    loadTask();
  }, [taskId, isAuthenticated, user]);

  // Check if user has permission to chat
  const checkChatPermission = (task, currentUser) => {
    if (!task || !currentUser) return false;

    // Task poster can always chat
    if (task.poster._id === currentUser._id) {
      return true;
    }

    // Assigned user can chat if task is assigned/in-progress
    if (task.assignedTo && task.assignedTo._id === currentUser._id) {
      return ["Assigned", "In-Progress"].includes(task.status);
    }

    return false;
  };

  // Handle back navigation
  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Loading chat...
          </h3>
          <p className="text-gray-600">
            Please wait while we load the conversation
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Helmet>
          <title>Chat Error - TaskAuction</title>
          <meta name="description" content="Error loading chat conversation" />
        </Helmet>

        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Cannot Access Chat
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={handleGoBack}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go Back
              </button>
              {task && (
                <button
                  onClick={() => navigate(`/tasks/${task._id}`)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View Task Details
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Helmet>
          <title>Login Required - TaskAuction</title>
          <meta name="description" content="Please login to access chat" />
        </Helmet>

        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <MessageCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Login Required
            </h3>
            <p className="text-gray-600 mb-4">
              Please log in to access the chat feature
            </p>
            <button
              onClick={() =>
                navigate("/login", { state: { from: `/chat/${taskId}` } })
              }
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </>
    );
  }

  // No task found
  if (!task) {
    return (
      <>
        <Helmet>
          <title>Task Not Found - TaskAuction</title>
          <meta
            name="description"
            content="The requested task could not be found"
          />
        </Helmet>

        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Task Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              The task you're trying to chat about could not be found
            </p>
            <button
              onClick={handleGoBack}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  // No chat permission
  if (!canChat) {
    return (
      <>
        <Helmet>
          <title>Access Denied - TaskAuction</title>
          <meta
            name="description"
            content="You don't have permission to access this chat"
          />
        </Helmet>

        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <Users className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chat Not Available
            </h3>
            <p className="text-gray-600 mb-4">
              Chat is only available between the task poster and assigned bidder
            </p>
            <div className="space-y-2">
              <button
                onClick={() => navigate(`/tasks/${task._id}`)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Task Details
              </button>
              <button
                onClick={handleGoBack}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Chat - ${task.title} - TaskAuction`}</title>
        <meta
          name="description"
          content={`Chat conversation for task: ${task.title}`}
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGoBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-semibold text-gray-900 truncate">
                  {task.title}
                </h1>
                <p className="text-sm text-gray-500">
                  {task.status} • {task.category}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/tasks/${task._id}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Task details"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="max-w-7xl mx-auto h-screen lg:h-[calc(100vh-4rem)] flex">
          {/* Sidebar - Hidden on mobile */}
          <div className="hidden lg:flex lg:w-80 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white">
            {/* Task Info Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handleGoBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate(`/tasks/${task._id}`)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="View task details"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {task.title}
              </h2>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    task.status === "Open"
                      ? "bg-green-100 text-green-700"
                      : task.status === "Assigned"
                      ? "bg-blue-100 text-blue-700"
                      : task.status === "In-Progress"
                      ? "bg-yellow-100 text-yellow-700"
                      : task.status === "Completed"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {task.status}
                </span>
                <span>{task.category}</span>
              </div>
            </div>

            {/* Task Details */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Task Details</h3>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Budget:</span>
                  <span className="ml-2 font-medium text-green-600">
                    ₹{task.budget?.min} - ₹{task.budget?.max}
                  </span>
                </div>

                {task.deadline && (
                  <div>
                    <span className="text-gray-500">Deadline:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {task.location && (
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <span className="ml-2 text-gray-900">{task.location}</span>
                  </div>
                )}

                <div>
                  <span className="text-gray-500">Posted by:</span>
                  <span className="ml-2 text-gray-900">
                    {task.poster?.firstName} {task.poster?.lastName}
                  </span>
                </div>

                {task.assignedTo && (
                  <div>
                    <span className="text-gray-500">Assigned to:</span>
                    <span className="ml-2 text-gray-900">
                      {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Task Description */}
            <div className="flex-1 p-6 overflow-y-auto">
              <h3 className="font-medium text-gray-900 mb-3">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {task.description}
              </p>

              {task.tags && task.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col">
            <ChatWindow
              taskId={taskId}
              task={task}
              onClose={() => navigate(-1)}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;
