import { cn } from '../../utils/cn.js';
import { STATUS_COLORS } from '../../lib/constants.js';

export default function Badge({ status, children, className }) {
  const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', color, className)}>
      {children || status}
    </span>
  );
}
