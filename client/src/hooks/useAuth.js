import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, selectAuthLoading, selectAccessToken, logoutThunk } from '../features/auth/authSlice.js';

export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const loading = useSelector(selectAuthLoading);
  const accessToken = useSelector(selectAccessToken);

  return {
    user,
    loading,
    accessToken,
    isAuthenticated: !!user,
    role: user?.role,
    handleLogout: () => dispatch(logoutThunk()),
  };
};
