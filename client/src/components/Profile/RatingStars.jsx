// client/src/components/Profile/RatingStars.jsx
import React, { useState } from "react";
import { Star } from "lucide-react";

const RatingStars = ({
  rating = 0,
  maxRating = 5,
  size = "md",
  interactive = false,
  showValue = false,
  showCount = false,
  count = 0,
  onChange = null,
  disabled = false,
  precision = "full", // "full" | "half" | "decimal"
  className = "",
  starClassName = "",
  emptyColor = "text-gray-300",
  fillColor = "text-yellow-400",
  hoverColor = "text-yellow-300",
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [tempRating, setTempRating] = useState(rating);

  // Size configurations
  const sizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  const starSize = sizes[size] || sizes.md;

  // Handle star click
  const handleStarClick = (value) => {
    if (!interactive || disabled) return;

    setTempRating(value);
    if (onChange) {
      onChange(value);
    }
  };

  // Handle star hover
  const handleStarHover = (value) => {
    if (!interactive || disabled) return;
    setHoverRating(value);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (!interactive || disabled) return;
    setHoverRating(0);
  };

  // Calculate star fill based on rating and precision
  const getStarFill = (starIndex) => {
    const currentRating = interactive ? hoverRating || tempRating : rating;
    const starValue = starIndex + 1;

    if (precision === "full") {
      return currentRating >= starValue ? "full" : "empty";
    } else if (precision === "half") {
      if (currentRating >= starValue) return "full";
      if (currentRating >= starValue - 0.5) return "half";
      return "empty";
    } else if (precision === "decimal") {
      if (currentRating >= starValue) return "full";
      if (currentRating > starValue - 1) {
        const fillPercentage = (currentRating - (starValue - 1)) * 100;
        return `${fillPercentage}%`;
      }
      return "empty";
    }

    return "empty";
  };

  // Get star color based on state
  const getStarColor = (starIndex, fill) => {
    const starValue = starIndex + 1;
    const currentRating = interactive ? hoverRating || tempRating : rating;

    if (interactive && !disabled) {
      if (hoverRating > 0) {
        return hoverRating >= starValue ? hoverColor : emptyColor;
      }
      return currentRating >= starValue ? fillColor : emptyColor;
    }

    return fill !== "empty" ? fillColor : emptyColor;
  };

  // Format rating value for display
  const formatRating = (value) => {
    if (precision === "full") {
      return Math.round(value);
    } else if (precision === "half") {
      return Math.round(value * 2) / 2;
    }
    return value.toFixed(1);
  };

  // Render star with partial fill support
  const renderStar = (starIndex) => {
    const fill = getStarFill(starIndex);
    const starValue = starIndex + 1;
    const color = getStarColor(starIndex, fill);

    const starProps = {
      className: `${starSize} ${color} ${starClassName} ${
        interactive && !disabled ? "cursor-pointer" : ""
      } transition-colors duration-150`,
      onClick: () => handleStarClick(starValue),
      onMouseEnter: () => handleStarHover(starValue),
      key: starIndex,
    };

    if (
      precision === "decimal" &&
      typeof fill === "string" &&
      fill.includes("%")
    ) {
      // Render partial fill using gradient
      const fillPercentage = parseFloat(fill);
      const gradientId = `star-gradient-${starIndex}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      return (
        <div key={starIndex} className="relative inline-block">
          <svg
            {...starProps}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <defs>
              <linearGradient id={gradientId}>
                <stop
                  offset={`${fillPercentage}%`}
                  stopColor="currentColor"
                  stopOpacity="1"
                />
                <stop
                  offset={`${fillPercentage}%`}
                  stopColor="currentColor"
                  stopOpacity="0.3"
                />
              </linearGradient>
            </defs>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              fill={`url(#${gradientId})`}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </div>
      );
    } else if (fill === "half") {
      // Render half-filled star
      return (
        <div key={starIndex} className="relative inline-block">
          <Star
            {...starProps}
            className={`${starSize} ${emptyColor} ${starClassName} ${
              interactive && !disabled ? "cursor-pointer" : ""
            } transition-colors duration-150`}
          />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: "50%" }}
          >
            <Star
              {...starProps}
              className={`${starSize} ${fillColor} ${starClassName} ${
                interactive && !disabled ? "cursor-pointer" : ""
              } transition-colors duration-150 fill-current`}
            />
          </div>
        </div>
      );
    } else {
      // Render full or empty star
      return (
        <Star
          {...starProps}
          className={`${starProps.className} ${
            fill === "full" ? "fill-current" : ""
          }`}
        />
      );
    }
  };

  return (
    <div
      className={`inline-flex items-center space-x-1 ${className}`}
      onMouseLeave={handleMouseLeave}
    >
      {/* Stars */}
      <div className="flex items-center space-x-0.5">
        {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
      </div>

      {/* Rating Value */}
      {showValue && (
        <span className="text-sm text-gray-600 ml-2">
          {formatRating(interactive ? tempRating || rating : rating)}
        </span>
      )}

      {/* Review Count */}
      {showCount && count > 0 && (
        <span className="text-sm text-gray-500 ml-1">
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
};

// Preset component variants
export const ReadOnlyStars = ({ rating, count, ...props }) => (
  <RatingStars
    rating={rating}
    interactive={false}
    showValue={true}
    showCount={true}
    count={count}
    precision="decimal"
    {...props}
  />
);

export const InteractiveStars = ({ rating, onChange, ...props }) => (
  <RatingStars
    rating={rating}
    interactive={true}
    onChange={onChange}
    precision="full"
    showValue={true}
    {...props}
  />
);

export const CompactStars = ({ rating, count, ...props }) => (
  <RatingStars
    rating={rating}
    size="sm"
    interactive={false}
    showCount={true}
    count={count}
    precision="decimal"
    {...props}
  />
);

export const LargeStars = ({ rating, onChange, ...props }) => (
  <RatingStars
    rating={rating}
    size="xl"
    interactive={!!onChange}
    onChange={onChange}
    showValue={true}
    precision="full"
    {...props}
  />
);

// Quick rating display component
export const QuickRating = ({ rating, count, size = "sm", className = "" }) => {
  if (!rating || rating === 0) {
    return (
      <span className={`text-gray-400 text-sm ${className}`}>
        No ratings yet
      </span>
    );
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <Star
        className={`${sizes[size] || sizes.sm} text-yellow-400 fill-current`}
      />
      <span className="text-sm font-medium text-gray-900">
        {rating.toFixed(1)}
      </span>
      {count > 0 && <span className="text-sm text-gray-500">({count})</span>}
    </div>
  );
};

// Rating input component with labels
export const RatingInput = ({
  value,
  onChange,
  label = "Rate this",
  required = false,
  error = "",
  className = "",
}) => {
  const [touched, setTouched] = useState(false);

  const handleChange = (newRating) => {
    setTouched(true);
    if (onChange) {
      onChange(newRating);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <InteractiveStars rating={value} onChange={handleChange} size="lg" />

      {error && touched && <p className="text-sm text-red-600">{error}</p>}

      {value > 0 && (
        <p className="text-sm text-gray-600">
          {value === 1 && "Poor"}
          {value === 2 && "Fair"}
          {value === 3 && "Good"}
          {value === 4 && "Very Good"}
          {value === 5 && "Excellent"}
        </p>
      )}
    </div>
  );
};

// Rating summary component
export const RatingSummary = ({
  averageRating,
  totalReviews,
  ratingBreakdown = {},
  className = "",
}) => {
  const maxRating = 5;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Rating */}
      <div className="text-center">
        <div className="text-4xl font-bold text-gray-900 mb-2">
          {averageRating.toFixed(1)}
        </div>
        <ReadOnlyStars rating={averageRating} count={totalReviews} size="lg" />
      </div>

      {/* Rating Breakdown */}
      {Object.keys(ratingBreakdown).length > 0 && (
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingBreakdown[rating] || 0;
            const percentage =
              totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
              <div key={rating} className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 w-12">
                  {rating} star
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RatingStars;
