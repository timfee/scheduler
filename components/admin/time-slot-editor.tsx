"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type TimeSlot } from "@/lib/schemas/availability";
import { Trash2 } from "lucide-react";

interface TimeSlotEditorProps {
  slot: TimeSlot;
  index: number;
  dayKey: string;
  onUpdate: (field: "start" | "end", value: string) => void;
  onRemove: () => void;
}

export function TimeSlotEditor({
  slot,
  index,
  dayKey,
  onUpdate,
  onRemove,
}: TimeSlotEditorProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
      <div className="flex items-center gap-2">
        <Label
          htmlFor={`${dayKey}-${index}-start`}
          className="text-sm font-medium"
        >
          From
        </Label>
        <Input
          id={`${dayKey}-${index}-start`}
          type="time"
          value={slot.start}
          onChange={(e) => onUpdate("start", e.target.value)}
          className="w-32"
        />
      </div>
      <div className="flex items-center gap-2">
        <Label
          htmlFor={`${dayKey}-${index}-end`}
          className="text-sm font-medium"
        >
          To
        </Label>
        <Input
          id={`${dayKey}-${index}-end`}
          type="time"
          value={slot.end}
          onChange={(e) => onUpdate("end", e.target.value)}
          className="w-32"
        />
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
