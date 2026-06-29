import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../../lib/axios.js';
import Spinner from '../../../components/ui/Spinner.jsx';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    axiosInstance
      .get(`/auth/verify-email/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  if (status === 'loading') return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="text-center space-y-4">
      {status === 'success' ? (
        <>
          <p className="text-5xl">✅</p>
          <p className="font-semibold text-gray-900">Email verified!</p>
          <p className="text-sm text-neutral">Your account is now active.</p>
        </>
      ) : (
        <>
          <p className="text-5xl">❌</p>
          <p className="font-semibold text-gray-900">Verification failed</p>
          <p className="text-sm text-neutral">The link may have expired.</p>
        </>
      )}
      <Link to="/login" className="text-primary hover:underline text-sm">Go to login</Link>
    </div>
  );
}
