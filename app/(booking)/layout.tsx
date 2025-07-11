import { Suspense } from 'react'
import { AppointmentTypeSkeleton, DateSkeleton, TimeSkeleton } from '@/components/booking'

export default function BookingLayout({
  children,
  apptType,
  date,
  time,
}: {
  children: React.ReactNode
  apptType: React.ReactNode
  date: React.ReactNode
  time: React.ReactNode
}) {
  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Suspense fallback={<AppointmentTypeSkeleton />}>{apptType}</Suspense>
        <Suspense fallback={<DateSkeleton />}>{date}</Suspense>
        <Suspense fallback={<TimeSkeleton />}>{time}</Suspense>
      </div>
      {children}
    </div>
  )
}
