import {
  loadAvailabilityTemplateAction,
  saveAvailabilityTemplateAction,
} from "@/app/admin/availability/server/actions";
import { BUSINESS_HOURS } from "@/lib/constants";
import { mapErrorToUserMessage } from "@/lib/errors";
import {
  type DayOfWeek,
  type WeeklyAvailability,
} from "@/lib/schemas/availability";
import { useEffect, useState, useTransition } from "react";

const DEFAULT_AVAILABILITY: WeeklyAvailability = {
  monday: {
    enabled: true,
    slots: [
      { start: BUSINESS_HOURS.DEFAULT_START, end: BUSINESS_HOURS.DEFAULT_END },
    ],
  },
  tuesday: {
    enabled: true,
    slots: [
      { start: BUSINESS_HOURS.DEFAULT_START, end: BUSINESS_HOURS.DEFAULT_END },
    ],
  },
  wednesday: {
    enabled: true,
    slots: [
      { start: BUSINESS_HOURS.DEFAULT_START, end: BUSINESS_HOURS.DEFAULT_END },
    ],
  },
  thursday: {
    enabled: true,
    slots: [
      { start: BUSINESS_HOURS.DEFAULT_START, end: BUSINESS_HOURS.DEFAULT_END },
    ],
  },
  friday: {
    enabled: true,
    slots: [
      { start: BUSINESS_HOURS.DEFAULT_START, end: BUSINESS_HOURS.DEFAULT_END },
    ],
  },
  saturday: { enabled: false, slots: [] },
  sunday: { enabled: false, slots: [] },
};

// Utility function for creating availability state updaters
function createAvailabilityUpdater(
  setAvailability: React.Dispatch<React.SetStateAction<WeeklyAvailability>>,
) {
  return {
    toggleDay: (day: DayOfWeek) => {
      setAvailability((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          enabled: !prev[day].enabled,
          slots: !prev[day].enabled
            ? [
                {
                  start: BUSINESS_HOURS.DEFAULT_START,
                  end: BUSINESS_HOURS.DEFAULT_END,
                },
              ]
            : prev[day].slots,
        },
      }));
    },

    addSlot: (day: DayOfWeek) => {
      setAvailability((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          slots: [
            ...prev[day].slots,
            {
              start: BUSINESS_HOURS.DEFAULT_START,
              end: BUSINESS_HOURS.DEFAULT_END,
            },
          ],
        },
      }));
    },

    removeSlot: (day: DayOfWeek, index: number) => {
      setAvailability((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          slots: prev[day].slots.filter((_, i) => i !== index),
        },
      }));
    },

    updateSlot: (
      day: DayOfWeek,
      index: number,
      field: "start" | "end",
      value: string,
    ) => {
      setAvailability((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          slots: prev[day].slots.map((slot, i) =>
            i === index ? { ...slot, [field]: value } : slot,
          ),
        },
      }));
    },
  };
}

// Hook for loading availability template
function useAvailabilityLoader(
  setAvailability: React.Dispatch<React.SetStateAction<WeeklyAvailability>>,
) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const template = await loadAvailabilityTemplateAction();
        if (template) {
          setAvailability(template);
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
  }, [setAvailability]);

  return { isLoading, error, setError };
}

// Hook for saving availability template
function useAvailabilitySaver(
  availability: WeeklyAvailability,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
) {
  const [isPending, startTransition] = useTransition();

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

  return { isPending, handleSave };
}

// Main hook that orchestrates the smaller hooks
export function useAvailabilityTemplate() {
  const [availability, setAvailability] =
    useState<WeeklyAvailability>(DEFAULT_AVAILABILITY);

  const { isLoading, error, setError } = useAvailabilityLoader(setAvailability);
  const { isPending, handleSave } = useAvailabilitySaver(
    availability,
    setError,
  );
  const { toggleDay, addSlot, removeSlot, updateSlot } =
    createAvailabilityUpdater(setAvailability);

  return {
    availability,
    isLoading,
    error,
    isPending,
    toggleDay,
    addSlot,
    removeSlot,
    updateSlot,
    handleSave,
  };
}
