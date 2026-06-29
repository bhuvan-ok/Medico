import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../../lib/axios.js';
import toast from 'react-hot-toast';
import Avatar from '../../../components/ui/Avatar.jsx';
import Button from '../../../components/ui/Button.jsx';
import Badge from '../../../components/ui/Badge.jsx';
import Pagination from '../../../components/ui/Pagination.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import SkeletonCard from '../../../components/ui/SkeletonCard.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import { formatDate } from '../../../utils/formatDate.js';
import { formatCurrency } from '../../../utils/formatCurrency.js';
import { FiCheck, FiX, FiPlus, FiUserPlus } from 'react-icons/fi';
import { SPECIALIZATIONS } from '../../../lib/constants.js';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'unverified' },
  { label: 'Verified', value: 'verified' },
];

const initialForm = {
  name: '', email: '', specialization: '', licenseNumber: '',
  consultationFee: '', experience: '', bio: '',
  appointmentType: ['in-person'],
};

export default function ManageDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');

  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [adding, setAdding] = useState(false);

  const fetchDoctors = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({ page, limit: 10 });
    if (filter === 'unverified') q.set('isVerified', 'false');
    if (filter === 'verified') q.set('isVerified', 'true');
    axiosInstance
      .get(`/admin/doctors?${q}`)
      .then(({ data }) => { setDoctors(data.data); setPagination(data.pagination); })
      .catch(() => toast.error('Failed to load doctors'))
      .finally(() => setLoading(false));
  }, [page, filter]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const verify = async (id) => {
    try {
      await axiosInstance.patch(`/admin/doctors/${id}/verify`, { approved: true });
      toast.success('Doctor verified');
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const reject = async () => {
    try {
      await axiosInstance.patch(`/admin/doctors/${rejectModal}/verify`, { approved: false, reason: rejectReason });
      toast.success('Doctor rejected');
      setRejectModal(null);
      setRejectReason('');
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const suspend = async (id) => {
    try {
      await axiosInstance.patch(`/admin/doctors/${id}/suspend`);
      toast.success('Doctor suspended');
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.specialization || !form.licenseNumber || !form.consultationFee) {
      toast.error('Please fill all required fields');
      return;
    }
    if (form.appointmentType.length === 0) {
      toast.error('Select at least one appointment type');
      return;
    }
    setAdding(true);
    try {
      const { data } = await axiosInstance.post('/admin/doctors', {
        ...form,
        consultationFee: Number(form.consultationFee),
        experience: Number(form.experience) || 0,
      });
      if (data.data?.emailSent) {
        toast.success('Doctor created — credentials emailed successfully');
      } else {
        toast.success('Doctor created — credentials email failed, please share login details manually');
      }
      setAddModal(false);
      setForm(initialForm);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create doctor');
    } finally {
      setAdding(false);
    }
  };

  const toggleType = (t) => {
    setForm((prev) => ({
      ...prev,
      appointmentType: prev.appointmentType.includes(t)
        ? prev.appointmentType.filter((x) => x !== t)
        : [...prev.appointmentType, t],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Doctors</h1>
          <p className="text-neutral text-sm mt-0.5">Verify applications or add doctors directly</p>
        </div>
        <Button onClick={() => setAddModal(true)} className="gap-2">
          <FiUserPlus size={15} /> Add Doctor
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => { setFilter(value); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filter === value ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:border-primary hover:text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Doctor list */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}</div>
      ) : doctors.length === 0 ? (
        <EmptyState
          title="No doctors found"
          description={filter === 'unverified' ? 'No pending verification requests.' : 'No doctors match your filter.'}
        />
      ) : (
        <div className="space-y-3">
          {doctors.map((doc) => (
            <div key={doc._id} className="bg-white rounded-xl border border-border p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-4">
                <Avatar src={doc.userId?.avatar?.url} name={doc.userId?.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{doc.userId?.name}</p>
                    {doc.isVerified ? <Badge status="completed">Verified</Badge> : <Badge status="pending">Pending</Badge>}
                    {!doc.userId?.isActive && <Badge status="cancelled">Suspended</Badge>}
                  </div>
                  <p className="text-sm text-neutral">{doc.specialization} · {doc.userId?.email}</p>
                  <p className="text-xs text-neutral mt-0.5">
                    License: {doc.licenseNumber} · Fee: {formatCurrency(doc.consultationFee)} · Joined {formatDate(doc.userId?.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  {!doc.isVerified && (
                    <>
                      <Button size="sm" className="gap-1" onClick={() => verify(doc.userId?._id)}>
                        <FiCheck size={13} /> Verify
                      </Button>
                      <Button variant="danger" size="sm" className="gap-1" onClick={() => { setRejectModal(doc.userId?._id); setRejectReason(''); }}>
                        <FiX size={13} /> Reject
                      </Button>
                    </>
                  )}
                  {doc.userId?.isActive && doc.isVerified && (
                    <Button variant="outline" size="sm" onClick={() => suspend(doc.userId?._id)}>Suspend</Button>
                  )}
                </div>
              </div>
              {doc.licenseDocument?.url && (
                <a
                  href={doc.licenseDocument.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline mt-3 inline-block"
                >
                  View License Document ↗
                </a>
              )}
            </div>
          ))}
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Reject modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Doctor Application">
        <div className="space-y-4">
          <p className="text-sm text-neutral">The reason will be emailed to the doctor.</p>
          <textarea
            className="w-full rounded-lg border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            placeholder="Reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={reject}>Reject</Button>
          </div>
        </div>
      </Modal>

      {/* Add Doctor modal */}
      <Modal isOpen={addModal} onClose={() => { setAddModal(false); setForm(initialForm); }} title="Add Doctor">
        <form onSubmit={handleAdd} className="space-y-4">
          <p className="text-sm text-neutral">Doctor will be verified immediately. Login credentials will be sent to their email.</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Full Name *</label>
              <input
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Dr. Jane Smith"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Email *</label>
              <input
                type="email"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="doctor@example.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Specialization *</label>
            <select
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              value={form.specialization}
              onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))}
            >
              <option value="">Select specialization</option>
              {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">License Number *</label>
              <input
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="MCI-123456"
                value={form.licenseNumber}
                onChange={(e) => setForm((p) => ({ ...p, licenseNumber: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Consultation Fee (₹) *</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="500"
                value={form.consultationFee}
                onChange={(e) => setForm((p) => ({ ...p, consultationFee: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Years of Experience</label>
            <input
              type="number"
              min="0"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="5"
              value={form.experience}
              onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Bio</label>
            <textarea
              className="w-full rounded-lg border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={2}
              placeholder="Brief professional bio..."
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Appointment Types *</label>
            <div className="flex gap-3">
              {['in-person', 'video'].map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-border text-primary focus:ring-primary"
                    checked={form.appointmentType.includes(t)}
                    onChange={() => toggleType(t)}
                  />
                  <span className="text-sm capitalize">{t === 'video' ? '📹 Video' : '🏥 In-Person'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setAddModal(false); setForm(initialForm); }}>
              Cancel
            </Button>
            <Button type="submit" loading={adding} className="flex-1 gap-2">
              <FiPlus size={14} /> Create Doctor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
