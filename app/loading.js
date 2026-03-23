export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-64 mb-8"></div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-28 flex flex-col justify-between">
            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            <div className="h-8 bg-gray-100 rounded w-12 mt-2"></div>
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-8 h-36">
        <div className="h-5 bg-gray-100 rounded w-32 mb-5"></div>
        <div className="flex gap-3">
          <div className="h-10 bg-gray-100 rounded w-32"></div>
          <div className="h-10 bg-gray-100 rounded w-32"></div>
          <div className="h-10 bg-gray-100 rounded w-32"></div>
        </div>
      </div>

      {/* Recent Matches Skeleton */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-64">
        <div className="h-5 bg-gray-100 rounded w-40 mb-5"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
              <div className="space-y-2 w-1/2">
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
              <div className="flex gap-3 w-1/4 justify-end">
                <div className="h-5 bg-gray-100 rounded w-16"></div>
                <div className="h-7 bg-gray-100 rounded w-10"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
