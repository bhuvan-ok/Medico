import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../../lib/axios.js';
import SkeletonCard from '../../../components/ui/SkeletonCard.jsx';
import {
  FiUsers, FiCalendar, FiUserCheck, FiClock,
  FiActivity, FiBarChart2, FiUserPlus, FiTrendingUp,
} from 'react-icons/fi';

const StatCard = ({ label, value, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-xl border border-border p-5 hover:shadow-sm transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      {trend != null && (
        <span className="text-xs text-success font-medium flex items-center gap-1">
          <FiTrendingUp size={11} /> {trend}
        </span>
      )}
    </div>
    <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
    <p className="text-sm text-neutral mt-0.5">{label}</p>
  </div>
);

const QuickLink = ({ to, icon: Icon, label, description, color }) => (
  <Link
    to={to}
    className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-shadow group"
  >
    <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
      <Icon size={18} />
    </div>
    <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{label}</p>
    <p className="text-xs text-neutral mt-0.5">{description}</p>
  </Link>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get('/admin/dashboard')
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-secondary to-secondary/80 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-purple-100 text-sm mt-1">Manage the MediBook platform — doctors, patients, and appointments.</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats?.totalUsers} icon={FiUsers} color="bg-primary/10 text-primary" />
          <StatCard label="Verified Doctors" value={stats?.totalDoctors} icon={FiUserCheck} color="bg-success/10 text-success" />
          <StatCard label="Pending Verifications" value={stats?.pendingVerifications} icon={FiClock} color="bg-warning/10 text-warning" />
          <StatCard label="Total Appointments" value={stats?.totalAppointments} icon={FiCalendar} color="bg-secondary/10 text-secondary" />
        </div>
      )}

      {/* Today highlight */}
      {!loading && stats?.todayAppointments != null && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-center gap-4">
          <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiActivity size={22} className="text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.todayAppointments}</p>
            <p className="text-sm text-neutral">appointments booked today</p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickLink
            to="/admin/doctors"
            icon={FiUserCheck}
            label="Manage Doctors"
            description="Verify, suspend, or add doctors"
            color="bg-primary/10 text-primary"
          />
          <QuickLink
            to="/admin/patients"
            icon={FiUsers}
            label="Manage Patients"
            description="View and manage patient accounts"
            color="bg-secondary/10 text-secondary"
          />
          <QuickLink
            to="/admin/appointments"
            icon={FiCalendar}
            label="All Appointments"
            description="Monitor and manage bookings"
            color="bg-warning/10 text-warning"
          />
          <QuickLink
            to="/admin/analytics"
            icon={FiBarChart2}
            label="Analytics"
            description="Revenue, growth, and trends"
            color="bg-success/10 text-success"
          />
        </div>
      </div>

      {stats?.pendingVerifications > 0 && (
        <div className="bg-warning/5 border border-warning/30 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiClock size={20} className="text-warning" />
            <div>
              <p className="font-semibold text-gray-900">
                {stats.pendingVerifications} doctor{stats.pendingVerifications > 1 ? 's' : ''} awaiting verification
              </p>
              <p className="text-sm text-neutral">Review their applications and license documents</p>
            </div>
          </div>
          <Link
            to="/admin/doctors?filter=unverified"
            className="text-sm font-semibold text-warning hover:underline whitespace-nowrap"
          >
            Review now →
          </Link>
        </div>
      )}
    </div>
  );
}
