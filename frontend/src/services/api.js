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
  getMyInstitution: () => api.get('/student/my-institution'),
  leaveInstitution: () => api.delete('/student/leave-institution'),
  getInvitations: () => api.get('/student/invitations'),
  respondToInvitation: (invitationId, response) =>
    api.post(`/student/invitation/${invitationId}/respond`, { response }),
};

// ============================================
// TEACHER APIs
// ============================================
export const teacherAPI = {
  getProfile: () => api.get('/teacher/me'),
  getMyInstitution: () => api.get('/teacher/my-institution'),
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
  getUsers: (institutionId, params) =>
    api.get(`/admin/institutions/${institutionId}/users`, { params }),

  getStudents: () => api.get('/admin/students'),
  getTeachers: () => api.get('/admin/teachers'),
  getPendingRequests: () => api.get('/admin/pending-requests'),
  deleteStudent: (studentId) => api.delete(`/admin/students/${studentId}`),
  deleteTeacher: (teacherId) => api.delete(`/admin/teachers/${teacherId}`),
  addUser: (userData) => api.post('/admin/add-user', userData),
  bulkUpload: (formData) => api.post('/admin/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  bulkAddUsers: (institutionId, usersData) => api.post(`/admin/institutions/${institutionId}/users/bulk`, usersData),
  deleteUser: (userId) => api.delete(`/admin/user/${userId}`),
  updateUser: (userId, userData) => api.put(`/admin/user/${userId}`, userData),

  // Institution Management
  getInstitution: () => api.get('/admin/institution'),

  // Admin Management APIs
  addAdmin: (adminData) => api.post('/admin/add-admin', adminData),
  getAllAdmins: () => api.get('/admin/admins'),
  updateAdminPermissions: (adminId, permissions) => api.put(`/admin/admins/${adminId}/permissions`, { permissions }),
  removeAdmin: (adminId) => api.delete(`/admin/admins/${adminId}`),
};

// ============================================
// INSTITUTION APIs
// ============================================
// INSTITUTION APIs
// ============================================
export const institutionAPI = {
  browse: () => api.get('/institutions/browse'),
  getBySlug: (slug) => api.get(`/institutions/slug/${slug}`),
  getCourses: (slug) => api.get(`/institutions/slug/${slug}/courses`),
  getCourseDetails: (slug, courseCode) => api.get(`/institutions/slug/${slug}/courses/${courseCode}`),
  getById: (id) => api.get(`/institutions/${id}`),
  create: (data) => api.post('/institutions', data),
  update: (data) => api.put('/institutions/update', data),
  delete: (id) => api.delete(`/institutions/${id}`),
  join: (id) => api.post(`/institutions/${id}/join`),
  leave: (id) => api.post(`/institutions/${id}/leave`),
  search: (query) => api.get('/institutions/search', { params: { q: query } }),
};

// ============================================
// INVITATION APIs
// ============================================
// ============================================
// INVITATION APIs
// ============================================
export const invitationAPI = {
  getAll: (status) => api.get('/invitations', { params: { status } }),
  create: (data) => api.post('/invitations', data),
  accept: (id) => api.post(`/invitations/${id}/accept`),
  reject: (id) => api.post(`/invitations/${id}/reject`),
  delete: (id) => api.delete(`/invitations/${id}`),
  bulkInviteUsers: (data) => api.post('/invitations/bulk', data),
};


// ============================================
// ADMIN INVITATION APIs
// ============================================
export const adminInvitationAPI = {
  getAll: (status) =>
    api.get('/invitations/admin', {
      params: status ? { status } : {},
    }),

  getPending: () =>
    api.get('/invitations/admin', {
      params: { status: 'pending' },
    }),

  cancel: (invitationId) =>
    api.delete(`/invitations/${invitationId}`),
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

// ============================================
// ANNOUNCEMENT APIs
// ============================================
export const announcementAPI = {
  getAll: (institutionId, params) => api.get(`/announcements/${institutionId}`, { params }),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
  markAsViewed: (id) => api.post(`/announcements/${id}/view`),
};

// ============================================
// USER MANAGEMENT APIs
// ============================================
export const userManagementAPI = {
  getAll: (institutionId, params) => api.get(`/admin/institutions/${institutionId}/users`, { params }),
  add: (institutionId, data) => api.post(`/admin/institutions/${institutionId}/users`, data),
  update: (userId, data) => api.put(`/admin/users/${userId}`, data),
  removeFromInstitution: (userId, role) =>
    api.patch(`/admin/users/${userId}/${role}/remove`),

  deletePermanently: (userId, role) =>
    api.delete(`/admin/users/${userId}/${role}`),

  toggleStatus: (userId, role) => api.patch(`/admin/users/${userId}/${role}/status`),
};

// ============================================
// ACADEMIC STRUCTURE APIs
// ============================================
export const academicAPI = {
  // Departments
  getDepartments: (institutionId) => api.get(`/academic/institutions/${institutionId}/departments`),
  createDepartment: (institutionId, data) => api.post(`/academic/institutions/${institutionId}/departments`, data),
  updateDepartment: (departmentId, data) => api.put(`/academic/departments/${departmentId}`, data),
  deleteDepartment: (departmentId) => api.delete(`/academic/departments/${departmentId}`),

  // Courses
  getCourses: (institutionId, params) => api.get(`/academic/institutions/${institutionId}/courses`, { params }),
  createCourse: (institutionId, data) => api.post(`/academic/institutions/${institutionId}/courses`, data),
  updateCourse: (courseId, data) => api.put(`/academic/courses/${courseId}`, data),
  deleteCourse: (courseId) => api.delete(`/academic/courses/${courseId}`),

  // Semesters
  getSemesters: (institutionId) => api.get(`/academic/institutions/${institutionId}/semesters`),
  createSemester: (institutionId, data) => api.post(`/academic/institutions/${institutionId}/semesters`, data),
  updateSemester: (semesterId, data) => api.put(`/academic/semesters/${semesterId}`, data),
  deleteSemester: (semesterId) => api.delete(`/academic/semesters/${semesterId}`),

  // Academic Calendar
  getCalendarEvents: (institutionId, params) => api.get(`/academic/institutions/${institutionId}/calendar`, { params }),
  createCalendarEvent: (institutionId, data) => api.post(`/academic/institutions/${institutionId}/calendar`, data),
  updateCalendarEvent: (eventId, data) => api.put(`/academic/calendar/${eventId}`, data),
  deleteCalendarEvent: (eventId) => api.delete(`/academic/calendar/${eventId}`),

  // Faculty
  getFaculty: (institutionId, params) => api.get(`/academic/institutions/${institutionId}/faculty`, { params }),
};

export default api;
