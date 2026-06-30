import { Link } from 'react-router-dom';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../hooks/useTheme.js';

export default function AuthLayout({ children, title, subtitle }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">Medi</span>
            <span className="text-2xl font-bold text-gray-900">Book</span>
          </Link>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="text-neutral hover:text-gray-900 transition-colors"
          >
            {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
          {title && <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>}
          {subtitle && <p className="text-sm text-neutral mb-6">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
