import { useState, useEffect, useTransition } from "react";
import { type WeeklyAvailability } from "@/lib/schemas/availability";
import { saveAvailabilityTemplateAction, loadAvailabilityTemplateAction } from "@/app/admin/availability/actions";
import { mapErrorToUserMessage } from "@/lib/errors";

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

const DEFAULT_AVAILABILITY: WeeklyAvailability = {
  monday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  tuesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  wednesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  thursday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  friday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  saturday: { enabled: false, slots: [] },
  sunday: { enabled: false, slots: [] },
};

// Utility function for creating availability state updaters
function createAvailabilityUpdater(setAvailability: React.Dispatch<React.SetStateAction<WeeklyAvailability>>) {
  return {
    toggleDay: (day: DayOfWeek) => {
      setAvailability(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          enabled: !prev[day].enabled,
          slots: !prev[day].enabled ? [{ start: "09:00", end: "17:00" }] : prev[day].slots
        }
      }));
    },
    
    addSlot: (day: DayOfWeek) => {
      setAvailability(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          slots: [...prev[day].slots, { start: "09:00", end: "17:00" }]
        }
      }));
    },
    
    removeSlot: (day: DayOfWeek, index: number) => {
      setAvailability(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          slots: prev[day].slots.filter((_, i) => i !== index)
        }
      }));
    },
    
    updateSlot: (day: DayOfWeek, index: number, field: 'start' | 'end', value: string) => {
      setAvailability(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          slots: prev[day].slots.map((slot, i) => 
            i === index ? { ...slot, [field]: value } : slot
          )
        }
      }));
    }
  };
}

// Hook for loading availability template
function useAvailabilityLoader(setAvailability: React.Dispatch<React.SetStateAction<WeeklyAvailability>>) {
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
        setError(mapErrorToUserMessage(error, "Failed to load availability template"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadTemplate();
  }, [setAvailability]);

  return { isLoading, error, setError };
}

// Hook for saving availability template
function useAvailabilitySaver(availability: WeeklyAvailability, setError: React.Dispatch<React.SetStateAction<string | null>>) {
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      try {
        setError(null);
        await saveAvailabilityTemplateAction(availability);
        // Success - could add a toast notification here
      } catch (error) {
        console.error("Failed to save availability template:", error);
        setError(mapErrorToUserMessage(error, "Failed to save availability template"));
      }
    });
  };

  return { isPending, handleSave };
}

// Main hook that orchestrates the smaller hooks
export function useAvailabilityTemplate() {
  const [availability, setAvailability] = useState<WeeklyAvailability>(DEFAULT_AVAILABILITY);
  
  const { isLoading, error, setError } = useAvailabilityLoader(setAvailability);
  const { isPending, handleSave } = useAvailabilitySaver(availability, setError);
  const { toggleDay, addSlot, removeSlot, updateSlot } = createAvailabilityUpdater(setAvailability);

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