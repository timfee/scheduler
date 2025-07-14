"use client";

import {
  loadAvailabilityTemplateAction,
  saveAvailabilityTemplateAction,
} from "@/app/admin/availability/server/actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BUSINESS_HOURS } from "@/lib/constants";
import { mapErrorToUserMessage } from "@/lib/errors";
import {
  type TimeSlot,
  type WeeklyAvailability,
} from "@/lib/schemas/availability";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { DayAvailability } from "./day-availability";

// Generate unique ID for slots
const generateSlotId = () => `slot-${crypto.randomUUID()}`;

// Create default slot with ID
const createDefaultSlot = (
  start = BUSINESS_HOURS.DEFAULT_START,
  end = BUSINESS_HOURS.DEFAULT_END,
) => ({
  id: generateSlotId(),
  start,
  end,
});

// Type for slots that are guaranteed to have IDs
type SlotWithId = Required<Pick<TimeSlot, "id">> & TimeSlot;

// Type for availability with guaranteed slot IDs
type WeeklyAvailabilityWithIds = {
  [K in keyof WeeklyAvailability]: {
    enabled: boolean;
    slots: SlotWithId[];
  };
};

type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const DEFAULT_AVAILABILITY: WeeklyAvailability = {
  monday: { enabled: true, slots: [createDefaultSlot()] },
  tuesday: { enabled: true, slots: [createDefaultSlot()] },
  wednesday: { enabled: true, slots: [createDefaultSlot()] },
  thursday: { enabled: true, slots: [createDefaultSlot()] },
  friday: { enabled: true, slots: [createDefaultSlot()] },
  saturday: { enabled: false, slots: [] },
  sunday: { enabled: false, slots: [] },
};

export function AvailabilityTemplate() {
  const [availability, setAvailability] = useState<WeeklyAvailabilityWithIds>(
    DEFAULT_AVAILABILITY as WeeklyAvailabilityWithIds,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Ensure slots have unique IDs
  const ensureSlotIds = (
    availability: WeeklyAvailability,
  ): WeeklyAvailabilityWithIds => {
    const updated = { ...availability };
    Object.keys(updated).forEach((day) => {
      const dayKey = day as keyof WeeklyAvailability;
      updated[dayKey] = {
        ...updated[dayKey],
        slots: updated[dayKey].slots.map((slot) => ({
          ...slot,
          id: slot.id ?? generateSlotId(),
        })),
      };
    });
    return updated as WeeklyAvailabilityWithIds;
  };

  // Load existing availability template on component mount
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const template = await loadAvailabilityTemplateAction();
        if (template) {
          setAvailability(ensureSlotIds(template));
        }
      } catch (error) {
        console.error("Failed to load availability template:", error);
        setError(
          mapErrorToUserMessage(error, "Failed to load availability template"),
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadTemplate();
  }, []);

  const toggleDay = (day: DayOfWeek) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
        slots: !prev[day].enabled ? [createDefaultSlot()] : prev[day].slots,
      },
    }));
  };

  const addSlot = (day: DayOfWeek) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, createDefaultSlot()],
      },
    }));
  };

  const removeSlot = (day: DayOfWeek, slotId: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((slot) => slot.id !== slotId),
      },
    }));
  };

  const updateSlot = (
    day: DayOfWeek,
    slotId: string,
    field: "start" | "end",
    value: string,
  ) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot) =>
          slot.id === slotId ? { ...slot, [field]: value } : slot,
        ),
      },
    }));
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        setError(null);
        await saveAvailabilityTemplateAction(availability);
        // Success - could add a toast notification here
      } catch (error) {
        console.error("Failed to save availability template:", error);
        setError(
          mapErrorToUserMessage(error, "Failed to save availability template"),
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
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
              onRemoveSlot={(index) => {
                const slot = availability[key].slots[index];
                if (slot?.id) removeSlot(key, slot.id);
              }}
              onUpdateSlot={(index, field, value) => {
                const slot = availability[key].slots[index];
                if (slot?.id) updateSlot(key, slot.id, field, value);
              }}
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
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Availability Template
        </Button>
      </div>
    </div>
  );
}
