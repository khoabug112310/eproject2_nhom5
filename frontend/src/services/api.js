// API Service - Axios wrapper
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userDisplayName');
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
  getMyPatientProfile: () => apiClient.get('/profiles/patient/me'),
  createMyPatientProfile: (data) => apiClient.post('/profiles/patient/me', data),
  updateMyPatientProfile: (data) => apiClient.put('/profiles/patient/me', data),
  createUser: (data) => apiClient.post('/profiles/users', data),
  getAdminStats: () => apiClient.get('/profiles/admin/stats'),
  queryClinicAI: (query) => apiClient.post('/profiles/admin/ai-query', { query }),
  editUserAdmin: (id, data) => apiClient.put(`/profiles/admin/users/${id}`, data),
  deleteUserAdmin: (id) => apiClient.delete(`/profiles/admin/users/${id}`),
  deleteAppointmentAdmin: (id) => apiClient.delete(`/profiles/admin/appointments/${id}`),
  updateTimelineStepAdmin: (data) => apiClient.put('/profiles/admin/timeline/step', data),
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
  getSchedules: (doctorId, date) =>
    apiClient.get(`/scheduling/schedules?doctor=${doctorId}${date ? `&date=${date}` : ''}`),
  getAllDoctorSchedules: () =>
    apiClient.get('/scheduling/doctor-schedules'),
  createDoctorSchedule: (data) =>
    apiClient.post('/scheduling/doctor-schedules', data),
  deleteDoctorSchedule: (id) =>
    apiClient.delete(`/scheduling/doctor-schedules/${id}`),
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
  uploadImage: (image) =>
    apiClient.post('/cms/upload', { image }),
  getChatHistory: (params) =>
    apiClient.get('/cms/chat/history', { params }),
  getChatSessions: () =>
    apiClient.get('/cms/chat/sessions'),
};

// Public Booking API
export const bookingAPI = {
  submitQuickBooking: (data) =>
    apiClient.post('/booking', data),
};

export default apiClient;
