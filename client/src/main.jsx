import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ProtectedRoute, { UnauthenticatedRoute } from './pages/ProtectedRoute';

// Pages
import Home from './pages/Home';
import LoginForm from './pages/LoginForm';
import RegisterForm from './pages/RegisterForm';
import Dashboard from './pages/Dashboard';
import TaskDetail from './pages/TaskDetail';
import CreateTask from './pages/CreateTask';
import Profile from './pages/Profile';
import Chat from './pages/Chat';

// Components
import TaskList from './components/Tasks/TaskList';
import BidList from './components/Bids/BidList';

// Styles
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <TaskProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />

                {/* Auth Routes - Only accessible when not logged in */}
                <Route path="/login" element={
                  <UnauthenticatedRoute>
                    <LoginForm />
                  </UnauthenticatedRoute>
                } />

                <Route path="/register" element={
                  <UnauthenticatedRoute>
                    <RegisterForm />
                  </UnauthenticatedRoute>
                } />

                {/* Public Task Browsing */}
                <Route path="/tasks" element={<TaskList />} />
                <Route path="/tasks/:taskId" element={<TaskDetail />} />

                {/* Protected Routes - Require Authentication */}
                <Route path="/dashboard" element={
                  <ProtectedRoute requireAuth={true}>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                <Route path="/tasks/create" element={
                  <ProtectedRoute requireAuth={true}>
                    <CreateTask />
                  </ProtectedRoute>
                } />

                <Route path="/tasks/:taskId/edit" element={
                  <ProtectedRoute requireAuth={true}>
                    <CreateTask />
                  </ProtectedRoute>
                } />

                <Route path="/profile" element={
                  <ProtectedRoute requireAuth={true}>
                    <Profile />
                  </ProtectedRoute>
                } />

                <Route path="/profile/:userId" element={
                  <ProtectedRoute requireAuth={true}>
                    <Profile />
                  </ProtectedRoute>
                } />

                <Route path="/my-bids" element={
                  <ProtectedRoute requireAuth={true}>
                    <BidList
                      type="my-bids"
                      pageTitle="My Bids"
                      emptyMessage="You haven't placed any bids yet. Browse tasks to start bidding."
                    />
                  </ProtectedRoute>
                } />

                <Route path="/received-bids" element={
                  <ProtectedRoute requireAuth={true}>
                    <BidList
                      type="received"
                      pageTitle="Received Bids"
                      emptyMessage="No bids received yet. Post a task to start receiving bids."
                    />
                  </ProtectedRoute>
                } />

                <Route path="/my-tasks" element={
                  <ProtectedRoute requireAuth={true}>
                    <TaskList
                      pageTitle="My Posted Tasks"
                      initialFilters={{ type: "my-tasks" }}
                      emptyMessage="You haven't posted any tasks yet. Create your first task to get started."
                      showCreateButton={true}
                    />
                  </ProtectedRoute>
                } />

                <Route path="/assigned-tasks" element={
                  <ProtectedRoute requireAuth={true}>
                    <TaskList
                      pageTitle="Assigned Tasks"
                      initialFilters={{ type: "assigned" }}
                      emptyMessage="No tasks assigned to you yet. Place winning bids to see assigned tasks here."
                      showCreateButton={false}
                    />
                  </ProtectedRoute>
                } />

                <Route path="/chat/:taskId" element={
                  <ProtectedRoute requireAuth={true}>
                    <Chat />
                  </ProtectedRoute>
                } />

                <Route path="/chat" element={
                  <ProtectedRoute requireAuth={true}>
                    <Chat />
                  </ProtectedRoute>
                } />

                <Route path="/settings" element={
                  <ProtectedRoute requireAuth={true}>
                    <Profile />
                  </ProtectedRoute>
                } />

                <Route path="/analytics" element={
                  <ProtectedRoute requireAuth={true}>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                {/* Static Pages */}
                <Route path="/about" element={<StaticPage page="about" />} />
                <Route path="/contact" element={<StaticPage page="contact" />} />
                <Route path="/terms" element={<StaticPage page="terms" />} />
                <Route path="/privacy" element={<StaticPage page="privacy" />} />
                <Route path="/help" element={<StaticPage page="help" />} />
                <Route path="/how-it-works" element={<StaticPage page="how-it-works" />} />
                <Route path="/categories" element={<StaticPage page="categories" />} />
                <Route path="/success-stories" element={<StaticPage page="success-stories" />} />
                <Route path="/safety" element={<StaticPage page="safety" />} />
                <Route path="/guidelines" element={<StaticPage page="guidelines" />} />
                <Route path="/cookies" element={<StaticPage page="cookies" />} />

                {/* Task Categories */}
                <Route path="/tasks/category/:category" element={
                  <TaskList
                    pageTitle="Category Tasks"
                    showCreateButton={true}
                  />
                } />

                {/* Search Results */}
                <Route path="/search" element={
                  <TaskList
                    pageTitle="Search Results"
                    showCreateButton={true}
                  />
                } />

                {/* Error Routes */}
                <Route path="/404" element={<NotFoundPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="/maintenance" element={<MaintenancePage />} />

                {/* Catch all route - Redirect to 404 */}
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </TaskProvider>
      </AuthProvider>
    </Router>
  );
}

// Static Page Component
const StaticPage = ({ page }) => {
  const pageContent = {
    about: {
      title: "About TaskAuction",
      content: "TaskAuction is a platform designed to connect students for small tasks and services through a bidding system."
    },
    contact: {
      title: "Contact Us",
      content: "Get in touch with our team for support, feedback, or questions."
    },
    terms: {
      title: "Terms and Conditions",
      content: "Please read these terms and conditions carefully before using our service."
    },
    privacy: {
      title: "Privacy Policy",
      content: "Your privacy is important to us. This policy explains how we collect and use your information."
    },
    help: {
      title: "Help Center",
      content: "Find answers to common questions and learn how to use TaskAuction effectively."
    },
    "how-it-works": {
      title: "How It Works",
      content: "Learn how TaskAuction connects students through our simple 3-step bidding process."
    },
    categories: {
      title: "Task Categories",
      content: "Explore different types of tasks available on TaskAuction from academic help to campus services."
    },
    "success-stories": {
      title: "Success Stories",
      content: "Read inspiring stories from students who have found success using TaskAuction."
    },
    safety: {
      title: "Safety Guidelines",
      content: "Stay safe while using TaskAuction with our comprehensive safety guidelines."
    },
    guidelines: {
      title: "Community Guidelines",
      content: "Our community guidelines help maintain a positive environment for all TaskAuction users."
    },
    cookies: {
      title: "Cookie Policy",
      content: "Learn about how TaskAuction uses cookies to improve your experience on our platform."
    }
  };

  const { title, content } = pageContent[page] || pageContent.about;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
          <div className="prose max-w-none">
            <p className="text-gray-600 leading-relaxed">{content}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Error Pages
const NotFoundPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
      <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
        Go Home
      </a>
    </div>
  </div>
);

const UnauthorizedPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">401</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Unauthorized</h2>
      <p className="text-gray-600 mb-8">You don't have permission to access this page.</p>
      <a href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
        Sign In
      </a>
    </div>
  </div>
);

const MaintenancePage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">🔧</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Under Maintenance</h2>
      <p className="text-gray-600 mb-8">We're working to improve TaskAuction. Please check back soon.</p>
      <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
        Go Home
      </a>
    </div>
  </div>
);

export default App;