import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axiosInstance from '../../../lib/axios.js';
import { useAuth } from '../../../hooks/useAuth.js';
import toast from 'react-hot-toast';
import Badge from '../../../components/ui/Badge.jsx';
import Button from '../../../components/ui/Button.jsx';
import Modal from '../../../components/ui/Modal.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import { formatDate } from '../../../utils/formatDate.js';
import { formatCurrency } from '../../../utils/formatCurrency.js';
import { FiStar, FiCalendar, FiClock, FiVideo, FiUser, FiDollarSign, FiArrowLeft, FiCheckCircle, FiFileText, FiDownload, FiCpu } from 'react-icons/fi';
import { ROLES } from '../../../lib/constants.js';
import { drName } from '../../../utils/drName.js';

export default function AppointmentDetail() {
  const { id } = useParams();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [prescription, setPrescription] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const { register, handleSubmit } = useForm();

  useEffect(() => {
    axiosInstance.get(`/appointments/${id}`)
      .then(({ data }) => {
        setAppointment(data.data);
        if (data.data.status === 'completed') {
          axiosInstance.get(`/prescriptions/${id}`)
            .then(({ data: rxData }) => setPrescription(rxData.data))
            .catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = handleSubmit(async ({ reason }) => {
    await axiosInstance.patch(`/appointments/${id}/cancel`, { reason });
    toast.success('Appointment cancelled');
    setCancelModal(false);
    setAppointment((a) => ({ ...a, status: 'cancelled' }));
  });

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const { data } = await axiosInstance.post(`/prescriptions/${id}/pdf`);
      window.open(data.data.url, '_blank');
      setPrescription((prev) => ({
        ...prev,
        documentUrl: { url: data.data.url },
      }));
    } catch {
      toast.error('Could not generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleReview = async () => {
    if (!rating) return toast.error('Please select a rating');
    setReviewLoading(true);
    try {
      await axiosInstance.post(`/appointments/${id}/review`, { rating, comment });
      toast.success('Review submitted — thank you!');
      setReviewModal(false);
      setReviewSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!appointment) return <div className="text-center py-20">Appointment not found</div>;

  const { patientId, doctorId, slotId, status, type, consultationFee, notes } = appointment;
  const other = role === ROLES.PATIENT ? doctorId : patientId;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-neutral hover:text-gray-900 hover:border-gray-300 transition-colors"
        >
          <FiArrowLeft size={15} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Appointment Details</h1>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-5">
        {/* Person + status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar src={other?.avatar?.url} name={other?.name} size="md" />
            <div>
              <p className="font-semibold text-gray-900">
                {role === ROLES.PATIENT ? drName(other?.name) : other?.name}
              </p>
              <p className="text-sm text-neutral">{other?.email}</p>
            </div>
          </div>
          <Badge status={status} />
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3">
          <DetailItem icon={FiCalendar} label="Date" value={slotId ? formatDate(slotId.date) : '—'} />
          <DetailItem icon={FiClock} label="Time" value={slotId?.startTime ?? '—'} />
          <DetailItem
            icon={type === 'video' ? FiVideo : FiUser}
            label="Type"
            value={type === 'video' ? 'Video Consultation' : 'In-Person Visit'}
          />
          <DetailItem icon={FiDollarSign} label="Fee" value={formatCurrency(consultationFee)} />
        </div>

        {notes && (
          <div>
            <p className="text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Patient Notes</p>
            <p className="text-sm text-neutral bg-surface rounded-lg px-3 py-2.5 leading-relaxed">{notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
          {['pending', 'confirmed'].includes(status) && role === ROLES.PATIENT && (
            <Button variant="danger" size="sm" onClick={() => setCancelModal(true)}>Cancel Appointment</Button>
          )}
          {status === 'completed' && role === ROLES.PATIENT && !reviewSubmitted && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setReviewModal(true)}>
              <FiStar size={14} /> Leave a Review
            </Button>
          )}
          {status === 'completed' && role === ROLES.PATIENT && reviewSubmitted && (
            <span className="inline-flex items-center gap-1.5 text-sm text-success">
              <FiCheckCircle size={14} /> Review submitted
            </span>
          )}
        </div>
      </div>

      {/* Prescription card — shown when appointment is completed and prescription exists */}
      {status === 'completed' && prescription && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiFileText size={15} className="text-primary" />
              <h2 className="font-semibold text-gray-900 text-sm">Prescription</h2>
            </div>
            {role === ROLES.PATIENT && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                  className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                >
                  <FiDownload size={12} /> {pdfLoading ? 'Generating...' : 'Download PDF'}
                </button>
                <button
                  onClick={() => navigate(`/dashboard/ai/analyzer?prescriptionId=${prescription._id}`)}
                  className="flex items-center gap-1 text-xs text-secondary hover:underline"
                >
                  <FiCpu size={12} /> Analyze with AI
                </button>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral uppercase tracking-wider mb-1">Diagnosis</p>
            <p className="text-sm text-gray-900">{prescription.diagnosis}</p>
          </div>

          {prescription.medicines?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-neutral uppercase tracking-wider mb-2">Medicines</p>
              <div className="space-y-1.5">
                {prescription.medicines.map((m, i) => (
                  <div key={i} className="bg-surface rounded-lg px-3 py-2 text-sm">
                    <span className="font-medium text-gray-900">{m.name}</span>
                    {m.dosage && <span className="text-neutral"> — {m.dosage}</span>}
                    {m.frequency && <span className="text-neutral">, {m.frequency}</span>}
                    {m.duration && <span className="text-neutral">, {m.duration}</span>}
                    {m.instructions && <p className="text-xs text-neutral mt-0.5">{m.instructions}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {prescription.tests?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-neutral uppercase tracking-wider mb-2">Tests Advised</p>
              <div className="flex flex-wrap gap-2">
                {prescription.tests.map((t, i) => (
                  <span key={i} className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}

          {prescription.advice && (
            <div>
              <p className="text-xs font-semibold text-neutral uppercase tracking-wider mb-1">Advice</p>
              <p className="text-sm text-neutral">{prescription.advice}</p>
            </div>
          )}

          {prescription.followUpDate && (
            <div>
              <p className="text-xs font-semibold text-neutral uppercase tracking-wider mb-1">Follow-up</p>
              <p className="text-sm text-gray-900">{formatDate(prescription.followUpDate)}</p>
            </div>
          )}
        </div>
      )}

      {status === 'completed' && !prescription && (
        <div className="bg-white rounded-xl border border-border px-5 py-4 flex items-center gap-3 text-sm text-neutral">
          <FiFileText size={15} className="text-gray-300" />
          No prescription has been issued for this appointment yet.
        </div>
      )}

      {/* Cancel modal */}
      <Modal isOpen={cancelModal} onClose={() => setCancelModal(false)} title="Cancel Appointment">
        <form onSubmit={handleCancel} className="space-y-4">
          <p className="text-sm text-neutral">Please provide a reason for cancellation so the doctor is informed.</p>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Reason</label>
            <textarea
              {...register('reason', { required: true })}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Please explain..."
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" type="button" onClick={() => setCancelModal(false)}>Back</Button>
            <Button variant="danger" className="flex-1" type="submit">Confirm Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Review modal */}
      <Modal isOpen={reviewModal} onClose={() => setReviewModal(false)} title="Rate Your Experience">
        <div className="space-y-4">
          <p className="text-sm text-neutral">
            How was your consultation with {drName(doctorId?.name)}?
          </p>
          <div className="flex gap-2 justify-center py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                onMouseEnter={() => setHoverRating(i + 1)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(i + 1)}
                className="transition-transform hover:scale-110"
              >
                <FiStar
                  size={32}
                  className={i < (hoverRating || rating)
                    ? 'text-warning fill-warning'
                    : 'text-gray-200'
                  }
                />
              </button>
            ))}
          </div>
          {(hoverRating || rating) > 0 && (
            <p className="text-center text-sm font-medium text-gray-700">
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hoverRating || rating]}
            </p>
          )}
          <textarea
            className="w-full rounded-lg border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
            placeholder="Share your experience (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button className="w-full" onClick={handleReview} loading={reviewLoading} disabled={!rating}>
            Submit Review
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="bg-surface rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-neutral mb-1">
        <Icon size={12} className="text-primary" />
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
