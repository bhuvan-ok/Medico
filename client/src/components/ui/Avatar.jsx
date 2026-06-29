import { cn } from '../../utils/cn.js';

const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-xl', xl: 'h-24 w-24 text-3xl' };

export default function Avatar({ src, name = '', size = 'md', className }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return src ? (
    <img
      src={src}
      alt={name}
      className={cn('rounded-full object-cover bg-surface', sizes[size], className)}
    />
  ) : (
    <div
      className={cn(
        'rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center',
        sizes[size],
        className
      )}
    >
      {initials || '?'}
    </div>
  );
}
