import { useState } from 'react';
import { Link, NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  FiHome, FiCalendar, FiUser, FiFileText, FiSettings,
  FiBell, FiLogOut, FiMenu, FiUsers, FiBarChart2,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth.js';
import { logoutThunk } from '../features/auth/authSlice.js';
import Avatar from '../components/ui/Avatar.jsx';
import { useNotifications } from '../hooks/useNotifications.js';
import { ROLES } from '../lib/constants.js';

const NAV_LINKS = {
  [ROLES.PATIENT]: [
    { to: '/dashboard', label: 'Dashboard', icon: FiHome },
    { to: '/dashboard/appointments', label: 'Appointments', icon: FiCalendar },
    { to: '/dashboard/prescriptions', label: 'Prescriptions', icon: FiFileText },
    { to: '/dashboard/medical-reports', label: 'Medical Reports', icon: FiFileText },
    { to: '/dashboard/profile', label: 'Profile', icon: FiUser },
  ],
  [ROLES.DOCTOR]: [
    { to: '/doctor/dashboard', label: 'Dashboard', icon: FiHome },
    { to: '/doctor/appointments', label: 'Appointments', icon: FiCalendar },
    { to: '/doctor/schedule', label: 'My Schedule', icon: FiSettings },
    { to: '/doctor/profile', label: 'Profile', icon: FiUser },
  ],
  [ROLES.ADMIN]: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: FiHome },
    { to: '/admin/doctors', label: 'Doctors', icon: FiUsers },
    { to: '/admin/patients', label: 'Patients', icon: FiUsers },
    { to: '/admin/appointments', label: 'Appointments', icon: FiCalendar },
    { to: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
  ],
};

export default function DashboardLayout({ children = null }) {
  const { user, role } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navLinks = NAV_LINKS[role] || [];
  const baseRoute = role === ROLES.DOCTOR ? '/doctor' : role === ROLES.ADMIN ? '/admin' : '/dashboard';

  const handleLogout = () => {
    dispatch(logoutThunk());
    navigate('/login');
  };

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-white border-r border-border w-64">
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">Medi</span>
          <span className="text-xl font-bold text-gray-900">Book</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary pl-[10px]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent pl-[10px]'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar src={user?.avatar?.url} name={user?.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-neutral capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral hover:text-danger hover:bg-danger/5 rounded-lg transition-colors"
        >
          <FiLogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 h-full">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-border px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-neutral hover:text-gray-900"
          >
            <FiMenu size={20} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <Link to={`${baseRoute}/notifications`} className="relative text-neutral hover:text-gray-900">
              <FiBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-danger text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link to={`${baseRoute}/profile`}>
              <Avatar src={user?.avatar?.url} name={user?.name} size="sm" />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
