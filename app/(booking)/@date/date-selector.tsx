'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { addDays, format, startOfDay } from 'date-fns';

interface DateSelectorProps {
  busyDates: string[] | Set<string>;
  selectedDate?: string;
}

export function DateSelector({ busyDates, selectedDate }: DateSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const handleSelect = (date: Date) => {
    const params = new URLSearchParams(searchParams);
    params.set('date', date.toISOString());
    router.push(`?${params.toString()}`);
  };
  
  const busyDatesSet = busyDates instanceof Set ? busyDates : new Set(busyDates);
  const today = startOfDay(new Date());
  const days = Array.from({ length: 5 }).map((_, i) => addDays(today, i));
  
  return (
    <ul className="space-y-2">
      {days.map((d) => {
        const iso = format(d, 'yyyy-MM-dd');
        const isBusy = busyDatesSet.has(iso);
        const isSelected = selectedDate && new Date(selectedDate).toDateString() === d.toDateString();
        
        return (
          <li key={iso}>
            <button
              onClick={() => handleSelect(d)}
              className={`w-full text-left p-2 rounded border hover:bg-gray-100 ${
                isBusy ? 'opacity-50' : ''
              } ${isSelected ? 'bg-blue-50 border-blue-300' : ''}`}
              disabled={isBusy}
            >
              {format(d, 'MMM d')}
              {isBusy ? ' (busy)' : ''}
            </button>
          </li>
        );
      })}
    </ul>
  );
}