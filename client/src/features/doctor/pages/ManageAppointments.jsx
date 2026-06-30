import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../lib/axios.js';
import toast from 'react-hot-toast';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import SkeletonCard from '../../../components/ui/SkeletonCard.jsx';
import Pagination from '../../../components/ui/Pagination.jsx';
import { formatDate } from '../../../utils/formatDate.js';
import { FiFileText } from 'react-icons/fi';

const STATUSES = ['', 'pending', 'confirmed', 'completed', 'cancelled'];

export default function ManageAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [rejectModal, setRejectModal] = useState(null);
  const [reason, setReason] = useState('');

  const fetch = () => {
    setLoading(true);
    const q = new URLSearchParams({ page, limit: 10 });
    if (status) q.set('status', status);
    axiosInstance.get(`/doctors/me/appointments?${q}`)
      .then(({ data }) => { setAppointments(data.data); setPagination(data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(fetch, [status, page]);

  const accept = async (id) => {
    await axiosInstance.patch(`/doctors/me/appointments/${id}/accept`);
    toast.success('Appointment confirmed');
    fetch();
  };

  const reject = async () => {
    await axiosInstance.patch(`/doctors/me/appointments/${rejectModal}/reject`, { reason });
    toast.success('Appointment rejected');
    setRejectModal(null);
    setReason('');
    fetch();
  };

  const complete = async (id) => {
    await axiosInstance.patch(`/doctors/me/appointments/${id}/complete`);
    toast.success('Appointment marked as completed');
    fetch();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>

      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
              status === s ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:border-primary hover:text-primary'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}</div>
      ) : appointments.length === 0 ? (
        <EmptyState title="No appointments" />
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <div key={appt._id} className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-start gap-4">
                <Avatar src={appt.patientId?.avatar?.url} name={appt.patientId?.name} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{appt.patientId?.name}</p>
                    <Badge status={appt.status} />
                  </div>
                  <p className="text-sm text-neutral">
                    {appt.slotId ? formatDate(appt.slotId.date) : '—'} at {appt.slotId?.startTime} · {appt.type}
                  </p>
                  {appt.notes && <p className="text-xs text-neutral mt-1 italic">"{appt.notes}"</p>}
                </div>
              </div>
              {appt.status === 'pending' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <Button size="sm" onClick={() => accept(appt._id)}>Accept</Button>
                  <Button variant="danger" size="sm" onClick={() => setRejectModal(appt._id)}>Reject</Button>
                </div>
              )}
              {appt.status === 'confirmed' && (
                <div className="mt-3 pt-3 border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => complete(appt._id)}>Mark Complete</Button>
                </div>
              )}
              {appt.status === 'completed' && (
                <div className="mt-3 pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => navigate(`/doctor/appointments/${appt._id}`)}
                  >
                    <FiFileText size={13} /> Write Prescription
                  </Button>
                </div>
              )}
            </div>
          ))}
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Appointment">
        <div className="space-y-4">
          <textarea
            className="w-full rounded-lg border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            placeholder="Reason for rejection..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={reject}>Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
