import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../hooks/useAuth.js';
import { selectInitializing } from '../features/auth/authSlice.js';
import Spinner from '../components/ui/Spinner.jsx';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const initializing = useSelector(selectInitializing);
  const location = useLocation();

  // Wait for the startup refresh-token check before deciding to redirect
  if (initializing || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
