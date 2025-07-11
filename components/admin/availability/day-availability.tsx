"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Clock } from "lucide-react";
import { type DayAvailability as DayAvailabilityType, type DayOfWeek } from "@/lib/schemas/availability";
import { TimeSlotEditor } from "./time-slot-editor";

interface DayAvailabilityProps {
  dayKey: DayOfWeek;
  dayLabel: string;
  availability: DayAvailabilityType;
  onToggleDay: () => void;
  onAddSlot: () => void;
  onRemoveSlot: (index: number) => void;
  onUpdateSlot: (index: number, field: 'start' | 'end', value: string) => void;
}

export function DayAvailability({ 
  dayKey, 
  dayLabel, 
  availability, 
  onToggleDay, 
  onAddSlot, 
  onRemoveSlot, 
  onUpdateSlot 
}: DayAvailabilityProps) {
  return (
    <Card className={`${availability.enabled ? 'border-green-200' : 'border-gray-200'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
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
                key={index}
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
              <Plus className="h-4 w-4 mr-2" />
              Add Time Slot
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}