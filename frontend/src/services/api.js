// API Service - Axios wrapper
import axios from 'axios';

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

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

// Interceptor để xử lý 401 và chuyển hướng về màn hình đăng nhập
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userDisplayName');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Login expects 'username' on backend (username or phone). Send as 'username' here.
  login: (phone, password) =>
    apiClient.post('/auth/login', { username: phone, password }),
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
  // Patient self-service
  getOwnProfile: () => apiClient.get('/profiles/patient/me'),
  createOwnProfile: (data) => apiClient.post('/profiles/patient/me', data),
  updateOwnProfile: (data) => apiClient.put('/profiles/patient/me', data),
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

export default apiClient;
