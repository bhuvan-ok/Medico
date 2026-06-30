import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import Spinner from '../components/ui/Spinner.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import { ROLES } from '../lib/constants.js';
import { useAuth } from '../hooks/useAuth.js';

// Auth pages
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import RegisterPage from '../features/auth/pages/RegisterPage.jsx';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage.jsx';
import VerifyEmailPage from '../features/auth/pages/VerifyEmailPage.jsx';
import OAuthCallback from '../features/auth/pages/OAuthCallback.jsx';

// Public pages
import LandingPage from '../features/public/pages/LandingPage.jsx';
import DoctorSearchPage from '../features/public/pages/DoctorSearchPage.jsx';
import DoctorPublicProfilePage from '../features/public/pages/DoctorPublicProfilePage.jsx';

// Patient pages
import PatientDashboard from '../features/patient/pages/PatientDashboard.jsx';
import AppointmentHistory from '../features/patient/pages/AppointmentHistory.jsx';
import MedicalReports from '../features/patient/pages/MedicalReports.jsx';
import PatientProfile from '../features/patient/pages/PatientProfile.jsx';
import PatientPrescriptions from '../features/patient/pages/PatientPrescriptions.jsx';

// Doctor pages
import DoctorDashboard from '../features/doctor/pages/DoctorDashboard.jsx';
import ManageAppointments from '../features/doctor/pages/ManageAppointments.jsx';
import ManageSchedule from '../features/doctor/pages/ManageSchedule.jsx';
import DoctorProfilePage from '../features/doctor/pages/DoctorProfilePage.jsx';
import WritePrescription from '../features/doctor/pages/WritePrescription.jsx';

// Appointment pages
import BookAppointment from '../features/appointment/pages/BookAppointment.jsx';
import AppointmentDetail from '../features/appointment/pages/AppointmentDetail.jsx';

// Admin pages
import AdminDashboard from '../features/admin/pages/AdminDashboard.jsx';
import ManageDoctors from '../features/admin/pages/ManageDoctors.jsx';
import ManagePatients from '../features/admin/pages/ManagePatients.jsx';
import AdminAppointments from '../features/admin/pages/AdminAppointments.jsx';
import Analytics from '../features/admin/pages/Analytics.jsx';

// Notification
import NotificationsPage from '../features/notification/pages/NotificationsPage.jsx';

const Loading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner size="lg" />
  </div>
);

// Smart dashboard redirect based on role
function DashboardRedirect() {
  const { role } = useAuth();
  if (role === ROLES.DOCTOR) return <Navigate to="/doctor/dashboard" replace />;
  if (role === ROLES.ADMIN) return <Navigate to="/admin/dashboard" replace />;
  return <PatientDashboard />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
        <Route path="/doctors" element={<PublicLayout><DoctorSearchPage /></PublicLayout>} />
        <Route path="/doctors/:id" element={<PublicLayout><DoctorPublicProfilePage /></PublicLayout>} />
        <Route path="/unauthorized" element={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center"><h1 className="text-4xl font-bold text-danger mb-2">403</h1><p className="text-neutral">Access Denied</p></div>
          </div>
        } />

        {/* Auth routes */}
        <Route path="/login" element={<AuthLayout title="Welcome back" subtitle="Sign in to your MediBook account"><LoginPage /></AuthLayout>} />
        <Route path="/register" element={<AuthLayout title="Create account" subtitle="Join MediBook today"><RegisterPage /></AuthLayout>} />
        <Route path="/forgot-password" element={<AuthLayout title="Forgot password" subtitle="We'll send you a reset link"><ForgotPasswordPage /></AuthLayout>} />
        <Route path="/reset-password/:token" element={<AuthLayout title="Reset password"><ResetPasswordPage /></AuthLayout>} />
        <Route path="/verify-email/:token" element={<AuthLayout title="Verify email"><VerifyEmailPage /></AuthLayout>} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />

        {/* Patient dashboard — nested routes share DashboardLayout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute roles={[ROLES.PATIENT]}>
                <DashboardLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardRedirect />} />
          <Route path="appointments" element={<AppointmentHistory />} />
          <Route path="appointments/:id" element={<AppointmentDetail />} />
          <Route path="prescriptions" element={<PatientPrescriptions />} />
          <Route path="medical-reports" element={<MedicalReports />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="book/:doctorId" element={<BookAppointment />} />
        </Route>

        {/* Doctor dashboard — nested routes */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute>
              <RoleRoute roles={[ROLES.DOCTOR]}>
                <DashboardLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="appointments" element={<ManageAppointments />} />
          <Route path="appointments/:id" element={<WritePrescription />} />
          <Route path="schedule" element={<ManageSchedule />} />
          <Route path="profile" element={<DoctorProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Admin dashboard — nested routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleRoute roles={[ROLES.ADMIN]}>
                <DashboardLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="doctors" element={<ManageDoctors />} />
          <Route path="patients" element={<ManagePatients />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<PatientProfile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
