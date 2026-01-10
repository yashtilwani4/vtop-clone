// API utility functions
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://vtop-bhopal.onrender.com/api';

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (without /api prefix)
 * @param {object} options - Fetch options
 * @returns {Promise} - Fetch response
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  };

  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options
    });
    
    return response;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

/**
 * Make an authenticated API request and return JSON
 * @param {string} endpoint - API endpoint (without /api prefix)
 * @param {object} options - Fetch options
 * @returns {Promise} - JSON response
 */
export const apiRequestJSON = async (endpoint, options = {}) => {
  const response = await apiRequest(endpoint, options);
  const data = await response.json();
  
  if (!response.ok) {
    // Create axios-like error for compatibility
    const error = new Error(data.message || 'API request failed');
    error.response = {
      data,
      status: response.status,
      statusText: response.statusText
    };
    throw error;
  }
  
  return data;
};

/**
 * GET request helper
 */
export const apiGet = (endpoint) => apiRequestJSON(endpoint);

/**
 * POST request helper
 */
export const apiPost = (endpoint, body) => apiRequestJSON(endpoint, {
  method: 'POST',
  body: JSON.stringify(body)
});

/**
 * PUT request helper
 */
export const apiPut = (endpoint, body) => apiRequestJSON(endpoint, {
  method: 'PUT',
  body: JSON.stringify(body)
});

/**
 * DELETE request helper
 */
export const apiDelete = (endpoint) => apiRequestJSON(endpoint, {
  method: 'DELETE'
});

// Axios-like API object for compatibility with existing AuthContext
const api = {
  defaults: {
    headers: {
      common: {}
    }
  },
  
  get: async (endpoint) => {
    const data = await apiGet(endpoint);
    return { data };
  },
  
  post: async (endpoint, body) => {
    const data = await apiPost(endpoint, body);
    return { data };
  },
  
  put: async (endpoint, body) => {
    const data = await apiPut(endpoint, body);
    return { data };
  },
  
  delete: async (endpoint) => {
    const data = await apiDelete(endpoint);
    return { data };
  }
};

export default api;