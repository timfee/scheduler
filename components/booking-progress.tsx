interface BookingProgressProps {
  progress: number
  total?: number
}

export function BookingProgress({ progress, total = 3 }: BookingProgressProps) {
  // Clamp progress to valid range [0, total]
  const clampedProgress = Math.max(0, Math.min(progress, total))
  
  return (
    <div className="flex items-center space-x-2 mb-4">
      <div className="flex space-x-1">
        {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              step <= clampedProgress ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-600">
        Step {clampedProgress} of {total}
      </span>
    </div>
  )
}