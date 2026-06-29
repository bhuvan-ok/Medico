import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../../lib/axios.js';
import { useAuth } from '../../../hooks/useAuth.js';
import Badge from '../../../components/ui/Badge.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import Button from '../../../components/ui/Button.jsx';
import SkeletonCard from '../../../components/ui/SkeletonCard.jsx';
import { formatDate } from '../../../utils/formatDate.js';
import { formatCurrency } from '../../../utils/formatCurrency.js';
import {
  FiCalendar, FiCheckCircle, FiClock, FiSettings,
  FiUsers, FiTrendingUp, FiAlertCircle,
} from 'react-icons/fi';

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="bg-white rounded-xl border border-border p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900">{value ?? <span className="text-gray-300">—</span>}</p>
    <p className="text-sm text-neutral mt-0.5">{label}</p>
    {sub && <p className="text-xs text-neutral/70 mt-1">{sub}</p>}
  </div>
);

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/doctors/me/appointments?status=pending&limit=5'),
      axiosInstance.get('/doctors/me/appointments?status=confirmed&limit=1'),
      axiosInstance.get('/doctors/me/appointments?status=completed&limit=1'),
    ])
      .then(([pendingRes, confirmedRes, completedRes]) => {
        setPending(pendingRes.data.data);
        setStats({
          pending: pendingRes.data.pagination?.total ?? pendingRes.data.data.length,
          confirmed: confirmedRes.data.pagination?.total ?? 0,
          completed: completedRes.data.pagination?.total ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sky-100 text-sm font-medium">{greeting}</p>
            <h1 className="text-2xl font-bold mt-0.5">Dr. {user?.name?.split(' ')[0]}</h1>
            <p className="text-sky-100 text-sm mt-1">
              {stats?.pending > 0
                ? `You have ${stats.pending} pending appointment${stats.pending > 1 ? 's' : ''} awaiting your response.`
                : 'No pending appointments right now.'}
            </p>
          </div>
          <Avatar src={user?.avatar?.url} name={user?.name} size="lg" className="border-2 border-white/30" />
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Pending Requests" value={stats?.pending} icon={FiAlertCircle} color="bg-warning/10 text-warning" sub="Awaiting your acceptance" />
          <StatCard label="Confirmed" value={stats?.confirmed} icon={FiCheckCircle} color="bg-primary/10 text-primary" sub="Upcoming sessions" />
          <StatCard label="Completed" value={stats?.completed} icon={FiTrendingUp} color="bg-success/10 text-success" sub="All time" />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: FiCalendar, label: 'All Appointments', to: '/doctor/appointments', color: 'bg-primary/10 text-primary' },
          { icon: FiSettings, label: 'Manage Schedule', to: '/doctor/schedule', color: 'bg-secondary/10 text-secondary' },
          { icon: FiUsers, label: 'My Profile', to: '/doctor/profile', color: 'bg-success/10 text-success' },
        ].map(({ icon: Icon, label, to, color }) => (
          <Link
            key={to}
            to={to}
            className="bg-white rounded-xl border border-border p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={17} />
            </div>
            <span className="font-medium text-gray-900 text-sm">{label}</span>
          </Link>
        ))}
      </div>

      {/* Pending requests */}
      <div className="bg-white rounded-xl border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-semibold text-gray-900">Pending Requests</h2>
            <p className="text-xs text-neutral mt-0.5">These patients are waiting for your acceptance</p>
          </div>
          <Link to="/doctor/appointments" className="text-sm text-primary hover:underline font-medium">View all →</Link>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-5"><SkeletonCard lines={2} /></div>
          ) : pending.length === 0 ? (
            <div className="p-10 text-center">
              <FiClock size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-neutral text-sm">No pending appointments.</p>
              <p className="text-neutral/70 text-xs mt-1">Pending appointments from patients will appear here.</p>
            </div>
          ) : (
            pending.map((appt) => (
              <div key={appt._id} className="flex items-center gap-4 p-5">
                <Avatar src={appt.patientId?.avatar?.url} name={appt.patientId?.name} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{appt.patientId?.name}</p>
                  <p className="text-sm text-neutral">
                    {appt.slotId ? formatDate(appt.slotId.date) : '—'} at {appt.slotId?.startTime}
                    <span className="mx-1.5 text-border">·</span>
                    <span className="capitalize">{appt.type}</span>
                    <span className="mx-1.5 text-border">·</span>
                    {formatCurrency(appt.consultationFee)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge status={appt.status} />
                </div>
              </div>
            ))
          )}
        </div>
        {pending.length > 0 && (
          <div className="p-4 border-t border-border">
            <Link to="/doctor/appointments?status=pending">
              <Button variant="outline" size="sm" className="w-full">Manage All Pending</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
