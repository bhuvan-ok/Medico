import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../../lib/axios.js';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import SkeletonCard from '../../../components/ui/SkeletonCard.jsx';
import { formatDate } from '../../../utils/formatDate.js';
import { FiUpload, FiDownload, FiTrash2, FiFileText } from 'react-icons/fi';

const TYPES = ['blood-test', 'xray', 'mri', 'scan', 'other'];

export default function MedicalReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const [form, setForm] = useState({ title: '', reportType: 'other' });

  const fetchReports = () => {
    setLoading(true);
    axiosInstance.get('/patients/me/medical-reports')
      .then(({ data }) => setReports(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !form.title) return toast.error('Please enter a title first');
    const fd = new FormData();
    fd.append('report', file);
    fd.append('title', form.title);
    fd.append('reportType', form.reportType);
    setUploading(true);
    try {
      await axiosInstance.post('/patients/me/medical-reports', fd);
      toast.success('Report uploaded');
      setForm({ title: '', reportType: 'other' });
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    await axiosInstance.delete(`/patients/me/medical-reports/${id}`);
    toast.success('Report deleted');
    setReports((prev) => prev.filter((r) => r._id !== id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Medical Reports</h1>

      {/* Upload card */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Upload New Report</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Report title (e.g. Blood test June 2025)"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <select
            className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={form.reportType}
            onChange={(e) => setForm((f) => ({ ...f, reportType: e.target.value }))}
          >
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <Button loading={uploading} onClick={() => fileRef.current?.click()} className="gap-2">
            <FiUpload size={15} /> Upload
          </Button>
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}</div>
      ) : reports.length === 0 ? (
        <EmptyState title="No reports yet" description="Upload your first medical report" />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r._id} className="bg-white rounded-xl border border-border p-5 flex items-center gap-4">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <FiFileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{r.title}</p>
                <p className="text-xs text-neutral capitalize">{r.reportType} · {formatDate(r.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <a href={r.fileUrl?.url} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm"><FiDownload size={14} /></Button>
                </a>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(r._id)} className="text-danger hover:bg-danger/5">
                  <FiTrash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
