// API Service - Axios wrapper
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

const getAuthStorageKey = (baseKey) => {
  const path = window.location.pathname;
  if (path.startsWith('/staff') || path.startsWith('/admin') || path.startsWith('/doctor') || path.startsWith('/accountant')) {
    return `portal_${baseKey}`;
  }
  return baseKey;
};

// Interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(getAuthStorageKey('token'));
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to auto-handle locked accounts or expired tokens (401/403)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const prefix = (window.location.pathname.startsWith('/staff') || window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/doctor') || window.location.pathname.startsWith('/accountant')) ? 'portal_' : '';
      localStorage.removeItem(`${prefix}token`);
      localStorage.removeItem(`${prefix}userRole`);
      localStorage.removeItem(`${prefix}userName`);
      localStorage.removeItem(`${prefix}userDisplayName`);
      if (window.location.pathname !== '/' || !window.location.search.includes('login=true')) {
        window.location.href = '/?login=true';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) =>
    apiClient.post('/auth/login', { username, password }),
  register: (data) =>
    apiClient.post('/auth/register', data),
  me: () =>
    apiClient.get('/auth/me'),
  logout: () =>
    apiClient.post('/auth/logout'),
  impersonate: (userId) =>
    apiClient.post(`/auth/impersonate/${userId}`),
  // New methods for password recovery
  forgotPassword: (phone) =>
    apiClient.post('/auth/forgotPassword', { phone }),
  verifyOtp: (phone, code) =>
    apiClient.post('/auth/verifyOtp', { phone, code }),
  resetPassword: (phone, code, newPassword) =>
    apiClient.post('/auth/resetPassword', { phone, code, newPassword }),
};

// Profiles API
export const profilesAPI = {
  getUsers: () => apiClient.get('/profiles/users'),
  getUser: (id) => apiClient.get(`/profiles/users/${id}`),
  getDoctor: (id) => apiClient.get(`/profiles/doctors/${id}`),
  updateUser: (id, data) =>
    apiClient.put(`/profiles/profile/${id}`, data),
  getPatients: () => apiClient.get('/profiles/patients'),
  createPatientByStaff: (data) => apiClient.post('/profiles/patients', data),
  getMyPatientProfile: () => apiClient.get('/profiles/patient/me'),
  createMyPatientProfile: (data) => apiClient.post('/profiles/patient/me', data),
  updateMyPatientProfile: (data) => apiClient.put('/profiles/patient/me', data),
  getSubAccounts: () => apiClient.get('/profiles/patient/subaccounts'),
  createSubAccount: (data) => apiClient.post('/profiles/patient/subaccounts', data),
  updateSubAccount: (id, data) => apiClient.put(`/profiles/patient/subaccounts/${id}`, data),
  deleteSubAccount: (id) => apiClient.delete(`/profiles/patient/subaccounts/${id}`),
  createUser: (data) => apiClient.post('/profiles/users', data),
  getAdminStats: () => apiClient.get('/profiles/admin/stats'),
  queryClinicAI: (query) => apiClient.post('/profiles/admin/ai-query', { query }),
  editUserAdmin: (id, data) => apiClient.put(`/profiles/admin/users/${id}`, data),
  deleteUserAdmin: (id) => apiClient.delete(`/profiles/admin/users/${id}`),
  deleteAppointmentAdmin: (id) => apiClient.delete(`/profiles/admin/appointments/${id}`),
  updateTimelineStepAdmin: (data) => apiClient.put('/profiles/admin/timeline/step', data),
  getNotifications: () => apiClient.get('/profiles/notifications'),
  markNotificationRead: (id) => apiClient.put(`/profiles/notifications/${id}/read`),
  markAllNotificationsRead: () => apiClient.put('/profiles/notifications/read-all'),
};

// Scheduling API
export const schedulingAPI = {
  getDepartments: () =>
    apiClient.get('/scheduling/departments'),
  createDepartment: (data) =>
    apiClient.post('/scheduling/departments', data),
  updateDepartment: (id, data) =>
    apiClient.put(`/scheduling/departments/${id}`, data),
  deleteDepartment: (id) =>
    apiClient.delete(`/scheduling/departments/${id}`),
  getSchedules: (doctorId, date) => {
    const params = [];
    if (doctorId && doctorId !== 'undefined') params.push(`doctor=${doctorId}`);
    if (date) params.push(`date=${date}`);
    const query = params.length ? '?' + params.join('&') : '';
    return apiClient.get(`/scheduling/schedules${query}`);
  },
  getAllDoctorSchedules: () =>
    apiClient.get('/scheduling/doctor-schedules'),
  createDoctorSchedule: (data) =>
    apiClient.post('/scheduling/doctor-schedules', data),
  deleteDoctorSchedule: (id) =>
    apiClient.delete(`/scheduling/doctor-schedules/${id}`),
  blockSchedule: (id, reason) =>
    apiClient.put(`/scheduling/doctor-schedules/${id}/block`, { reason }),
  unblockSchedule: (id) =>
    apiClient.put(`/scheduling/doctor-schedules/${id}/unblock`),
  bookAppointment: (data) =>
    apiClient.post('/scheduling/appointments', data),
  getAppointments: () =>
    apiClient.get('/scheduling/appointments'),
  updateAppointment: (id, data) =>
    apiClient.put(`/scheduling/appointments/${id}`, data),
};

// Clinical API
export const clinicalAPI = {
  getMedicines: () =>
    apiClient.get('/clinical/medicines'),
  createMedicine: (data) =>
    apiClient.post('/clinical/medicines', data),
  updateMedicine: (id, data) =>
    apiClient.put(`/clinical/medicines/${id}`, data),
  deleteMedicine: (id) =>
    apiClient.delete(`/clinical/medicines/${id}`),
  getDoctors: (params) =>
    apiClient.get('/clinical/doctors', { params }),
  getPublicStats: () =>
    apiClient.get('/clinical/public-stats'),
  getMedicalRecords: (params) =>
    apiClient.get('/clinical/medical-records', { params }),
  createMedicalRecord: (data) =>
    apiClient.post('/clinical/medical-records', data),
  createPrescription: (data) =>
    apiClient.post('/clinical/prescriptions', data),
  getPrescriptions: (recordId) =>
    apiClient.get('/clinical/prescriptions', { params: { recordId } }),
  deletePrescription: (id) =>
    apiClient.delete(`/clinical/prescriptions/${id}`),
};

// Billing API
export const billingAPI = {
  getInvoices: () =>
    apiClient.get('/billing/invoices'),
  createInvoice: (data) =>
    apiClient.post('/billing/invoices', data),
  processPayment: (invoiceId) =>
    apiClient.post(`/billing/invoices/${invoiceId}/pay`),
  payInvoice: (invoiceId) =>
    apiClient.post(`/billing/invoices/${invoiceId}/pay`),
};

// CMS API
export const cmsAPI = {
  getPosts: () =>
    apiClient.get('/cms/posts'),
  createPost: (data) =>
    apiClient.post('/cms/posts', data),
  updatePost: (id, data) =>
    apiClient.put(`/cms/posts/${id}`, data),
  deletePost: (id) =>
    apiClient.delete(`/cms/posts/${id}`),
  submitContactInquiry: (data) =>
    apiClient.post('/cms/contact-inquiries', data),
  getContactInquiries: () =>
    apiClient.get('/cms/contact-inquiries'),
  resolveContactInquiry: (id) =>
    apiClient.put(`/cms/contact-inquiries/${id}/resolve`),
  replyContactInquiry: (id, data) =>
    apiClient.post(`/cms/contact-inquiries/${id}/reply`, data),
  uploadImage: (image) =>
    apiClient.post('/cms/upload', { image }),
  getChatHistory: (params) =>
    apiClient.get('/cms/chat/history', { params }),
  getChatSessions: () =>
    apiClient.get('/cms/chat/sessions'),
  deleteChatMessage: (id) =>
    apiClient.delete(`/cms/chat/message/${id}`),
  deleteChatSession: (params) =>
    apiClient.delete('/cms/chat/session', { params }),
};

// Public Booking API
export const bookingAPI = {
  submitQuickBooking: (data) =>
    apiClient.post('/booking', data),
};

// Reviews API
export const reviewAPI = {
  getDoctorReviews: (doctorId) =>
    apiClient.get(`/reviews/doctor/${doctorId}`),
  submitReview: (data) =>
    apiClient.post('/reviews', data),
  checkEligibility: (doctorId) =>
    apiClient.get(`/reviews/eligibility/${doctorId}`),
};

export default apiClient;
