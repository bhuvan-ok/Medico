import { useState, useEffect } from 'react';
import axiosInstance from '../../../lib/axios.js';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import SkeletonCard from '../../../components/ui/SkeletonCard.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import { formatDate } from '../../../utils/formatDate.js';
import { FiDownload } from 'react-icons/fi';
import Button from '../../../components/ui/Button.jsx';

export default function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/patients/me/prescriptions')
      .then(({ data }) => setPrescriptions(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
      {prescriptions.length === 0 ? (
        <EmptyState title="No prescriptions yet" description="Prescriptions from completed appointments will appear here" />
      ) : (
        <div className="space-y-4">
          {prescriptions.map((p) => (
            <div key={p._id} className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar src={p.doctorId?.avatar?.url} name={p.doctorId?.name} size="sm" />
                  <div>
                    <p className="font-medium text-gray-900">Dr. {p.doctorId?.name}</p>
                    <p className="text-xs text-neutral">{formatDate(p.createdAt)}</p>
                  </div>
                </div>
                {p.documentUrl?.url && (
                  <a href={p.documentUrl.url} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm"><FiDownload size={14} /></Button>
                  </a>
                )}
              </div>
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
          ))}
        </div>
      )}
    </div>
  );
}
