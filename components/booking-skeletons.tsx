export function AppointmentTypeSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
    </div>
  )
}

export function DateSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
    </div>
  )
}

export function TimeSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
    </div>
  )
}