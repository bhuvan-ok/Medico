import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../../lib/axios.js';
import { useDebounce } from '../../../hooks/useDebounce.js';
import Input from '../../../components/ui/Input.jsx';
import Button from '../../../components/ui/Button.jsx';
import SkeletonCard from '../../../components/ui/SkeletonCard.jsx';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import Pagination from '../../../components/ui/Pagination.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import { formatCurrency } from '../../../utils/formatCurrency.js';
import { FiStar, FiMapPin, FiClock, FiVideo, FiUser, FiSearch, FiBriefcase } from 'react-icons/fi';
import { SPECIALIZATIONS } from '../../../lib/constants.js';

export default function DoctorSearchPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(params.get('search') || '');
  const [specialization, setSpecialization] = useState(params.get('specialization') || '');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({ page, limit: 12 });
        if (debouncedSearch) query.set('search', debouncedSearch);
        if (specialization) query.set('specialization', specialization);
        const { data } = await axiosInstance.get(`/doctors?${query}`);
        setDoctors(data.data);
        setPagination(data.pagination);
      } catch {
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [debouncedSearch, specialization, page]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Find a Doctor</h1>
        <p className="text-neutral mt-1">Search from {pagination.total ?? '—'} verified doctors</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 mb-8 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral" />
          <input
            placeholder="Search by doctor name or specialization..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={specialization}
          onChange={(e) => { setSpecialization(e.target.value); setPage(1); }}
          className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Specializations</option>
          {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : doctors.length === 0 ? (
        <EmptyState title="No doctors found" description="Try adjusting your search filters" />
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor._id} doctor={doctor} onView={() => navigate(`/doctors/${doctor.userId?._id}`)} />
            ))}
          </div>
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

function DoctorCard({ doctor, onView }) {
  const avgRating = doctor.rating?.average;
  const reviewCount = doctor.rating?.count || 0;

  return (
    <div
      className="bg-white rounded-xl border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
      onClick={onView}
    >
      {/* Top row */}
      <div className="flex gap-4 mb-4">
        <Avatar src={doctor.userId?.avatar?.url} name={doctor.userId?.name} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors truncate">
            Dr. {doctor.userId?.name}
          </h3>
          <p className="text-sm text-primary font-medium">{doctor.specialization}</p>
          <div className="flex items-center gap-1 mt-1">
            <FiStar size={12} className="text-warning fill-warning flex-shrink-0" />
            <span className="text-xs text-neutral">
              {avgRating ? avgRating.toFixed(1) : 'New'}{' '}
              {reviewCount > 0 && <span>({reviewCount})</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-sm text-neutral mb-4">
        <div className="flex items-center gap-2">
          <FiBriefcase size={13} className="flex-shrink-0" />
          <span>{doctor.experience} yrs experience</span>
        </div>
        {doctor.hospital?.name && (
          <div className="flex items-center gap-2">
            <FiMapPin size={13} className="flex-shrink-0" />
            <span className="truncate">{doctor.hospital.name}{doctor.hospital.city ? `, ${doctor.hospital.city}` : ''}</span>
          </div>
        )}
      </div>

      {/* Appointment types */}
      {doctor.appointmentType?.length > 0 && (
        <div className="flex gap-1.5 mb-4">
          {doctor.appointmentType.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-50 border border-border text-neutral"
            >
              {t === 'video' ? <FiVideo size={10} /> : <FiUser size={10} />}
              {t === 'video' ? 'Video' : 'In-Person'}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div>
          <span className="font-bold text-gray-900">{formatCurrency(doctor.consultationFee)}</span>
          <span className="text-xs text-neutral ml-1">/ visit</span>
        </div>
        <Button size="sm" className="gap-1.5">
          <FiClock size={12} /> Book
        </Button>
      </div>
    </div>
  );
}
