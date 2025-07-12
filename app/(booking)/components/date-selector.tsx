"use client";

import { useBookingState } from "@/app/(booking)/hooks/use-booking-state";
import { addDays, format, startOfDay } from "date-fns";
import { useCallback } from "react";

interface DateSelectorProps {
  type?: string | null;
  busyDates: Set<string> | string[];
  selectedDate?: string;
  onSelect?: (date: Date) => void;
}

export function DateSelector({
  type,
  busyDates,
  selectedDate,
  onSelect,
}: DateSelectorProps) {
  const { updateBookingStep } = useBookingState();

  const handleSelectDate = useCallback(
    (selectedDate: Date) => {
      updateBookingStep({ selectedDate });
    },
    [updateBookingStep],
  );

  const handleButtonClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const button = event.currentTarget;
      const dateStr = button.dataset.date;
      if (dateStr) {
        const selectedDate = new Date(dateStr);
        handleSelectDate(selectedDate);
      }
    },
    [handleSelectDate],
  );

  if (type === null) {
    return <p className="text-muted-foreground">Select a type first.</p>;
  }

  const busyDatesSet =
    busyDates instanceof Set ? busyDates : new Set(busyDates);
  const today = startOfDay(new Date());
  const days = Array.from({ length: 5 }).map((_, i) => addDays(today, i));

  return (
    <div>
      <h2 className="mb-3 font-medium">Select Date</h2>
      <ul className="space-y-2">
        {days.map((d) => {
          const iso = format(d, "yyyy-MM-dd");
          const isBusy = busyDatesSet.has(iso);
          const isSelected =
            selectedDate &&
            new Date(selectedDate).toDateString() === d.toDateString();
          return (
            <li key={iso}>
              <button
                onClick={handleButtonClick}
                data-date={d.toISOString()}
                className={`w-full rounded border p-2 text-left hover:bg-gray-100 ${
                  isBusy ? "opacity-50" : ""
                } ${isSelected ? "border-blue-300 bg-blue-50" : ""}`}
                disabled={isBusy}
              >
                {format(d, "MMM d")}
                {isBusy ? " (busy)" : ""}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
