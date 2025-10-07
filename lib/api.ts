import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - Add JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface DashboardStats {
  users: number;
  orders: number;
  revenue: number;
}

// API Functions
export const authAPI = {
  login: (credentials: LoginCredentials) => 
    api.post<{ token: string; user: User }>('/api/auth/login', credentials),
  
  register: (userData: RegisterData) => 
    api.post<{ token: string; user: User }>('/api/auth/register', userData),
  
  logout: () => 
    api.post('/api/auth/logout'),
  
  getProfile: () => 
    api.get<User>('/api/auth/profile'),
};

export const dashboardAPI = {
  getStats: () => 
    api.get<DashboardStats>('/api/dashboard/stats'),
  
  getData: () => 
    api.get('/api/dashboard'),
};

export const uploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Helper to get image URL
export const getImageUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
};