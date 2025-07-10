// client/src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Users,
  Target,
  MessageCircle,
  Star,
  CheckCircle,
  TrendingUp,
  Award,
  Search,
  Plus,
  Clock,
  DollarSign,
  Shield,
  Zap,
  BookOpen,
  Coffee,
  Laptop,
  Briefcase,
  ChevronRight,
  Play,
  User,
  Eye,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { QuickRating } from "../components/Profile/RatingStars";

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTasks: 1247,
    activeBidders: 892,
    completedTasks: 3451,
    averageRating: 4.8,
  });

  // Simulate real-time stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        totalTasks: prev.totalTasks + Math.floor(Math.random() * 3),
        activeBidders: prev.activeBidders + Math.floor(Math.random() * 2),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Sample featured tasks
  const featuredTasks = [
    {
      id: 1,
      title: "Write Research Paper on Climate Change",
      description:
        "Need help writing a 2000-word research paper on climate change impacts...",
      budget: 800,
      deadline: "3 days",
      category: "Academic",
      bidsCount: 12,
      poster: { name: "Arjun Patel", college: "IIT Delhi", rating: 4.9 },
    },
    {
      id: 2,
      title: "Design Instagram Posts for Startup",
      description:
        "Looking for creative designer to create 10 Instagram posts for our tech startup...",
      budget: 1200,
      deadline: "5 days",
      category: "Design",
      bidsCount: 8,
      poster: { name: "Priya Sharma", college: "BITS Pilani", rating: 4.7 },
    },
    {
      id: 3,
      title: "Debug Python Web Application",
      description:
        "Need experienced developer to fix bugs in Django application...",
      budget: 600,
      deadline: "2 days",
      category: "Tech",
      bidsCount: 15,
      poster: { name: "Rahul Singh", college: "DTU Delhi", rating: 4.8 },
    },
  ];

  // Sample success stories
  const successStories = [
    {
      id: 1,
      user: "Anjali Gupta",
      college: "DU",
      task: "Mobile App UI Design",
      earned: 2500,
      rating: 5.0,
      testimonial:
        "TaskAuction helped me earn while studying. The platform is amazing!",
    },
    {
      id: 2,
      user: "Vikram Kumar",
      college: "NIT Trichy",
      task: "Data Analysis Project",
      earned: 1800,
      rating: 4.9,
      testimonial: "Found quality work that matches my skills perfectly.",
    },
  ];

  // Task categories
  const categories = [
    { name: "Academic", icon: BookOpen, count: 324, color: "bg-blue-500" },
    { name: "Tech Help", icon: Laptop, count: 198, color: "bg-green-500" },
    { name: "Design", icon: Target, count: 156, color: "bg-purple-500" },
    { name: "Campus Life", icon: Coffee, count: 289, color: "bg-orange-500" },
    { name: "Business", icon: Briefcase, count: 142, color: "bg-red-500" },
    { name: "Personal", icon: User, count: 234, color: "bg-pink-500" },
  ];

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  Student Tasks,
                  <span className="text-yellow-400"> Bidding Made Simple</span>
                </h1>
                <p className="text-xl text-blue-100 leading-relaxed">
                  Connect with fellow students for academic help, campus tasks,
                  and skill-based projects. Post tasks or bid to complete them.
                  Your campus micro-economy starts here.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGetStarted}
                  className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-yellow-300 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>
                    {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <Link
                  to="/tasks"
                  className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-gray-900 transition-colors text-center"
                >
                  Browse Tasks
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {stats.totalTasks.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-200">Active Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {stats.activeBidders.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-200">Active Bidders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {stats.completedTasks.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-200">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {stats.averageRating}
                  </div>
                  <div className="text-sm text-blue-200">Avg Rating</div>
                </div>
              </div>
            </div>

            {/* Right Content - Hero Image/Animation */}
            <div className="relative">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-20">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-white bg-opacity-20 rounded-lg">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-900" />
                    </div>
                    <div>
                      <div className="font-semibold">Arjun posted a task</div>
                      <div className="text-sm text-blue-200">
                        "Need help with Data Structures assignment"
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-white bg-opacity-20 rounded-lg">
                    <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-gray-900" />
                    </div>
                    <div>
                      <div className="font-semibold">5 bids received</div>
                      <div className="text-sm text-blue-200">
                        Starting from ₹200
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-white bg-opacity-20 rounded-lg">
                    <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-gray-900" />
                    </div>
                    <div>
                      <div className="font-semibold">Task completed!</div>
                      <div className="text-sm text-blue-200">
                        Priya earned ₹300
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How TaskAuction Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple 3-step process to get things done or earn money
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                1. Post or Browse
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Post a task you need help with or browse available tasks to find
                work that matches your skills.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                2. Bid & Connect
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Place competitive bids or review received bids. Chat with the
                other party to discuss details.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                3. Complete & Rate
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Complete the task, get paid, and rate each other. Build your
                reputation in the campus community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Task Categories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Task Categories
            </h2>
            <p className="text-xl text-gray-600">
              Find tasks that match your skills and interests
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/tasks?category=${category.name.toLowerCase()}`}
                className="group p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-center border border-gray-100 hover:border-gray-200"
              >
                <div
                  className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                >
                  <category.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500">{category.count} tasks</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tasks */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Featured Tasks
              </h2>
              <p className="text-xl text-gray-600">
                High-quality tasks from verified students
              </p>
            </div>
            <Link
              to="/tasks"
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-2"
            >
              <span>View All Tasks</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {task.category}
                  </span>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">{task.bidsCount} bids</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                  {task.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {task.description}
                </p>

                <div className="flex justify-between items-center mb-4">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{task.budget.toLocaleString()}
                  </div>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{task.deadline}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {task.poster.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {task.poster.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {task.poster.college}
                      </div>
                    </div>
                  </div>
                  <QuickRating rating={task.poster.rating} size="sm" />
                </div>

                <Link
                  to={`/tasks/${task.id}`}
                  className="block w-full mt-4 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose TaskAuction */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose TaskAuction?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built specifically for students, by students
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: "Verified Students",
                description:
                  "College email verification ensures a trusted community",
                color: "text-blue-600",
                bg: "bg-blue-100",
              },
              {
                icon: Zap,
                title: "Real-time Chat",
                description:
                  "Instant communication with file sharing capabilities",
                color: "text-green-600",
                bg: "bg-green-100",
              },
              {
                icon: Star,
                title: "Rating System",
                description:
                  "Build reputation through quality work and reviews",
                color: "text-yellow-600",
                bg: "bg-yellow-100",
              },
              {
                icon: TrendingUp,
                title: "Fair Pricing",
                description: "Competitive bidding ensures fair market rates",
                color: "text-purple-600",
                bg: "bg-purple-100",
              },
            ].map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div
                  className={`w-16 h-16 ${feature.bg} rounded-full flex items-center justify-center mx-auto mb-6`}
                >
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Student Success Stories
            </h2>
            <p className="text-xl text-blue-100">
              Real students, real earnings, real success
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {successStories.map((story) => (
              <div
                key={story.id}
                className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 border border-white border-opacity-20"
              >
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-gray-900 font-bold text-lg">
                      {story.user
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{story.user}</h3>
                    <p className="text-blue-200">{story.college}</p>
                    <QuickRating
                      rating={story.rating}
                      size="sm"
                      className="mt-1"
                    />
                  </div>
                </div>

                <blockquote className="text-blue-100 text-lg italic mb-6">
                  "{story.testimonial}"
                </blockquote>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-blue-200">Latest Task</div>
                    <div className="font-semibold">{story.task}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-200">Earned</div>
                    <div className="text-2xl font-bold text-yellow-400">
                      ₹{story.earned.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Campus Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Join thousands of students already earning and learning through
            TaskAuction. Your next opportunity is just one click away.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-yellow-300 transition-colors flex items-center justify-center space-x-2"
            >
              <span>
                {isAuthenticated ? "Go to Dashboard" : "Join TaskAuction"}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {!isAuthenticated && (
              <Link
                to="/login"
                className="border-2 border-gray-600 text-gray-300 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 hover:text-white transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400 text-sm">
              Join the campus micro-economy • Trusted by 10,000+ students • Free
              to use
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
