import {
  AppointmentTypeSkeleton,
  DateSkeleton,
  TimeSkeleton,
} from "@/app/(booking)/components/booking-skeletons";
import { Suspense } from "react";

export default function BookingLayout({
  children,
  apptType,
  date,
  time,
}: {
  children: React.ReactNode;
  apptType: React.ReactNode;
  date: React.ReactNode;
  time: React.ReactNode;
}) {
  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Suspense fallback={<AppointmentTypeSkeleton />}>{apptType}</Suspense>
        <Suspense fallback={<DateSkeleton />}>{date}</Suspense>
        <Suspense fallback={<TimeSkeleton />}>{time}</Suspense>
      </div>
      {children}
    </div>
  );
}
