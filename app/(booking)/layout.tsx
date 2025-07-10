import { Suspense } from 'react'

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
    <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      <Suspense fallback={<p>Loading types...</p>}>{apptType}</Suspense>
      <Suspense fallback={<p>Loading dates...</p>}>{date}</Suspense>
      <Suspense fallback={<p>Loading times...</p>}>{time}</Suspense>
      {children}
    </div>
  )
}
