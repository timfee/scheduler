'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface TimeSelectorProps {
  slots: string[];
  error: string | null;
  selectedTime?: string;
}

export function TimeSelector({ slots, error, selectedTime }: TimeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const handleSelect = (time: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('time', time);
    router.push(`?${params.toString()}`);
  };
  
  if (error) {
    return <p className="text-red-500">{error}</p>;
  }
  
  if (slots.length === 0) {
    return <p className="text-muted-foreground">No times available</p>;
  }
  
  return (
    <ul className="space-y-2">
      {slots.map((t) => (
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