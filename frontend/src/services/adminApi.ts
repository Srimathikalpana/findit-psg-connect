import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

// Create axios instance with default config
const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Admin authentication - FIXED: Use adminApi instead of raw axios
export const adminLogin = async (email: string, password: string) => {
  const response = await adminApi.post('/admin/login', {
    email,
    password,
  });
  return response.data;
};

// Dashboard statistics
export const getDashboardStats = async () => {
  const response = await adminApi.get('/admin/stats');
  return response.data;
};

// Lost items management
export const getLostItems = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
}) => {
  const response = await adminApi.get('/admin/lost-items', { params });
  return response.data;
};

// Found items management
export const getFoundItems = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
}) => {
  const response = await adminApi.get('/admin/found-items', { params });
  return response.data;
};

// Users management
export const getUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}) => {
  const response = await adminApi.get('/admin/users', { params });
  return response.data;
};

// Update item status
export const updateItemStatus = async (itemId: string, status: string) => {
  const response = await adminApi.put(`/admin/items/${itemId}/status`, { status });
  return response.data;
};

// Delete item
export const deleteItem = async (itemId: string) => {
  const response = await adminApi.delete(`/admin/items/${itemId}`);
  return response.data;
};

// Update user role
export const updateUserRole = async (userId: string, role: string) => {
  const response = await adminApi.put(`/admin/users/${userId}/role`, { role });
  return response.data;
};

// Get user by ID
export const getUserById = async (userId: string) => {
  const response = await adminApi.get(`/admin/users/${userId}`);
  return response.data;
};

// Delete user
export const deleteUser = async (userId: string) => {
  const response = await adminApi.delete(`/admin/users/${userId}`);
  return response.data;
};

// Utility functions
export const setAdminToken = (token: string) => {
  localStorage.setItem('adminToken', token);
};

export const getAdminToken = () => {
  return localStorage.getItem('adminToken');
};

export const removeAdminToken = () => {
  localStorage.removeItem('adminToken');
};

export const isAdminAuthenticated = () => {
  return !!getAdminToken();
};