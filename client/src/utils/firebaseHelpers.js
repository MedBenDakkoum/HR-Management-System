/**
 * Firebase/Firestore Helper Utilities
 * 
 * Functions to help convert Firebase data types to JavaScript types
 */

/**
 * Convert Firestore Timestamp to JavaScript Date
 * @param {Object} timestamp - Firestore Timestamp object with _seconds and _nanoseconds
 * @returns {Date|null} JavaScript Date object or null if invalid
 */
export const firestoreTimestampToDate = (timestamp) => {
  if (!timestamp) return null;
  
  // Handle Firestore Timestamp object
  if (timestamp._seconds !== undefined) {
    return new Date(timestamp._seconds * 1000);
  }
  
  // Handle already converted Date or ISO string
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
};

/**
 * Format Firestore Timestamp to localized date string
 * @param {Object} timestamp - Firestore Timestamp object
 * @param {string} locale - Locale string (default: 'en-US')
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string or 'N/A' if invalid
 */
export const formatFirestoreDate = (timestamp, locale = 'en-US', options = {}) => {
  const date = firestoreTimestampToDate(timestamp);
  
  if (!date) return 'N/A';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  try {
    return date.toLocaleDateString(locale, defaultOptions);
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Format Firestore Timestamp to localized datetime string
 * @param {Object} timestamp - Firestore Timestamp object
 * @param {string} locale - Locale string (default: 'en-US')
 * @returns {string} Formatted datetime string or 'N/A' if invalid
 */
export const formatFirestoreDateTime = (timestamp, locale = 'en-US') => {
  const date = firestoreTimestampToDate(timestamp);
  
  if (!date) return 'N/A';
  
  try {
    return date.toLocaleString(locale);
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Get time ago from Firestore Timestamp
 * @param {Object} timestamp - Firestore Timestamp object
 * @returns {string} Time ago string (e.g., "2h ago", "3d ago")
 */
export const getTimeAgo = (timestamp) => {
  const date = firestoreTimestampToDate(timestamp);
  
  if (!date) return 'N/A';
  
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // seconds
  
  if (diff < 0) return 'Just now';
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  
  return date.toLocaleDateString();
};

/**
 * Convert JavaScript Date to Firestore Timestamp format for API
 * @param {Date|string} date - JavaScript Date object or ISO string
 * @returns {string} ISO string for API
 */
export const dateToFirestoreFormat = (date) => {
  if (!date) return null;
  
  if (date instanceof Date) {
    return date.toISOString();
  }
  
  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
  }
  
  return null;
};

/**
 * Check if a Firestore Timestamp is valid
 * @param {Object} timestamp - Firestore Timestamp object
 * @returns {boolean} True if valid timestamp
 */
export const isValidFirestoreTimestamp = (timestamp) => {
  if (!timestamp) return false;
  return timestamp._seconds !== undefined && !isNaN(timestamp._seconds);
};

