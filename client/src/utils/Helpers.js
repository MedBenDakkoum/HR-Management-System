// src/utils/helpers.js

/**
 * Convert Firestore Timestamp to JavaScript Date
 * @param {Object|Date|string|number} timestamp - Various date formats
 * @returns {Date|null} JavaScript Date object or null if invalid
 */
const convertToDate = (timestamp) => {
  if (!timestamp) return null;
  
  // Handle Firestore Timestamp object
  if (timestamp._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000);
  }
  
  // Handle already converted Date
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // Handle string or number
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
};

export const formatDate = (date, format = "long") => {
  if (!date) return "N/A";
  
  const d = convertToDate(date);
  if (!d) return "N/A";
  
  if (format === "short") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = convertToDate(startDate);
  const end = convertToDate(endDate);
  
  if (!start || !end) return 0;
  
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

export const getStatusColor = (status) => {
  switch (status) {
    case "approved":
      return "#10b981";
    case "rejected":
      return "#ef4444";
    case "pending":
    default:
      return "#f59e0b";
  }
};
