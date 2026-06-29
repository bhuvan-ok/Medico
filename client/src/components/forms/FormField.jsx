import { cn } from '../../utils/cn.js';

export default function FormField({ label, error, children, className }) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
