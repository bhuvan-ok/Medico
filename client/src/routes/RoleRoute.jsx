import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function RoleRoute({ children, roles }) {
  const { role } = useAuth();
  if (!roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}
