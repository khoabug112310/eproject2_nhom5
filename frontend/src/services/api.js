// API Service - Axios wrapper
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor để thêm JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
};

// Profiles API
export const profilesAPI = {
  getUsers: () => apiClient.get('/profiles/users'),
  getUser: (id) => apiClient.get(`/profiles/users/${id}`),
  updateUser: (id, data) =>
    apiClient.put(`/profiles/profile/${id}`, data),
  getPatients: () => apiClient.get('/profiles/patients'),
  createUser: (data) => apiClient.post('/profiles/users', data),
  getAdminStats: () => apiClient.get('/profiles/admin/stats'),
};

// Scheduling API
export const schedulingAPI = {
  getDepartments: () =>
    apiClient.get('/scheduling/departments'),
  getSchedules: (doctorId) =>
    apiClient.get(`/scheduling/schedules?doctor=${doctorId}`),
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
  getDoctors: () =>
    apiClient.get('/clinical/doctors'),
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
};

// Public Booking API
export const bookingAPI = {
  submitQuickBooking: (data) =>
    apiClient.post('/booking', data),
};

export default apiClient;
