"use client";

import { useBookingState } from "@/lib/hooks/use-booking-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCallback } from "react";

interface TimeSelectorProps {
  type?: string | null;
  date?: string | null;
  slots: string[];
  error: string | null;
  selectedTime?: string;
  onSelect?: (time: string) => void;
}

export function TimeSelector({
  type,
  date,
  slots,
  error,
  selectedTime,
  onSelect,
}: TimeSelectorProps) {
  const { updateBookingStep } = useBookingState();

  const handleSelectTime = useCallback(
    (selectedTime: string) => {
      if (onSelect) {
        onSelect(selectedTime);
      } else {
        updateBookingStep({ selectedTime });
      }
    },
    [updateBookingStep, onSelect],
  );

  const handleButtonClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const button = event.currentTarget;
      const selectedTime = button.dataset.time;
      if (selectedTime) {
        handleSelectTime(selectedTime);
      }
    },
    [handleSelectTime],
  );

  if (type === null || date === null) {
    return <p className="text-muted-foreground">Select a date first.</p>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (slots.length === 0) {
    return <p className="text-muted-foreground">No times available</p>;
  }

  return (
    <div>
      <h2 className="mb-3 font-medium">Select Time</h2>
      <ul className="space-y-2">
        {slots.map((t) => (
          <li key={t}>
            <button
              onClick={handleButtonClick}
              data-time={t}
              className={`w-full rounded border p-2 text-left hover:bg-gray-100 ${
                selectedTime === t ? "border-blue-300 bg-blue-50" : ""
              }`}
            >
              {t}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
