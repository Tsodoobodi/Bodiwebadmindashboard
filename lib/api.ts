import axios from 'axios';

const api = axios.create({
  baseURL: 'https://bodi-web-backend-bzf7bnh6csbvf0cp.eastasia-01.azurewebsites.net' // ⬅️ Backend URL
});

// Request interceptor - бүх request-д token нэмэх
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - 401 алдаанд автоматаар login руу шилжих
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;