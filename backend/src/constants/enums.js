// Các hằng số Enum cho ứng dụng

const GENDER = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
};

const USER_ROLE = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  STAFF: 'staff',      // Customer Service
  ACCOUNTANT: 'accountant',
  PATIENT: 'patient',
};

const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
};

const SCHEDULE_STATUS = {
  AVAILABLE: 'Available',
  FULL: 'Full',
  CANCELED: 'Canceled',
};

const APPOINTMENT_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELED: 'Canceled',
};

const POST_STATUS = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
};

const INVOICE_STATUS = {
  UNPAID: 'Unpaid',
  PAID: 'Paid',
  REFUNDED: 'Refunded',
};

const INVOICE_TYPE = {
  CONSULTATION: 'Consultation',
  PHARMACY: 'Pharmacy',
};

const USAGE_ROUTE = {
  ORAL: 'Uống',
  TOPICAL: 'Bôi',
  INJECTION: 'Tiêm',
};

module.exports = {
  GENDER,
  USER_ROLE,
  USER_STATUS,
  SCHEDULE_STATUS,
  APPOINTMENT_STATUS,
  POST_STATUS,
  INVOICE_STATUS,
  INVOICE_TYPE,
  USAGE_ROUTE,
};
