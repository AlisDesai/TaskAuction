// client/src/components/Profile/ProfileCard.jsx
import React, { useState, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Trophy,
  Briefcase,
  Edit,
  Camera,
  Trash2,
  CheckCircle,
  XCircle,
  Award,
  TrendingUp,
  Target,
  Clock,
  Upload,
  Loader,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const ProfileCard = ({
  user = null,
  isOwnProfile = false,
  onEdit = null,
  showFullDetails = true,
  compact = false,
  className = "",
}) => {
  const {
    user: currentUser,
    uploadAvatar,
    deleteAvatar,
    getUserStats,
    getUserRating,
    getUserRole,
    getAvatarUrl,
    getUserInitials,
    isVerified,
  } = useAuth();

  // Use current user if no user prop provided and it's own profile
  const profileUser = user || (isOwnProfile ? currentUser : null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  if (!profileUser) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Profile not found</p>
        </div>
      </div>
    );
  }

  // Get user data
  const stats = getUserStats();
  const rating = getUserRating();
  const role = getUserRole();
  const avatarUrl = getAvatarUrl();
  const initials = getUserInitials();
  const verified = isVerified();

  // Handle avatar upload
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      setUploadError("File size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const result = await uploadAvatar(file);
      if (!result.success) {
        setUploadError(result.message);
      }
    } catch (error) {
      setUploadError("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle avatar deletion
  const handleAvatarDelete = async () => {
    if (
      !window.confirm("Are you sure you want to remove your profile picture?")
    ) {
      return;
    }

    try {
      const result = await deleteAvatar();
      if (!result.success) {
        setUploadError(result.message);
      }
    } catch (error) {
      setUploadError("Failed to delete avatar");
    }
  };

  // Get role badge styling
  const getRoleBadge = (userRole) => {
    const badges = {
      new: { color: "bg-gray-100 text-gray-800", label: "New User" },
      poster: { color: "bg-blue-100 text-blue-800", label: "Task Poster" },
      bidder: { color: "bg-green-100 text-green-800", label: "Bidder" },
      mixed: { color: "bg-purple-100 text-purple-800", label: "Active User" },
      admin: { color: "bg-red-100 text-red-800", label: "Admin" },
      guest: { color: "bg-gray-100 text-gray-600", label: "Guest" },
    };
    return badges[userRole] || badges.guest;
  };

  const roleBadge = getRoleBadge(role);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Compact version for lists/cards
  if (compact) {
    return (
      <div
        className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow ${className}`}
      >
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${profileUser.firstName} ${profileUser.lastName}`}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-lg">
                  {initials}
                </span>
              </div>
            )}
            {verified && (
              <CheckCircle className="absolute -bottom-1 -right-1 w-4 h-4 text-green-500 bg-white rounded-full" />
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {profileUser.firstName} {profileUser.lastName}
              </h3>
              <span
                className={`px-2 py-1 text-xs rounded-full ${roleBadge.color}`}
              >
                {roleBadge.label}
              </span>
            </div>

            <div className="flex items-center space-x-4 mt-1">
              {rating.hasRating && (
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <span className="text-xs text-gray-600">
                    {rating.average.toFixed(1)} ({rating.count})
                  </span>
                </div>
              )}

              <span className="text-xs text-gray-500">
                {profileUser.college}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full profile card
  return (
    <div
      className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-24"></div>

      {/* Profile Content */}
      <div className="px-6 pb-6">
        {/* Avatar Section */}
        <div className="flex justify-between items-start -mt-12 mb-4">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${profileUser.firstName} ${profileUser.lastName}`}
                className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-blue-100 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                <span className="text-blue-600 font-bold text-2xl">
                  {initials}
                </span>
              </div>
            )}

            {/* Verification Badge */}
            {verified && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            )}

            {/* Avatar Upload/Edit (Own Profile) */}
            {isOwnProfile && (
              <div className="absolute -bottom-1 -right-1">
                <div className="flex space-x-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50"
                    title="Upload new photo"
                  >
                    {isUploading ? (
                      <Loader className="w-3 h-3 animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3" />
                    )}
                  </button>

                  {avatarUrl && (
                    <button
                      onClick={handleAvatarDelete}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Edit Profile Button */}
          {isOwnProfile && onEdit && (
            <button
              onClick={onEdit}
              className="mt-12 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Upload Error */}
        {uploadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">{uploadError}</span>
            </div>
          </div>
        )}

        {/* User Info */}
        <div className="space-y-4">
          {/* Name and Role */}
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {profileUser.firstName} {profileUser.lastName}
              </h2>
              <span
                className={`px-3 py-1 text-sm rounded-full ${roleBadge.color}`}
              >
                {roleBadge.label}
              </span>
            </div>

            {/* Rating */}
            {rating.hasRating && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(rating.average)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {rating.average.toFixed(1)} ({rating.count} reviews)
                </span>
              </div>
            )}
          </div>

          {/* Contact Info */}
          {showFullDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{profileUser.email}</span>
              </div>

              {profileUser.phone && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{profileUser.phone}</span>
                </div>
              )}

              <div className="flex items-center space-x-3 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{profileUser.college}</span>
              </div>

              <div className="flex items-center space-x-3 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Joined {formatDate(profileUser.createdAt)}
                </span>
              </div>
            </div>
          )}

          {/* Bio */}
          {profileUser.bio && showFullDetails && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                About
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {profileUser.bio}
              </p>
            </div>
          )}

          {/* Stats */}
          {showFullDetails && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-blue-600">
                    {stats.tasksPosted}
                  </div>
                  <div className="text-xs text-gray-600">Tasks Posted</div>
                </div>

                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Trophy className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-green-600">
                    {stats.tasksCompleted}
                  </div>
                  <div className="text-xs text-gray-600">Tasks Completed</div>
                </div>

                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-purple-600">
                    ₹{stats.totalEarnings.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">Total Earnings</div>
                </div>

                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <Briefcase className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-orange-600">
                    ₹{stats.totalSpent.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">Total Spent</div>
                </div>
              </div>
            </div>
          )}

          {/* Skills */}
          {profileUser.skills &&
            profileUser.skills.length > 0 &&
            showFullDetails && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profileUser.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Achievements */}
          {profileUser.achievements &&
            profileUser.achievements.length > 0 &&
            showFullDetails && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Achievements
                </h3>
                <div className="space-y-2">
                  {profileUser.achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg"
                    >
                      <Award className="w-5 h-5 text-yellow-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {achievement.title}
                        </div>
                        <div className="text-xs text-gray-600">
                          {achievement.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Last Activity */}
          {profileUser.lastLogin && showFullDetails && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-gray-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  Last active {formatDate(profileUser.lastLogin)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
