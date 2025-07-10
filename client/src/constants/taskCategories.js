// client/src/constants/taskCategories.js

export const TASK_CATEGORIES = [
  {
    value: "Academic",
    label: "Academic",
    description: "Homework, research, assignments, tutoring",
    icon: "📚",
    color: "bg-blue-100 text-blue-800",
    examples: [
      "Essay writing",
      "Math problems",
      "Research assistance",
      "Presentation creation",
    ],
  },
  {
    value: "Campus Life",
    label: "Campus Life",
    description: "Dorm help, errands, campus activities",
    icon: "🏫",
    color: "bg-green-100 text-green-800",
    examples: [
      "Moving furniture",
      "Package pickup",
      "Event attendance",
      "Room decoration",
    ],
  },
  {
    value: "Tech Help",
    label: "Tech Help",
    description: "Programming, web design, tech support",
    icon: "💻",
    color: "bg-purple-100 text-purple-800",
    examples: [
      "Code debugging",
      "Website creation",
      "App development",
      "Tech troubleshooting",
    ],
  },
  {
    value: "Personal",
    label: "Personal",
    description: "Personal tasks, shopping, services",
    icon: "👤",
    color: "bg-yellow-100 text-yellow-800",
    examples: [
      "Shopping assistance",
      "Personal errands",
      "Skill teaching",
      "Consultation",
    ],
  },
  {
    value: "Other",
    label: "Other",
    description: "Miscellaneous tasks and services",
    icon: "📝",
    color: "bg-gray-100 text-gray-800",
    examples: [
      "Custom requests",
      "Creative projects",
      "Unique services",
      "Special tasks",
    ],
  },
];

export const CATEGORY_OPTIONS = TASK_CATEGORIES.map((cat) => ({
  value: cat.value,
  label: cat.label,
}));

export const getCategoryByValue = (value) => {
  return (
    TASK_CATEGORIES.find((category) => category.value === value) ||
    TASK_CATEGORIES[4]
  ); // Default to 'Other'
};

export const getCategoryIcon = (value) => {
  const category = getCategoryByValue(value);
  return category.icon;
};

export const getCategoryColor = (value) => {
  const category = getCategoryByValue(value);
  return category.color;
};

export const getCategoryDescription = (value) => {
  const category = getCategoryByValue(value);
  return category.description;
};

export const getCategoryExamples = (value) => {
  const category = getCategoryByValue(value);
  return category.examples;
};

// Popular categories for quick filters
export const POPULAR_CATEGORIES = ["Academic", "Tech Help", "Campus Life"];

// Category suggestions based on user behavior
export const getCategorySuggestions = (userStats = {}) => {
  const { mostUsedCategories = [], recentCategories = [] } = userStats;

  // Combine recent and most used, removing duplicates
  const suggestions = [
    ...new Set([...recentCategories, ...mostUsedCategories]),
  ];

  // If no history, return popular categories
  if (suggestions.length === 0) {
    return POPULAR_CATEGORIES;
  }

  return suggestions.slice(0, 3);
};

export default TASK_CATEGORIES;
