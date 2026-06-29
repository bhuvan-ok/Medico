import { Link } from 'react-router-dom';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <span className="text-2xl font-bold text-primary">Medi</span>
        <span className="text-2xl font-bold text-gray-900">Book</span>
      </Link>
      <div className="w-full max-w-md bg-white rounded-2xl border border-border shadow-sm p-8">
        {title && <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>}
        {subtitle && <p className="text-sm text-neutral mb-6">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
