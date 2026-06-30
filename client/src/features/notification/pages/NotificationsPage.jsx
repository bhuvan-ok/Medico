import { useEffect } from 'react';
import { useNotifications } from '../../../hooks/useNotifications.js';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import SkeletonCard from '../../../components/ui/SkeletonCard.jsx';
import { formatDateTime } from '../../../utils/formatDate.js';
import { cn } from '../../../utils/cn.js';

export default function NotificationsPage() {
  const { notifications, loading, markAllRead, unreadCount } = useNotifications();

  // Auto-clear badge as soon as user opens this page
  useEffect(() => {
    if (unreadCount > 0) markAllRead();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}</div>
      ) : notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={cn(
                'bg-white rounded-xl border p-4 transition-colors',
                n.isRead ? 'border-border' : 'border-primary/30 bg-primary/5'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={cn('text-sm font-medium', n.isRead ? 'text-gray-700' : 'text-gray-900')}>
                    {n.title}
                  </p>
                  <p className="text-sm text-neutral mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
