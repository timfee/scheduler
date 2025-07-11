'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { type AppointmentType } from '@/app/(booking)/data';

interface AppointmentTypeSelectorProps {
  types: AppointmentType[];
  selectedType?: string;
}

export function AppointmentTypeSelector({ types, selectedType }: AppointmentTypeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const handleSelect = (typeId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('type', typeId);
    router.push(`?${params.toString()}`);
  };
  
  return (
    <ul className="space-y-2">
      {types.map(t => (
        <li key={t.id}>
          <button
            onClick={() => handleSelect(t.id)}
            className={`w-full text-left p-2 hover:bg-gray-100 rounded border ${
              selectedType === t.id ? 'bg-blue-50 border-blue-300' : ''
            }`}
          >
            {t.name}
          </button>
        </li>
      ))}
    </ul>
  );
}