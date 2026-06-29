import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Button from '../components/ui/Button.jsx';
import Avatar from '../components/ui/Avatar.jsx';

export default function PublicLayout({ children }) {
  const { user, isAuthenticated, handleLogout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-1">
            <span className="text-xl font-bold text-primary">Medi</span>
            <span className="text-xl font-bold text-gray-900">Book</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/doctors" className="text-sm text-neutral hover:text-gray-900 transition-colors">
              Find Doctors
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button size="sm" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                <Avatar src={user?.avatar?.url} name={user?.name} size="sm" />
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate('/register')}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="bg-white border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-neutral">
          © {new Date().getFullYear()} MediBook. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
