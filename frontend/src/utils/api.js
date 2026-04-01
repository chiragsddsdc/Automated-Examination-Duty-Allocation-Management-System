// src/utils/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost/exam-duty/backend/api',
  withCredentials: true,
});

// Attach token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  login: (email, password) => API.post('/auth.php?action=login', { email, password }),
  logout: () => API.post('/auth.php?action=logout'),
  me: () => API.get('/auth.php?action=me'),
  changePassword: (old_password, new_password) => API.post('/auth.php?action=change_password', { old_password, new_password }),
  forgotPassword: (email) => API.post('/auth.php?action=forgot_password', { email }),
  resetPassword: (email, otp, new_password) => API.post('/auth.php?action=reset_password', { email, otp, new_password }),
};

export const faculty = {
  getAll: () => API.get('/faculty.php'),
  getOne: (id) => API.get(`/faculty.php?id=${id}`),
  create: (data) => API.post('/faculty.php', data),
  update: (data) => API.put('/faculty.php', data),
  delete: (id) => API.delete(`/faculty.php?id=${id}`),
};

export const schedules = {
  getAll: () => API.get('/schedules.php'),
  create: (data) => API.post('/schedules.php', data),
  update: (data) => API.put('/schedules.php', data),
  delete: (id) => API.delete(`/schedules.php?id=${id}`),
};

export const allocations = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return API.get(`/allocate.php${q ? '?' + q : ''}`);
  },
  run: (data) => API.post('/allocate.php', data),
  update: (data) => API.put('/allocate.php', data),
  delete: (id) => API.delete(`/allocate.php?id=${id}`),
};

export const availability = {
  get: (faculty_id) => API.get(`/availability.php?faculty_id=${faculty_id}`),
  save: (data) => API.post('/availability.php', data),
  delete: (id) => API.delete(`/availability.php?id=${id}`),
};

export const notifications = {
  get: () => API.get('/notifications.php'),
  markRead: (id) => API.put('/notifications.php', { id }),
  markAll: () => API.put('/notifications.php', { mark_all: true }),
};

export const dashboard = {
  get: () => API.get('/dashboard.php'),
};

export const importSchedules = {
  upload: (formData) => API.post('/import.php', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export default API;
