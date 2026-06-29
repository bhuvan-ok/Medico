import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../lib/axios.js';
import { useAuth } from '../../../hooks/useAuth.js';
import Avatar from '../../../components/ui/Avatar.jsx';
import Button from '../../../components/ui/Button.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import { formatCurrency } from '../../../utils/formatCurrency.js';
import {
  FiStar, FiClock, FiMapPin, FiGlobe, FiCheckCircle,
  FiAward, FiMessageSquare, FiVideo, FiUser,
  FiCalendar, FiBriefcase,
} from 'react-icons/fi';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function DoctorPublicProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get(`/doctors/${id}`),
      axiosInstance.get(`/doctors/${id}/reviews`),
    ])
      .then(([docRes, revRes]) => {
        setDoctor(docRes.data.data);
        setReviews(revRes.data.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!doctor) return <div className="text-center py-20">Doctor not found</div>;

  const avgRating = doctor.rating?.average?.toFixed(1) || null;
  const reviewCount = doctor.rating?.count || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="relative">
              <Avatar src={doctor.userId?.avatar?.url} name={doctor.userId?.name} size="xl" />
              {doctor.isVerified && (
                <span
                  title="Verified by MediBook"
                  className="absolute -bottom-1 -right-1 bg-success text-white rounded-full p-0.5 shadow"
                >
                  <FiCheckCircle size={16} />
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">Dr. {doctor.userId?.name}</h1>
                {doctor.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                    <FiCheckCircle size={11} /> Verified
                  </span>
                )}
              </div>
              <p className="text-primary font-semibold mt-1">{doctor.specialization}</p>

              <div className="flex items-center gap-4 mt-3 text-sm text-neutral flex-wrap">
                <span className="flex items-center gap-1.5">
                  <FiBriefcase size={13} className="text-primary" />
                  {doctor.experience} yrs experience
                </span>
                {doctor.hospital?.name && (
                  <span className="flex items-center gap-1.5">
                    <FiMapPin size={13} className="text-primary" />
                    {doctor.hospital.name}
                    {doctor.hospital.city ? `, ${doctor.hospital.city}` : ''}
                  </span>
                )}
                {avgRating && (
                  <span className="flex items-center gap-1.5">
                    <FiStar size={13} className="text-warning fill-warning" />
                    <span className="font-medium text-gray-700">{avgRating}</span>
                    <span>({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
                  </span>
                )}
              </div>

              {doctor.languages?.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-sm text-neutral">
                  <FiGlobe size={13} className="text-primary" />
                  <span>Speaks: {doctor.languages.join(', ')}</span>
                </div>
              )}

              {/* Appointment types */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {doctor.appointmentType?.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary"
                  >
                    {t === 'video' ? <FiVideo size={11} /> : <FiUser size={11} />}
                    {t === 'video' ? 'Video Consult' : 'In-Person'}
                  </span>
                ))}
              </div>
            </div>

            {/* Fee + CTA */}
            <div className="sm:text-right flex-shrink-0">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(doctor.consultationFee)}</p>
              <p className="text-xs text-neutral mt-0.5">per consultation</p>
              <Button
                className="mt-3 gap-2"
                onClick={() => isAuthenticated ? navigate(`/dashboard/book/${id}`) : navigate('/login')}
              >
                <FiCalendar size={14} />
                Book Appointment
              </Button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8">
          {/* Bio */}
          {doctor.bio && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiUser size={16} className="text-primary" /> About
              </h2>
              <p className="text-neutral text-sm leading-relaxed">{doctor.bio}</p>
            </div>
          )}

          {/* Qualifications */}
          {doctor.qualifications?.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiAward size={16} className="text-primary" /> Qualifications
              </h2>
              <div className="space-y-2">
                {doctor.qualifications.map((q, i) => (
                  <div key={i} className="flex items-start justify-between text-sm gap-4 py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FiAward size={13} className="text-primary" />
                      </div>
                      <span className="font-medium text-gray-900">{q.degree}</span>
                    </div>
                    <span className="text-neutral text-right">{q.institution}{q.year ? `, ${q.year}` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiMessageSquare size={16} className="text-primary" /> Patient Reviews
                <span className="ml-auto text-sm font-normal text-neutral flex items-center gap-1">
                  <FiStar size={13} className="text-warning fill-warning" />
                  {avgRating} average
                </span>
              </h2>
              <div className="space-y-3">
                {reviews.slice(0, 6).map((r) => (
                  <div key={r._id} className="bg-surface rounded-xl p-4 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <FiStar key={i} size={13} className={i < r.rating ? 'text-warning fill-warning' : 'text-gray-200'} />
                        ))}
                        <span className="text-xs text-neutral ml-1 font-medium">{RATING_LABELS[r.rating]}</span>
                      </div>
                      <span className="text-xs text-neutral">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    {r.comment && <p className="text-sm text-neutral leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
