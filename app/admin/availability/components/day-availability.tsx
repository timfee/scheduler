"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  type DayAvailability as DayAvailabilityType,
  type DayOfWeek,
} from "@/lib/schemas/availability";
import { Clock, Plus } from "lucide-react";

import { TimeSlotEditor } from "./time-slot-editor";

interface DayAvailabilityProps {
  dayKey: DayOfWeek;
  dayLabel: string;
  availability: DayAvailabilityType;
  onToggleDay: () => void;
  onAddSlot: () => void;
  onRemoveSlot: (index: number) => void;
  onUpdateSlot: (index: number, field: "start" | "end", value: string) => void;
}

export function DayAvailability({
  dayKey,
  dayLabel,
  availability,
  onToggleDay,
  onAddSlot,
  onRemoveSlot,
  onUpdateSlot,
}: DayAvailabilityProps) {
  return (
    <Card
      className={`${availability.enabled ? "border-green-200" : "border-gray-200"}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            {dayLabel}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              checked={availability.enabled}
              onCheckedChange={onToggleDay}
            />
            {availability.enabled ? (
              <Badge variant="default">Available</Badge>
            ) : (
              <Badge variant="secondary">Unavailable</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {availability.enabled && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {availability.slots.map((slot, index) => (
              <TimeSlotEditor
                key={slot.id ?? `${slot.start}-${slot.end}-${index}`}
                slot={slot}
                index={index}
                dayKey={dayKey}
                onUpdate={(field, value) => onUpdateSlot(index, field, value)}
                onRemove={() => onRemoveSlot(index)}
              />
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={onAddSlot}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Time Slot
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
