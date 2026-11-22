/**
 * api.service.js
 * ───────────────
 * Axios instance + all service modules.
 * TOKEN: auto-attached from localStorage via request interceptor.
 * 401: auto-logout via response interceptor.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// ── Attach JWT ─────────────────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// ── Global 401 handler ─────────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute = err.config?.url?.includes('/auth/');
    if (err.response?.status === 401 && !isAuthRoute && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ───────────────────────────────────────────────────────────────────────
export const authService = {
  register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  getMe:          ()     => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ── Users ──────────────────────────────────────────────────────────────────────
export const userService = {
  getAll:       (params)   => api.get('/users', { params }),
  getById:      (id)       => api.get(`/users/${id}`),
  update:       (id, data) => api.put(`/users/${id}`, data),
  delete:       (id)       => api.delete(`/users/${id}`),
  toggleStatus: (id)       => api.patch(`/users/${id}/toggle-status`),
};

// ── Students ───────────────────────────────────────────────────────────────────
export const studentService = {
  getAll:         (params)   => api.get('/students', { params }),
  getById:        (id)       => api.get(`/students/${id}`),
  getMyProfile:   ()         => api.get('/students/me'),
  updateProfile:  (data)     => api.put('/students/me', data),

  // Legacy FormData route (kept for compatibility)
  registerFace: (formData) =>
    api.post('/students/register-face', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Preferred: plain JSON — avoids FormData string-parse bugs
  registerFaceJSON: (payload) => api.post('/students/register-face-json', payload),

  // All 128-dim descriptors for face matching
  getAllDescriptors: () => api.get('/students/face-descriptors'),
};

// ── Attendance ─────────────────────────────────────────────────────────────────
export const attendanceService = {
  mark:         (data)              => api.post('/attendance/mark', data),

  // Teacher marks multiple students manually (Present / Absent / Late + remarks)
  markManual:   (data)              => api.post('/attendance/mark-manual', data),

  getMy:        (params)            => api.get('/attendance/my', { params }),
  getAll:       (params)            => api.get('/attendance/all', { params }),
  getByStudent: (id, params)        => api.get(`/attendance/student/${id}`, { params }),
  getByClass:   (classId, params)   => api.get(`/attendance/class/${classId}`, { params }),
  update:       (id, data)          => api.put(`/attendance/${id}`, data),
  delete:       (id)                => api.delete(`/attendance/${id}`),

  // Export — returns JSON rows + triggers server-side CSV save
  export: (params) => api.get('/attendance/export', { params }),
};

// ── Classes ────────────────────────────────────────────────────────────────────
export const classService = {
  getAll:  (params)   => api.get('/classes', { params }),
  getMy:   ()         => api.get('/classes/my'),
  getById: (id)       => api.get(`/classes/${id}`),
  create:  (data)     => api.post('/classes', data),
  update:  (id, data) => api.put(`/classes/${id}`, data),
  delete:  (id)       => api.delete(`/classes/${id}`),
  join:    (data)     => api.post('/classes/join', data),
};

// ── Timetable service ────────────────────────────────────────────────────────
export const timetableService = {
  getToday:       ()       => api.get('/timetable/today'),
  getWeek:        ()       => api.get('/timetable/week'),
  getByClass:     (id)     => api.get(`/timetable/class/${id}`),
  checkActive:    (classId)=> api.get(`/timetable/check-active?classId=${classId}`),
  create:         (data)   => api.post('/timetable', data),
  update:         (id, data)=> api.put(`/timetable/${id}`, data),
  remove:         (id)     => api.delete(`/timetable/${id}`),
};

// ── Study Materials ────────────────────────────────────────────────────────────
export const studyMaterialService = {
  upload: (data) => api.post('/materials', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getByClass: (classId) => api.get(`/materials/class/${classId}`),
  delete: (id) => api.delete(`/materials/${id}`),
};

export const chatService = {
  sendMessage: (message) => api.post('/chat', { message }),
};

export default api;
