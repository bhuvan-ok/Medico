import { useState, useEffect } from 'react';
import axiosInstance from '../../../lib/axios.js';
import toast from 'react-hot-toast';
import Avatar from '../../../components/ui/Avatar.jsx';
import Button from '../../../components/ui/Button.jsx';
import Pagination from '../../../components/ui/Pagination.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import SkeletonCard from '../../../components/ui/SkeletonCard.jsx';
import { formatDate } from '../../../utils/formatDate.js';

export default function ManagePatients() {
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetch = () => {
    setLoading(true);
    axiosInstance.get(`/admin/patients?page=${page}&limit=10`)
      .then(({ data }) => { setPatients(data.data); setPagination(data.pagination); })
      .finally(() => setLoading(false));
  };
  useEffect(fetch, [page]);

  const suspend = async (id) => {
    await axiosInstance.patch(`/admin/patients/${id}/suspend`);
    toast.success('Patient suspended');
    fetch();
  };

  const activate = async (id) => {
    await axiosInstance.patch(`/admin/patients/${id}/activate`);
    toast.success('Patient activated');
    fetch();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manage Patients</h1>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}</div>
      ) : patients.length === 0 ? (
        <EmptyState title="No patients found" />
      ) : (
        <div className="space-y-3">
          {patients.map((p) => (
            <div key={p._id} className="bg-white rounded-xl border border-border p-5 flex items-center gap-4">
              <Avatar src={p.avatar?.url} name={p.name} />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{p.name}</p>
                <p className="text-sm text-neutral">{p.email} · Joined {formatDate(p.createdAt)}</p>
              </div>
              {p.isActive ? (
                <Button variant="outline" size="sm" onClick={() => suspend(p._id)}>Suspend</Button>
              ) : (
                <Button size="sm" onClick={() => activate(p._id)}>Activate</Button>
              )}
            </div>
          ))}
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
