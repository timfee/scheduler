"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Clock } from "lucide-react";

interface TimeSlot {
  start: string;
  end: string;
}

interface DayAvailability {
  enabled: boolean;
  slots: TimeSlot[];
}

type WeeklyAvailability = Record<DayOfWeek, DayAvailability>;

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
  monday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  tuesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  wednesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  thursday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  friday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
  saturday: { enabled: false, slots: [] },
  sunday: { enabled: false, slots: [] },
};

export function AvailabilityTemplate() {
  const [availability, setAvailability] = useState<WeeklyAvailability>(DEFAULT_AVAILABILITY);

  const toggleDay = (day: DayOfWeek) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
        slots: !prev[day].enabled ? [{ start: "09:00", end: "17:00" }] : prev[day].slots
      }
    }));
  };

  const addSlot = (day: DayOfWeek) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { start: "09:00", end: "17:00" }]
      }
    }));
  };

  const removeSlot = (day: DayOfWeek, index: number) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== index)
      }
    }));
  };

  const updateSlot = (day: DayOfWeek, index: number, field: 'start' | 'end', value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, i) => 
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }));
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log("Saving availability:", availability);
    // Here you would typically send this to your API
  };

  return (
    <div className="space-y-6">
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
                  {availability[key].slots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`${key}-${index}-start`} className="text-sm font-medium">
                          From
                        </Label>
                        <Input
                          id={`${key}-${index}-start`}
                          type="time"
                          value={slot.start}
                          onChange={(e) => updateSlot(key, index, 'start', e.target.value)}
                          className="w-32"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`${key}-${index}-end`} className="text-sm font-medium">
                          To
                        </Label>
                        <Input
                          id={`${key}-${index}-end`}
                          type="time"
                          value={slot.end}
                          onChange={(e) => updateSlot(key, index, 'end', e.target.value)}
                          className="w-32"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSlot(key, index)}
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

      <Separator />

      <div className="flex justify-end">
        <Button onClick={handleSave} className="px-8">
          Save Availability Template
        </Button>
      </div>
    </div>
  );
}