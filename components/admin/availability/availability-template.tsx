"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { DayAvailability } from "./day-availability";
import { useAvailabilityTemplate } from "./use-availability-template";

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export function AvailabilityTemplate() {
  const {
    availability,
    isLoading,
    error,
    isPending,
    toggleDay,
    addSlot,
    removeSlot,
    updateSlot,
    handleSave,
  } = useAvailabilityTemplate();

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading availability template...</span>
        </div>
      ) : (
        <div className="grid gap-4">
          {DAYS.map(({ key, label }) => (
            <DayAvailability
              key={key}
              dayKey={key}
              dayLabel={label}
              availability={availability[key]}
              onToggleDay={() => toggleDay(key)}
              onAddSlot={() => addSlot(key)}
              onRemoveSlot={(index) => removeSlot(key, index)}
              onUpdateSlot={(index, field, value) => updateSlot(key, index, field, value)}
            />
          ))}
        </div>
      )}

      <Separator />

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isPending || isLoading}
          className="px-8"
        >
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Availability Template
        </Button>
      </div>
    </div>
  );
}