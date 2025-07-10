// client/src/App.jsx
// 
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ProtectedRoute, { UnauthenticatedRoute } from './components/Auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
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
                    <Login />
                  </UnauthenticatedRoute>
                } />

                <Route path="/register" element={
                  <UnauthenticatedRoute>
                    <Register />
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
                    <BidList type="my-bids" pageTitle="My Bids" />
                  </ProtectedRoute>
                } />

                <Route path="/received-bids" element={
                  <ProtectedRoute requireAuth={true}>
                    <BidList type="received" pageTitle="Received Bids" />
                  </ProtectedRoute>
                } />

                <Route path="/my-tasks" element={
                  <ProtectedRoute requireAuth={true}>
                    <TaskList type="my-tasks" pageTitle="My Posted Tasks" />
                  </ProtectedRoute>
                } />

                <Route path="/assigned-tasks" element={
                  <ProtectedRoute requireAuth={true}>
                    <TaskList type="assigned" pageTitle="Assigned Tasks" />
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