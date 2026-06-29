import { cn } from '../../utils/cn.js';
import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, className, ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors',
        error && 'border-danger focus:ring-danger',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
));
Input.displayName = 'Input';
export default Input;
