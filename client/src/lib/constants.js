export const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
};

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  RESCHEDULED: 'rescheduled',
};

export const STATUS_COLORS = {
  pending: 'bg-warning/10 text-warning',
  confirmed: 'bg-primary/10 text-primary',
  cancelled: 'bg-danger/10 text-danger',
  completed: 'bg-success/10 text-success',
  rejected: 'bg-danger/10 text-danger',
  rescheduled: 'bg-secondary/10 text-secondary',
  verified: 'bg-success/10 text-success',
  unverified: 'bg-warning/10 text-warning',
  suspended: 'bg-danger/10 text-danger',
  active: 'bg-success/10 text-success',
};

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const SPECIALIZATIONS = [
  'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
  'General Practice', 'Neurology', 'Obstetrics & Gynecology', 'Oncology',
  'Ophthalmology', 'Orthopedics', 'Pediatrics', 'Psychiatry',
  'Pulmonology', 'Radiology', 'Rheumatology', 'Urology',
];
