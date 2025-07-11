export function AppointmentTypeSkeleton() {
  return (
    <div className="space-y-2" role="status">
      <div className="h-4 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" aria-hidden="true"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" aria-hidden="true"></div>
    </div>
  )
}

export function DateSkeleton() {
  return (
    <div className="space-y-2" role="status">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" aria-hidden="true"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" aria-hidden="true"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" aria-hidden="true"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" aria-hidden="true"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" aria-hidden="true"></div>
    </div>
  )
}

export function TimeSkeleton() {
  return (
    <div className="space-y-2" role="status">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" aria-hidden="true"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" aria-hidden="true"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" aria-hidden="true"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" aria-hidden="true"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" aria-hidden="true"></div>
    </div>
  )
}