import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../../lib/axios.js';
import { useAuth } from '../../../hooks/useAuth.js';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import SkeletonCard from '../../../components/ui/SkeletonCard.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import { formatDate } from '../../../utils/formatDate.js';
import { drName } from '../../../utils/drName.js';
import { FiCalendar, FiFileText, FiSearch, FiPlusCircle, FiTrendingUp, FiClipboard, FiCpu, FiX } from 'react-icons/fi';

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl border border-border p-5 flex items-center gap-4">
    <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-xs text-neutral">{label}</p>
    </div>
  </div>
);

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiNudge, setAiNudge] = useState(null); // { prescriptionId, doctorName }
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/patients/me/appointments?status=pending&limit=5'),
      axiosInstance.get('/patients/me/appointments?status=confirmed&limit=1'),
      axiosInstance.get('/patients/me/appointments?status=completed&limit=1'),
      axiosInstance.get('/patients/me/prescriptions?limit=3'),
    ])
      .then(([upcomingRes, confirmedRes, completedRes, rxRes]) => {
        setAppointments(upcomingRes.data.data);
        setStats({
          upcoming: upcomingRes.data.pagination?.total ?? upcomingRes.data.data.length,
          confirmed: confirmedRes.data.pagination?.total ?? 0,
          completed: completedRes.data.pagination?.total ?? 0,
          prescriptions: rxRes.data.pagination?.total ?? 0,
        });
        // Show nudge for the latest prescription that hasn't been AI-analyzed
        const unanalyzed = rxRes.data.data?.find((p) => !p.aiSummary);
        if (unanalyzed) {
          setAiNudge({ prescriptionId: unanalyzed._id, doctorName: unanalyzed.doctorId?.name });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary/90 to-secondary/80 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sky-100 text-sm font-medium">{greeting}</p>
            <h1 className="text-2xl font-bold mt-0.5">{user?.name?.split(' ')[0]}!</h1>
            <p className="text-sky-100 text-sm mt-1">
              {stats?.upcoming > 0
                ? `You have ${stats.upcoming} upcoming appointment${stats.upcoming > 1 ? 's' : ''}.`
                : 'No pending appointments. Book one with a verified doctor.'}
            </p>
          </div>
          <Avatar src={user?.avatar?.url} name={user?.name} size="lg" className="border-2 border-white/30" />
        </div>
      </div>

      {/* AI nudge — show if patient has an unanalyzed prescription */}
      {aiNudge && !nudgeDismissed && (
        <div className="bg-gradient-to-r from-secondary/10 to-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FiCpu size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">New prescription available</p>
            <p className="text-xs text-neutral">
              {drName(aiNudge.doctorName)} has issued a prescription. Let AI summarize it in plain language.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to={`/dashboard/ai/analyzer?prescriptionId=${aiNudge.prescriptionId}`}>
              <Button size="sm" className="gap-1.5">
                <FiCpu size={12} /> Analyze
              </Button>
            </Link>
            <button onClick={() => setNudgeDismissed(true)} className="text-neutral hover:text-gray-700">
              <FiX size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Pending" value={stats?.upcoming} icon={FiCalendar} color="bg-warning/10 text-warning" />
          <StatCard label="Confirmed" value={stats?.confirmed} icon={FiTrendingUp} color="bg-primary/10 text-primary" />
          <StatCard label="Completed" value={stats?.completed} icon={FiPlusCircle} color="bg-success/10 text-success" />
          <StatCard label="Prescriptions" value={stats?.prescriptions} icon={FiClipboard} color="bg-secondary/10 text-secondary" />
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: FiSearch, label: 'Find a Doctor', to: '/doctors', color: 'bg-primary/10 text-primary', desc: 'Search verified doctors' },
          { icon: FiCalendar, label: 'My Appointments', to: '/dashboard/appointments', color: 'bg-secondary/10 text-secondary', desc: 'View & manage bookings' },
          { icon: FiFileText, label: 'Medical Reports', to: '/dashboard/medical-reports', color: 'bg-success/10 text-success', desc: 'Upload or view reports' },
        ].map(({ icon: Icon, label, to, color, desc }) => (
          <Link
            key={to}
            to={to}
            className="bg-white rounded-xl border border-border p-5 flex items-center gap-4 hover:shadow-md transition-shadow group"
          >
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors block">{label}</span>
              <span className="text-xs text-neutral">{desc}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Upcoming appointments */}
      <div className="bg-white rounded-xl border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-semibold text-gray-900">Upcoming Appointments</h2>
            <p className="text-xs text-neutral mt-0.5">Your next scheduled visits</p>
          </div>
          <Link to="/dashboard/appointments" className="text-sm text-primary hover:underline font-medium">View all →</Link>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-5"><SkeletonCard lines={2} /></div>
          ) : appointments.length === 0 ? (
            <div className="p-10 text-center">
              <FiCalendar size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-neutral text-sm">No upcoming appointments.</p>
              <Link to="/doctors" className="text-primary hover:underline text-sm font-medium mt-2 inline-block">
                Book an appointment →
              </Link>
            </div>
          ) : (
            appointments.map((appt) => (
              <Link
                key={appt._id}
                to={`/dashboard/appointments/${appt._id}`}
                className="flex items-center gap-4 p-5 hover:bg-surface transition-colors"
              >
                <Avatar src={appt.doctorId?.avatar?.url} name={appt.doctorId?.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{drName(appt.doctorId?.name)}</p>
                  <p className="text-sm text-neutral">
                    {appt.slotId ? formatDate(appt.slotId.date) : '—'} at {appt.slotId?.startTime}
                    <span className="mx-1.5">·</span>
                    <span className="capitalize">{appt.type}</span>
                  </p>
                </div>
                <Badge status={appt.status} />
              </Link>
            ))
          )}
        </div>
        {appointments.length > 0 && (
          <div className="p-4 border-t border-border">
            <Link to="/doctors">
              <Button variant="outline" size="sm" className="w-full">Book Another Appointment</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
