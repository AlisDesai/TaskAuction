// client/src/pages/CreateTask.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Plus, ArrowLeft } from "lucide-react";
import TaskForm from "../components/Tasks/TaskForm";
import { useAuth } from "../hooks/useAuth";

const CreateTask = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect if not authenticated (extra protection beyond ProtectedRoute)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", {
        state: { from: "/create-task" },
        replace: true,
      });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Check if user profile is complete enough to post tasks
  const canPostTasks = () => {
    if (!user) return false;

    // Check required fields for posting tasks
    const requiredFields = ["firstName", "lastName", "email", "college"];
    return requiredFields.every((field) => user[field]);
  };

  // Handle back navigation
  const handleGoBack = () => {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading...</h3>
          <p className="text-gray-600">Preparing task creation form</p>
        </div>
      </div>
    );
  }

  // Show profile completion required message
  if (!canPostTasks()) {
    return (
      <>
        <Helmet>
          <title>Complete Profile - TaskAuction</title>
          <meta
            name="description"
            content="Complete your profile to start posting tasks on TaskAuction"
          />
        </Helmet>

        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="w-8 h-8 text-yellow-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Complete Your Profile
              </h1>

              <p className="text-gray-600 mb-6 leading-relaxed">
                To post tasks and connect with other students, please complete
                your profile first. This helps ensure trust and safety within
                our campus community.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-2">
                  Required Information:
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Full name (first and last name)</li>
                  <li>• Verified college email address</li>
                  <li>• College/university information</li>
                  <li>• Contact information</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/profile")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Complete Profile
                </button>
                <button
                  onClick={handleGoBack}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Post a New Task - TaskAuction</title>
        <meta
          name="description"
          content="Post a task on TaskAuction and find the right person to help you complete it. Get competitive bids from fellow students."
        />
        <meta
          name="keywords"
          content="post task, hire students, campus services, student marketplace"
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleGoBack}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Post a New Task
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Describe what you need help with and get competitive bids
                  </p>
                </div>
              </div>

              {/* Quick Tips Button */}
              <button
                onClick={() => navigate("/help/posting-tasks")}
                className="hidden sm:flex items-center px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <span>Posting Tips</span>
              </button>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Dashboard
                </button>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <button
                  onClick={() => navigate("/tasks")}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Tasks
                </button>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium">Create Task</li>
            </ol>
          </nav>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Task Form - Main Content */}
            <div className="lg:col-span-3">
              <TaskForm />
            </div>

            {/* Sidebar - Tips and Guidelines */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Posting Tips */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Plus className="w-4 h-4 text-blue-600" />
                    </div>
                    Posting Tips
                  </h3>

                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">
                        Be Specific
                      </h4>
                      <p className="text-gray-600">
                        Provide clear details about what you need. The more
                        specific you are, the better quality bids you'll
                        receive.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">
                        Set Fair Budget
                      </h4>
                      <p className="text-gray-600">
                        Research similar tasks and set a competitive budget
                        range to attract quality bidders.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">
                        Include Images
                      </h4>
                      <p className="text-gray-600">
                        Add relevant images or documents to help bidders
                        understand your requirements better.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">
                        Set Realistic Deadline
                      </h4>
                      <p className="text-gray-600">
                        Allow sufficient time for quality work. Rush jobs may
                        result in higher costs or lower quality.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Budget Guidelines */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Budget Guidelines
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Academic Help:</span>
                      <span className="font-medium text-gray-900">
                        ₹200-800
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tech Projects:</span>
                      <span className="font-medium text-gray-900">
                        ₹500-1500
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Campus Errands:</span>
                      <span className="font-medium text-gray-900">
                        ₹100-400
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Personal Tasks:</span>
                      <span className="font-medium text-gray-900">
                        ₹150-600
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      * These are typical ranges. Set your budget based on task
                      complexity and urgency.
                    </p>
                  </div>
                </div>

                {/* Safety Reminder */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <h3 className="font-semibold text-amber-900 mb-3">
                    Safety First
                  </h3>
                  <div className="space-y-2 text-sm text-amber-800">
                    <p>• Only work with verified students</p>
                    <p>• Meet in public campus locations</p>
                    <p>• Keep communications on platform</p>
                    <p>• Report any suspicious behavior</p>
                  </div>
                </div>

                {/* Help Link */}
                <div className="text-center">
                  <button
                    onClick={() => navigate("/help")}
                    className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Need help? View our guide →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateTask;
