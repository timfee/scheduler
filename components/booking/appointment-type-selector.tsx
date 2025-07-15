"use client";

import { type AppointmentType } from "@/app/(booking)/server/data";
import { useBookingState } from "@/lib/hooks/use-booking-state";
import { useCallback } from "react";

interface AppointmentTypeSelectorProps {
  types: AppointmentType[];
  selectedType?: string;
  onSelect?: (typeId: string) => void;
}

export function AppointmentTypeSelector({
  types,
  selectedType,
  onSelect,
}: AppointmentTypeSelectorProps) {
  const { updateBookingStep } = useBookingState();

  const handleSelectType = useCallback(
    (typeId: string) => {
      if (onSelect) {
        onSelect(typeId);
      } else {
        updateBookingStep({ type: typeId });
      }
    },
    [updateBookingStep, onSelect],
  );

  const handleButtonClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const button = event.currentTarget;
      const typeId = button.dataset.typeId;
      if (typeId) {
        handleSelectType(typeId);
      }
    },
    [handleSelectType],
  );

  return (
    <div>
      <h2 className="mb-3 font-medium">Select Appointment Type</h2>
      <ul className="space-y-2">
        {types.map((t) => (
          <li key={t.id}>
            <button
              onClick={handleButtonClick}
              data-type-id={t.id}
              className={`w-full rounded border p-2 text-left hover:bg-gray-100 ${
                selectedType === t.id ? "border-blue-300 bg-blue-50" : ""
              }`}
            >
              {t.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
