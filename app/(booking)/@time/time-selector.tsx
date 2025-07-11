'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { addMinutes, format } from 'date-fns';
import { type AppointmentType } from '@/app/(booking)/data';

interface TimeSelectorProps {
  date: Date;
  appointmentType: AppointmentType;
  busyTimes: Array<{ startUtc: string; endUtc: string }>;
  selectedTime?: string;
}

export function TimeSelector({ date, appointmentType, busyTimes, selectedTime }: TimeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const handleSelect = (time: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('time', time);
    router.push(`?${params.toString()}`);
  };
  
  // Calculate available time slots
  const dateStr = format(date, "yyyy-MM-dd");
  
  // Create business hours in the user's local timezone (9 AM to 5 PM in their timezone)
  const businessStart = new Date(`${dateStr}T09:00:00`);
  const businessEnd = new Date(`${dateStr}T17:00:00`);

  const availableSlots: string[] = [];
  for (
    let t = businessStart;
    t < businessEnd;
    t = addMinutes(t, appointmentType.durationMinutes)
  ) {
    const start = t;
    const end = addMinutes(start, appointmentType.durationMinutes);

    // Convert start/end to UTC for comparison with busy times
    const startUTC = new Date(
      start.getTime() - start.getTimezoneOffset() * 60000,
    );
    const endUTC = new Date(
      end.getTime() - end.getTimezoneOffset() * 60000,
    );

    const overlap = busyTimes.some((b) => {
      const bStart = new Date(b.startUtc);
      const bEnd = new Date(b.endUtc);
      return bStart < endUTC && bEnd > startUTC;
    });
    if (!overlap) {
      // Display time in user's local timezone
      availableSlots.push(format(start, "HH:mm"));
    }
  }
  
  if (availableSlots.length === 0) {
    return <p className="text-muted-foreground">No times available</p>;
  }
  
  return (
    <ul className="space-y-2">
      {availableSlots.map((t) => (
        <li key={t}>
          <button
            onClick={() => handleSelect(t)}
            className={`w-full rounded border p-2 text-left hover:bg-gray-100 ${
              selectedTime === t ? 'bg-blue-50 border-blue-300' : ''
            }`}
          >
            {t}
          </button>
        </li>
      ))}
    </ul>
  );
}