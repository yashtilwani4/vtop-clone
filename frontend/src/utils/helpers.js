import { format, parseISO, isValid } from 'date-fns';

// Date formatting utilities
export const formatDate = (date, formatString = 'MMM dd, yyyy') => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) ? format(dateObj, formatString) : '';
  } catch (error) {
    return '';
  }
};

export const formatDateTime = (date) => {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
};

export const formatTime = (time) => {
  if (!time) return '';
  
  try {
    // Handle time strings like "09:00" or "14:30"
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch (error) {
    return time;
  }
};

// Grade utilities
export const getGradeColor = (grade) => {
  const gradeColors = {
    'S': 'text-green-600 bg-green-100',
    'A': 'text-green-600 bg-green-100',
    'B': 'text-blue-600 bg-blue-100',
    'C': 'text-yellow-600 bg-yellow-100',
    'D': 'text-orange-600 bg-orange-100',
    'E': 'text-red-600 bg-red-100',
    'F': 'text-red-600 bg-red-100',
    'P': 'text-green-600 bg-green-100', // Pass
    'I': 'text-gray-600 bg-gray-100',   // Incomplete
    'W': 'text-gray-600 bg-gray-100'    // Withdrawn
  };
  
  return gradeColors[grade] || 'text-gray-600 bg-gray-100';
};

export const getGradePoints = (grade) => {
  const gradePoints = {
    'S': 10,
    'A': 9,
    'B': 8,
    'C': 7,
    'D': 6,
    'E': 5,
    'F': 0,
    'P': 0, // Pass (no grade points)
    'I': 0, // Incomplete
    'W': 0  // Withdrawn
  };
  
  return gradePoints[grade] || 0;
};

export const calculateGPA = (results) => {
  if (!results || results.length === 0) return 0;
  
  let totalCredits = 0;
  let totalGradePoints = 0;
  
  results.forEach(result => {
    const credits = result.credits?.C || result.credits || 0;
    const gradePoints = getGradePoints(result.grade);
    
    // Only include graded courses (not P/F courses)
    if (result.grade !== 'P' && result.grade !== 'I' && result.grade !== 'W') {
      totalCredits += credits;
      totalGradePoints += (gradePoints * credits);
    }
  });
  
  return totalCredits > 0 ? (totalGradePoints / totalCredits) : 0;
};

export const getAttendanceColor = (percentage) => {
  if (percentage >= 90) return 'text-green-600 bg-green-100';
  if (percentage >= 80) return 'text-blue-600 bg-blue-100';
  if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

// Status utilities
export const getStatusColor = (status) => {
  const statusColors = {
    'Present': 'text-green-600 bg-green-100',
    'Absent': 'text-red-600 bg-red-100',
    'Late': 'text-yellow-600 bg-yellow-100',
    'Enrolled': 'text-blue-600 bg-blue-100',
    'Dropped': 'text-red-600 bg-red-100',
    'Completed': 'text-green-600 bg-green-100',
    'In Progress': 'text-blue-600 bg-blue-100',
    'Failed': 'text-red-600 bg-red-100',
    'Active': 'text-green-600 bg-green-100',
    'Inactive': 'text-gray-600 bg-gray-100'
  };
  
  return statusColors[status] || 'text-gray-600 bg-gray-100';
};

// Priority utilities
export const getPriorityColor = (priority) => {
  const priorityColors = {
    'Low': 'text-gray-600 bg-gray-100',
    'Medium': 'text-blue-600 bg-blue-100',
    'High': 'text-orange-600 bg-orange-100',
    'Urgent': 'text-red-600 bg-red-100'
  };
  
  return priorityColors[priority] || 'text-gray-600 bg-gray-100';
};

// Text utilities
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatName = (firstName, lastName) => {
  return `${firstName || ''} ${lastName || ''}`.trim();
};

// Number utilities
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  return `${Number(value).toFixed(decimals)}%`;
};

export const formatGPA = (value, decimals = 2) => {
  if (value === null || value === undefined) return '0.00';
  return Number(value).toFixed(decimals);
};

// Validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number format
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

export const validatePassword = (password) => {
  // At least 6 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
  return passwordRegex.test(password);
};

// Array utilities
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (direction === 'desc') {
      return bVal > aVal ? 1 : -1;
    }
    return aVal > bVal ? 1 : -1;
  });
};

// Local storage utilities
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

export const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
};

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
};

// URL utilities
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value);
    }
  });
  
  return searchParams.toString();
};

// File utilities
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

// Debounce utility
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};