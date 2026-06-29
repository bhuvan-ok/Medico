import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../../../lib/axios.js';
import Input from '../../../components/ui/Input.jsx';
import Button from '../../../components/ui/Button.jsx';

const schema = z.object({ email: z.string().email('Invalid email') });

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await axiosInstance.post('/auth/forgot-password', data);
      setSent(true);
      toast.success('Reset link sent to your email');
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-3">
        <p className="text-4xl">📧</p>
        <p className="font-semibold text-gray-900">Check your inbox</p>
        <p className="text-sm text-neutral">We sent a password reset link to your email.</p>
        <Link to="/login" className="text-sm text-primary hover:underline">Back to login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
      <Button type="submit" className="w-full" loading={loading}>Send Reset Link</Button>
      <p className="text-center text-sm">
        <Link to="/login" className="text-primary hover:underline">Back to login</Link>
      </p>
    </form>
  );
}
