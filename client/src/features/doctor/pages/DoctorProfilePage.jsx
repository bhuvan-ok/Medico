import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosInstance from '../../../lib/axios.js';
import toast from 'react-hot-toast';
import Input from '../../../components/ui/Input.jsx';
import Button from '../../../components/ui/Button.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import { useAuth } from '../../../hooks/useAuth.js';
import { FiCamera, FiUpload } from 'react-icons/fi';
import { SPECIALIZATIONS } from '../../../lib/constants.js';

const schema = z.object({
  bio: z.string().max(500).optional(),
  experience: z.number().min(0).optional(),
  consultationFee: z.number().min(0).optional(),
  languages: z.string().optional(),
  hospitalName: z.string().optional(),
  hospitalAddress: z.string().optional(),
});

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const licenseRef = useRef();

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    axiosInstance.get('/doctors/me/profile')
      .then(({ data }) => {
        setProfile(data.data);
        reset({
          bio: data.data.bio,
          experience: data.data.experience,
          consultationFee: data.data.consultationFee,
          languages: data.data.languages?.join(', '),
          hospitalName: data.data.hospital?.name,
          hospitalAddress: data.data.hospital?.address,
        });
      })
      .finally(() => setLoading(false));
  }, [reset]);

  const onSave = async (data) => {
    const payload = {
      bio: data.bio,
      experience: Number(data.experience),
      consultationFee: Number(data.consultationFee),
      languages: data.languages ? data.languages.split(',').map((l) => l.trim()).filter(Boolean) : [],
      hospital: { name: data.hospitalName, address: data.hospitalAddress },
    };
    const { data: res } = await axiosInstance.put('/doctors/me/profile', payload);
    setProfile(res.data);
    toast.success('Profile updated');
  };

  const uploadLicense = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('licenseDocument', file);
    const { data } = await axiosInstance.patch('/doctors/me/profile/license', fd);
    setProfile(data.data);
    toast.success('License document updated');
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Doctor Profile</h1>

      {/* Status badge */}
      {!profile?.isVerified && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 text-sm text-warning font-medium">
          Your profile is pending admin verification. You cannot accept appointments until verified.
        </div>
      )}

      <div className="bg-white rounded-xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-4">
          <Avatar src={user?.avatar?.url} name={user?.name} size="xl" />
          <div>
            <p className="font-bold text-lg text-gray-900">{user?.name}</p>
            <p className="text-sm text-primary">{profile?.specialization}</p>
            <p className="text-xs text-neutral">License: {profile?.licenseNumber}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Bio</label>
            <textarea
              {...register('bio')}
              rows={3}
              placeholder="Tell patients about yourself..."
              className="w-full rounded-lg border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Experience (years)" type="number" {...register('experience', { valueAsNumber: true })} />
            <Input label="Consultation Fee (₹)" type="number" {...register('consultationFee', { valueAsNumber: true })} />
          </div>
          <Input label="Languages (comma-separated)" placeholder="English, Hindi" {...register('languages')} />
          <Input label="Hospital Name" {...register('hospitalName')} />
          <Input label="Hospital Address" {...register('hospitalAddress')} />
          <Button type="submit" loading={isSubmitting}>Save Profile</Button>
        </form>
      </div>

      {/* License document */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="font-semibold text-gray-900 mb-3">License Document</h2>
        {profile?.licenseDocument?.url ? (
          <div className="flex items-center gap-4">
            <a href={profile.licenseDocument.url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
              View current license
            </a>
            <Button variant="outline" size="sm" onClick={() => licenseRef.current?.click()}>
              <FiUpload size={14} /> Update
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => licenseRef.current?.click()}>
            <FiUpload size={14} /> Upload License
          </Button>
        )}
        <input ref={licenseRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={uploadLicense} />
      </div>
    </div>
  );
}
