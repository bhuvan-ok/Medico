import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import axiosInstance from '../../../lib/axios.js';
import { setCredentials } from '../../auth/authSlice.js';
// setCredentials is a sync action — no conflict
import { useAuth } from '../../../hooks/useAuth.js';
import toast from 'react-hot-toast';
import Input from '../../../components/ui/Input.jsx';
import Button from '../../../components/ui/Button.jsx';
import Avatar from '../../../components/ui/Avatar.jsx';
import { FiCamera } from 'react-icons/fi';

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
}).refine((d) => d.currentPassword !== d.newPassword, { message: 'New password must differ', path: ['newPassword'] });

export default function PatientProfile() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const avatarRef = useRef();
  const [avatarLoading, setAvatarLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name, phone: user?.phone },
  });

  const { register: rPwd, handleSubmit: hPwd, reset: rPwdReset, formState: { errors: ePwd, isSubmitting: isPwdSubmitting } } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSave = async (data) => {
    const { data: res } = await axiosInstance.patch('/users/me', data);
    dispatch(setCredentials({ user: res.data }));
    toast.success('Profile updated');
  };

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    setAvatarLoading(true);
    try {
      const { data } = await axiosInstance.patch('/users/me/avatar', fd);
      dispatch(setCredentials({ user: data.data }));
      toast.success('Avatar updated');
    } finally {
      setAvatarLoading(false);
    }
  };

  const onPasswordChange = async (data) => {
    await axiosInstance.patch('/users/me/password', data);
    toast.success('Password changed');
    rPwdReset();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {/* Avatar */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar src={user?.avatar?.url} name={user?.name} size="xl" />
            <button
              onClick={() => avatarRef.current?.click()}
              className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center shadow-sm hover:bg-sky-600 transition-colors"
            >
              <FiCamera size={12} />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{user?.name}</p>
            <p className="text-sm text-neutral">{user?.email}</p>
            <p className="text-xs text-neutral capitalize mt-1 bg-surface px-2 py-0.5 rounded-full inline-block">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Personal Information</h2>
        <form onSubmit={handleSubmit(onProfileSave)} className="space-y-4">
          <Input label="Full Name" {...register('name')} error={errors.name?.message} />
          <Input label="Phone" type="tel" {...register('phone')} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Gender</label>
            <select {...register('gender')} className="rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Select gender</option>
              {['male', 'female', 'other'].map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <Button type="submit" loading={isSubmitting}>Save Changes</Button>
        </form>
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={hPwd(onPasswordChange)} className="space-y-4">
          <Input label="Current Password" type="password" {...rPwd('currentPassword')} error={ePwd.currentPassword?.message} />
          <Input label="New Password" type="password" {...rPwd('newPassword')} error={ePwd.newPassword?.message} />
          <Button type="submit" loading={isPwdSubmitting}>Change Password</Button>
        </form>
      </div>
    </div>
  );
}
