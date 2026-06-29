import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../authSlice.js';
import axiosInstance from '../../../lib/axios.js';
import Spinner from '../../../components/ui/Spinner.jsx';
import { ROLES } from '../../../lib/constants.js';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      navigate(`/login?error=${encodeURIComponent(error || 'oauth_failed')}`, { replace: true });
      return;
    }

    // Store the access token first so the axios interceptor can use it
    dispatch(setCredentials({ accessToken: decodeURIComponent(token) }));

    // Fetch the full user profile
    axiosInstance
      .get('/users/me', {
        headers: { Authorization: `Bearer ${decodeURIComponent(token)}` },
      })
      .then(({ data }) => {
        dispatch(setCredentials({ user: data.data }));
        const role = data.data.role;
        if (role === ROLES.DOCTOR) navigate('/doctor/dashboard', { replace: true });
        else if (role === ROLES.ADMIN) navigate('/admin/dashboard', { replace: true });
        else navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        navigate('/login?error=oauth_failed', { replace: true });
      });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen flex-col gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-neutral">Signing you in with Google…</p>
    </div>
  );
}
