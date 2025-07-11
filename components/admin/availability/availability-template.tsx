"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Clock, Loader2 } from "lucide-react";
import { type WeeklyAvailability, type TimeSlot } from "@/lib/schemas/availability";
import { saveAvailabilityTemplateAction, loadAvailabilityTemplateAction } from "@/app/admin/availability/actions";
import { mapErrorToUserMessage } from "@/lib/errors";

// Generate unique ID for slots
const generateSlotId = () => `slot-${crypto.randomUUID()}`;

// Create default slot with ID
const createDefaultSlot = (start = "09:00", end = "17:00") => ({
  id: generateSlotId(),
  start,
  end
});

// Type for slots that are guaranteed to have IDs
type SlotWithId = Required<Pick<TimeSlot, 'id'>> & TimeSlot;

// Type for availability with guaranteed slot IDs
type WeeklyAvailabilityWithIds = {
  [K in keyof WeeklyAvailability]: {
    enabled: boolean;
    slots: SlotWithId[];
  };
};

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
  const [availability, setAvailability] = useState<WeeklyAvailabilityWithIds>(DEFAULT_AVAILABILITY as WeeklyAvailabilityWithIds);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Ensure slots have unique IDs
  const ensureSlotIds = (availability: WeeklyAvailability): WeeklyAvailabilityWithIds => {
    const updated = { ...availability };
    Object.keys(updated).forEach(day => {
      const dayKey = day as keyof WeeklyAvailability;
      updated[dayKey] = {
        ...updated[dayKey],
        slots: updated[dayKey].slots.map(slot => ({
          ...slot,
          id: slot.id ?? generateSlotId()
        }))
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
        setError(mapErrorToUserMessage(error, "Failed to load availability template"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadTemplate();
  }, []);

  const toggleDay = (day: DayOfWeek) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
        slots: !prev[day].enabled ? [createDefaultSlot()] : prev[day].slots
      }
    }));
  };

  const addSlot = (day: DayOfWeek) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, createDefaultSlot()]
      }
    }));
  };

  const removeSlot = (day: DayOfWeek, slotId: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter(slot => slot.id !== slotId)
      }
    }));
  };

  const updateSlot = (day: DayOfWeek, slotId: string, field: 'start' | 'end', value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map(slot => 
          slot.id === slotId ? { ...slot, [field]: value } : slot
        )
      }
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
        setError(mapErrorToUserMessage(error, "Failed to save availability template"));
      }
    });
  };

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
            <Card key={key} className={`${availability[key].enabled ? 'border-green-200' : 'border-gray-200'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {label}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={availability[key].enabled}
                      onCheckedChange={() => toggleDay(key)}
                    />
                    {availability[key].enabled ? (
                      <Badge variant="default">Available</Badge>
                    ) : (
                      <Badge variant="secondary">Unavailable</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {availability[key].enabled && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {availability[key].slots.map((slot) => (
                      <div key={slot.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`${key}-${slot.id}-start`} className="text-sm font-medium">
                            From
                          </Label>
                          <Input
                            id={`${key}-${slot.id}-start`}
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateSlot(key, slot.id, 'start', e.target.value)}
                            className="w-32"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`${key}-${slot.id}-end`} className="text-sm font-medium">
                            To
                          </Label>
                          <Input
                            id={`${key}-${slot.id}-end`}
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateSlot(key, slot.id, 'end', e.target.value)}
                            className="w-32"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSlot(key, slot.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addSlot(key)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Time Slot
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
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