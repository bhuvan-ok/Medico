export default function SkeletonCard({ lines = 3 }) {
  return (
    <div className="bg-white rounded-xl border border-border p-6 animate-pulse">
      <div className="flex gap-4 mb-4">
        <div className="h-12 w-12 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-gray-200 rounded mb-2" style={{ width: `${80 - i * 10}%` }} />
      ))}
    </div>
  );
}
