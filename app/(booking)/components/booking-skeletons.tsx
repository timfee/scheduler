export function AppointmentTypeSkeleton() {
  return (
    <div className="space-y-2" role="status">
      <div
        className="h-4 animate-pulse rounded bg-gray-200"
        aria-hidden="true"
      ></div>
      <div
        className="h-4 w-3/4 animate-pulse rounded bg-gray-200"
        aria-hidden="true"
      ></div>
      <div
        className="h-4 w-1/2 animate-pulse rounded bg-gray-200"
        aria-hidden="true"
      ></div>
    </div>
  );
}

export function DateSkeleton() {
  return (
    <div className="space-y-2" role="status">
      <div
        className="h-4 w-2/3 animate-pulse rounded bg-gray-200"
        aria-hidden="true"
      ></div>
      <div
        className="h-4 w-1/2 animate-pulse rounded bg-gray-200"
        aria-hidden="true"
      ></div>
      <div
        className="h-4 w-3/4 animate-pulse rounded bg-gray-200"
        aria-hidden="true"
      ></div>
      <div
        className="h-4 w-1/3 animate-pulse rounded bg-gray-200"
        aria-hidden="true"
      ></div>
      <div
        className="h-4 w-2/3 animate-pulse rounded bg-gray-200"
        aria-hidden="true"
      ></div>
    </div>
  );
}

export function TimeSkeleton() {
  return (
    <div className="space-y-2" role="status">
      <div
        className="h-4 w-1/4 animate-pulse rounded bg-gray-200"
        aria-hidden="true"
      ></div>
      <div
        className="h-4 w-1/4 animate-pulse rounded bg-gray-200"
        aria-hidden="true"
      ></div>
      <div
        className="h-4 w-1/4 animate-pulse rounded bg-gray-200"
        aria-hidden="true"
      ></div>
      <div
        className="h-4 w-1/4 animate-pulse rounded bg-gray-200"
        aria-hidden="true"
      ></div>
      <div
        className="h-4 w-1/4 animate-pulse rounded bg-gray-200"
        aria-hidden="true"
      ></div>
    </div>
  );
}
