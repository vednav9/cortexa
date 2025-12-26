import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
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

// ============================================
// AUTH APIs
// ============================================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
};

// ============================================
// STUDENT APIs
// ============================================
export const studentAPI = {
  getProfile: () => api.get('/student/me'),
  getInstitutions: () => api.get('/student/institutions'),
  leaveInstitution: (institutionId) => api.delete(`/student/institutions/${institutionId}`),
  joinInstitution: (institutionId) => api.post('/student/join-institution', { institutionId }),
  getInvitations: () => api.get('/student/invitations'),
  respondToInvitation: (invitationId, response) => 
    api.post(`/student/invitation/${invitationId}/respond`, { response }),
};

// ============================================
// TEACHER APIs
// ============================================
export const teacherAPI = {
  getProfile: () => api.get('/teacher/me'),
  getInstitutions: () => api.get('/teacher/institutions'),
  leaveInstitution: (institutionId) => api.delete(`/teacher/institutions/${institutionId}`),
  getStudents: (institutionId) => api.get(`/teacher/students/${institutionId}`),
  getCourses: (institutionId) => api.get(`/teacher/courses/${institutionId}`),
  sendInvitation: (data) => api.post('/teacher/send-invitation', data),
};

// ============================================
// ADMIN APIs
// ============================================
export const adminAPI = {
  getProfile: () => api.get('/admin/me'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getStudents: () => api.get('/admin/students'),
  getTeachers: () => api.get('/admin/teachers'),
  deleteStudent: (studentId) => api.delete(`/admin/students/${studentId}`),
  deleteTeacher: (teacherId) => api.delete(`/admin/teachers/${teacherId}`),
  addUser: (userData) => api.post('/admin/add-user', userData),
  bulkUpload: (formData) => api.post('/admin/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteUser: (userId) => api.delete(`/admin/user/${userId}`),
  updateUser: (userId, userData) => api.put(`/admin/user/${userId}`, userData),
};

// ============================================
// INSTITUTION APIs
// ============================================
export const institutionAPI = {
  browse: () => api.get('/institutions/browse'),
  getAll: (params) => api.get('/institutions', { params }),
  getById: (id) => api.get(`/institutions/${id}`),
  create: (data) => api.post('/institutions', data),
  update: (id, data) => api.put(`/institutions/${id}`, data),
  delete: (id) => api.delete(`/institutions/${id}`),
  join: (id) => api.post(`/institutions/${id}/join`),
  leave: (id) => api.post(`/institutions/${id}/leave`),
  search: (query) => api.get('/institutions/search', { params: { q: query } }),
};

// ============================================
// INVITATION APIs
// ============================================
export const invitationAPI = {
  getAll: (status) => api.get('/invitations', { params: { status } }),
  create: (data) => api.post('/invitations', data),
  accept: (id) => api.post(`/invitations/${id}/accept`),
  reject: (id) => api.post(`/invitations/${id}/reject`),
  delete: (id) => api.delete(`/invitations/${id}`),
};

// ============================================
// NOTIFICATION APIs (Legacy - uses invitations)
// ============================================
export const notificationAPI = {
  getAll: () => invitationAPI.getAll(),
  accept: (id) => invitationAPI.accept(id),
  reject: (id) => invitationAPI.reject(id),
  delete: (id) => invitationAPI.delete(id),
};

export default api;
