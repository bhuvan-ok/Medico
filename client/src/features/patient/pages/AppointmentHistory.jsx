import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../../lib/axios.js';
import Badge from '../../../components/ui/Badge.jsx';
import SkeletonCard from '../../../components/ui/SkeletonCard.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import Pagination from '../../../components/ui/Pagination.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import Button from '../../../components/ui/Button.jsx';
import { formatDate } from '../../../utils/formatDate.js';
import { formatCurrency } from '../../../utils/formatCurrency.js';
import { FiCalendar, FiVideo, FiUser, FiClock, FiChevronRight } from 'react-icons/fi';

const STATUSES = ['', 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'];
const STATUS_LABELS = { '': 'All', pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', rejected: 'Rejected' };

export default function AppointmentHistory() {
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ page, limit: 10 });
    if (status) q.set('status', status);
    axiosInstance
      .get(`/patients/me/appointments?${q}`)
      .then(({ data }) => {
        setAppointments(data.data);
        setPagination(data.pagination);
      })
      .finally(() => setLoading(false));
  }, [status, page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-sm text-neutral mt-0.5">Track all your scheduled visits</p>
        </div>
        <Link to="/doctors">
          <Button size="sm" className="gap-2"><FiCalendar size={14} /> Book New</Button>
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              status === s
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-neutral border-border hover:border-primary hover:text-primary'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}</div>
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No appointments found"
          description={status ? `No ${status} appointments.` : 'Book your first appointment with a doctor.'}
        />
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <Link
              key={appt._id}
              to={`/dashboard/appointments/${appt._id}`}
              className="flex items-center gap-4 bg-white rounded-xl border border-border p-4 hover:shadow-sm hover:border-primary/30 transition-all group"
            >
              <Avatar src={appt.doctorId?.avatar?.url} name={appt.doctorId?.name} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                  Dr. {appt.doctorId?.name}
                </p>
                <div className="flex items-center gap-3 mt-0.5 text-sm text-neutral flex-wrap">
                  <span className="flex items-center gap-1">
                    <FiCalendar size={12} />
                    {appt.slotId ? formatDate(appt.slotId.date) : '—'}
                  </span>
                  {appt.slotId?.startTime && (
                    <span className="flex items-center gap-1">
                      <FiClock size={12} />
                      {appt.slotId.startTime}
                    </span>
                  )}
                  <span className="flex items-center gap-1 capitalize">
                    {appt.type === 'video'
                      ? <FiVideo size={12} className="text-secondary" />
                      : <FiUser size={12} className="text-success" />
                    }
                    {appt.type}
                  </span>
                </div>
                <p className="text-xs text-neutral mt-0.5">{formatCurrency(appt.consultationFee)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge status={appt.status} />
                <FiChevronRight size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
