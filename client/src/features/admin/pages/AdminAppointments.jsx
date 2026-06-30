import { useState, useEffect } from 'react';
import axiosInstance from '../../../lib/axios.js';
import toast from 'react-hot-toast';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Pagination from '../../../components/ui/Pagination.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import SkeletonCard from '../../../components/ui/SkeletonCard.jsx';
import { formatDate } from '../../../utils/formatDate.js';
import { drName } from '../../../utils/drName.js';
import { formatCurrency } from '../../../utils/formatCurrency.js';

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const fetch = () => {
    setLoading(true);
    const q = new URLSearchParams({ page, limit: 10 });
    if (status) q.set('status', status);
    axiosInstance.get(`/admin/appointments?${q}`)
      .then(({ data }) => { setAppointments(data.data); setPagination(data.pagination); })
      .finally(() => setLoading(false));
  };
  useEffect(fetch, [page, status]);

  const cancel = async (id) => {
    const reason = window.prompt('Cancellation reason:');
    if (!reason) return;
    await axiosInstance.patch(`/admin/appointments/${id}/cancel`, { reason });
    toast.success('Appointment cancelled');
    fetch();
  };

  const STATUSES = ['', 'pending', 'confirmed', 'completed', 'cancelled'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">All Appointments</h1>
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${status === s ? 'bg-primary text-white border-primary' : 'bg-white text-neutral border-border hover:border-primary'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}</div>
      ) : appointments.length === 0 ? (
        <EmptyState title="No appointments" />
      ) : (
        <div className="space-y-2">
          {appointments.map((a) => (
            <div key={a._id} className="bg-white rounded-xl border border-border p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{a.patientId?.name} → {drName(a.doctorId?.name)}</p>
                <p className="text-xs text-neutral">
                  {a.slotId ? formatDate(a.slotId.date) : '—'} · {a.slotId?.startTime} · {a.type} · {formatCurrency(a.consultationFee)}
                </p>
              </div>
              <Badge status={a.status} />
              {['pending', 'confirmed'].includes(a.status) && (
                <Button variant="danger" size="sm" onClick={() => cancel(a._id)}>Cancel</Button>
              )}
            </div>
          ))}
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
