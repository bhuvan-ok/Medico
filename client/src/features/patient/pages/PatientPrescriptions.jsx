import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../../lib/axios.js';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import SkeletonCard from '../../../components/ui/SkeletonCard.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import Button from '../../../components/ui/Button.jsx';
import { formatDate } from '../../../utils/formatDate.js';
import { drName } from '../../../utils/drName.js';
import toast from 'react-hot-toast';
import { FiDownload, FiCpu, FiCheckCircle } from 'react-icons/fi';

export default function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(null); // prescriptionId being loaded

  useEffect(() => {
    axiosInstance.get('/patients/me/prescriptions')
      .then(({ data }) => setPrescriptions(data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadPdf = async (p) => {
    setPdfLoading(p.appointmentId?._id ?? p._id);
    try {
      // appointmentId is populated as object in the list response
      const appointmentId = typeof p.appointmentId === 'object' ? p.appointmentId._id : p.appointmentId;
      const { data } = await axiosInstance.post(`/prescriptions/${appointmentId}/pdf`);
      window.open(data.data.url, '_blank');
      // Update the local prescription with the new URL
      setPrescriptions((prev) =>
        prev.map((rx) => rx._id === p._id ? { ...rx, documentUrl: { url: data.data.url } } : rx)
      );
    } catch {
      toast.error('Could not generate PDF. Please try again.');
    } finally {
      setPdfLoading(null);
    }
  };

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
        <Link to="/dashboard/ai/analyzer">
          <Button variant="outline" size="sm" className="gap-1.5">
            <FiCpu size={14} /> AI Analyzer
          </Button>
        </Link>
      </div>

      {prescriptions.length === 0 ? (
        <EmptyState title="No prescriptions yet" description="Prescriptions from completed appointments will appear here" />
      ) : (
        <div className="space-y-4">
          {prescriptions.map((p) => {
            const appointmentId = typeof p.appointmentId === 'object' ? p.appointmentId._id : p.appointmentId;
            const isDownloading = pdfLoading === (appointmentId ?? p._id);

            return (
              <div key={p._id} className="bg-white rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={p.doctorId?.avatar?.url} name={p.doctorId?.name} size="sm" />
                    <div>
                      <p className="font-medium text-gray-900">{drName(p.doctorId?.name)}</p>
                      <p className="text-xs text-neutral">{formatDate(p.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/dashboard/ai/analyzer?prescriptionId=${p._id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-secondary border-secondary/30 hover:bg-secondary/5">
                        <FiCpu size={13} />
                        {p.aiSummary ? 'View AI Summary' : 'Analyze'}
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      loading={isDownloading}
                      onClick={() => handleDownloadPdf(p)}
                      className="gap-1.5"
                    >
                      <FiDownload size={13} />
                      PDF
                    </Button>
                  </div>
                </div>

                {/* AI summary badge */}
                {p.aiSummary && (
                  <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 mb-3">
                    <FiCheckCircle size={13} className="text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-primary leading-relaxed">{p.aiSummary}</p>
                  </div>
                )}

                <p className="font-medium text-gray-900 mb-2">Diagnosis: <span className="text-neutral font-normal">{p.diagnosis}</span></p>

                {p.medicines?.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-900 mb-2 text-sm">Medicines:</p>
                    <div className="space-y-1">
                      {p.medicines.map((m, i) => (
                        <div key={i} className="text-sm text-neutral bg-surface rounded-lg px-3 py-2">
                          <span className="font-medium text-gray-900">{m.name}</span>
                          {m.dosage && ` — ${m.dosage}`}
                          {m.frequency && `, ${m.frequency}`}
                          {m.duration && `, ${m.duration}`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {p.tests?.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium text-gray-900 mb-2 text-sm">Tests Advised:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.tests.map((t, i) => (
                        <span key={i} className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {p.advice && <p className="text-sm text-neutral mt-3"><span className="font-medium text-gray-900">Advice:</span> {p.advice}</p>}
                {p.followUpDate && <p className="text-sm text-neutral mt-1"><span className="font-medium text-gray-900">Follow-up:</span> {formatDate(p.followUpDate)}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
