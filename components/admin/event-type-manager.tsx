"use client";

/* eslint-disable max-lines -- Complex admin component with comprehensive form and validation */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  Edit2,
  MapPin,
  Phone,
  Plus,
  Settings,
  Trash2,
  Video,
} from "lucide-react";
import { useState } from "react";

interface EventType {
  id: string;
  name: string;
  description: string;
  durations: number[]; // in minutes
  locations: EventLocation[];
  rules: EventRules;
  color: string;
  enabled: boolean;
}

interface EventLocation {
  type:
    | "google_meet"
    | "zoom"
    | "phone_call_me"
    | "phone_call_you"
    | "in_person"
    | "tbd";
  label: string;
  details?: string;
}

interface EventRules {
  maxHoursPerDay?: number;
  maxMeetingsPerDay?: number;
  bufferTime: number; // minutes between meetings
  advanceBooking: {
    min: number; // hours
    max: number; // days
  };
}

const LOCATION_TYPES = [
  { value: "google_meet", label: "Google Meet", icon: Video },
  { value: "zoom", label: "Zoom", icon: Video },
  { value: "phone_call_me", label: "I will call you", icon: Phone },
  { value: "phone_call_you", label: "You will call me", icon: Phone },
  { value: "in_person", label: "In person", icon: MapPin },
  { value: "tbd", label: "To be determined", icon: Calendar },
];

const COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#F97316",
  "#06B6D4",
  "#84CC16",
];

const DEFAULT_EVENT_TYPE: Omit<EventType, "id"> = {
  name: "",
  description: "",
  durations: [30],
  locations: [{ type: "google_meet", label: "Google Meet" }],
  rules: {
    bufferTime: 0,
    advanceBooking: { min: 2, max: 30 },
  },
  color: COLORS[0] ?? "#3B82F6",
  enabled: true,
};

export function EventTypeManager() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([
    {
      id: "1",
      name: "Quick Chat",
      description: "A brief 15-30 minute discussion",
      durations: [15, 30],
      locations: [
        { type: "google_meet", label: "Google Meet" },
        { type: "zoom", label: "Zoom" },
      ],
      rules: {
        bufferTime: 5,
        advanceBooking: { min: 2, max: 7 },
      },
      color: "#3B82F6",
      enabled: true,
    },
    {
      id: "2",
      name: "Strategy Session",
      description: "In-depth planning and strategy discussion",
      durations: [60, 90],
      locations: [
        { type: "google_meet", label: "Google Meet" },
        { type: "in_person", label: "Office Meeting Room" },
      ],
      rules: {
        maxHoursPerDay: 4,
        maxMeetingsPerDay: 3,
        bufferTime: 15,
        advanceBooking: { min: 24, max: 30 },
      },
      color: "#10B981",
      enabled: true,
    },
  ]);

  const [editingEventType, setEditingEventType] = useState<EventType | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleCreate = () => {
    setEditingEventType(null);
    setIsFormOpen(true);
  };

  const handleEdit = (eventType: EventType) => {
    setEditingEventType(eventType);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this event type?")) {
      setEventTypes((prev) => prev.filter((et) => et.id !== id));
    }
  };

  const handleToggle = (id: string) => {
    setEventTypes((prev) =>
      prev.map((et) => (et.id === id ? { ...et, enabled: !et.enabled } : et)),
    );
  };

  const handleSave = (eventType: Omit<EventType, "id">) => {
    if (editingEventType) {
      setEventTypes((prev) =>
        prev.map((et) =>
          et.id === editingEventType.id
            ? { ...eventType, id: editingEventType.id }
            : et,
        ),
      );
    } else {
      const newEventType: EventType = {
        ...eventType,
        id: Date.now().toString(),
      };
      setEventTypes((prev) => [...prev, newEventType]);
    }
    setIsFormOpen(false);
    setEditingEventType(null);
  };

  return (
    <div className="space-y-6">
      {/* Event Type List */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Event Types</h3>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Event Type
        </Button>
      </div>

      <div className="grid gap-4">
        {eventTypes.map((eventType) => (
          <Card
            key={eventType.id}
            className={`${eventType.enabled ? "border-l-4" : "opacity-60"}`}
            style={{
              borderLeftColor: eventType.enabled ? eventType.color : undefined,
            }}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: eventType.color }}
                  />
                  <div>
                    <CardTitle className="text-lg">{eventType.name}</CardTitle>
                    <CardDescription>{eventType.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={eventType.enabled}
                    onCheckedChange={() => handleToggle(eventType.id)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(eventType)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(eventType.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    Duration
                  </Label>
                  <div className="mt-1 flex gap-2">
                    {eventType.durations.map((duration, idx) => (
                      <Badge key={idx} variant="secondary">
                        {duration}m
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4" />
                    Locations
                  </Label>
                  <div className="mt-1 flex gap-2">
                    {eventType.locations.map((location, idx) => (
                      <Badge key={idx} variant="outline">
                        {location.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Settings className="h-4 w-4" />
                    Rules
                  </Label>
                  <div className="mt-1 text-sm text-gray-600">
                    {eventType.rules.bufferTime > 0 && (
                      <div>Buffer: {eventType.rules.bufferTime}m</div>
                    )}
                    {eventType.rules.maxMeetingsPerDay && (
                      <div>Max/day: {eventType.rules.maxMeetingsPerDay}</div>
                    )}
                    {eventType.rules.maxHoursPerDay && (
                      <div>
                        Max hours/day: {eventType.rules.maxHoursPerDay}h
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Event Type Form */}
      {isFormOpen && (
        <EventTypeForm
          eventType={editingEventType}
          onSave={handleSave}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}

interface EventTypeFormProps {
  eventType: EventType | null;
  onSave: (eventType: Omit<EventType, "id">) => void;
  onCancel: () => void;
}

// eslint-disable-next-line max-lines-per-function -- Complex form component with validation and state management
function EventTypeForm({ eventType, onSave, onCancel }: EventTypeFormProps) {
  const [formData, setFormData] = useState<Omit<EventType, "id">>(
    eventType ?? DEFAULT_EVENT_TYPE,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addDuration = () => {
    setFormData((prev) => ({
      ...prev,
      durations: [...prev.durations, 30],
    }));
  };

  const removeDuration = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      durations: prev.durations.filter((_, i) => i !== index),
    }));
  };

  const updateDuration = (index: number, value: number) => {
    setFormData((prev) => ({
      ...prev,
      durations: prev.durations.map((d, i) => (i === index ? value : d)),
    }));
  };

  const addLocation = () => {
    setFormData((prev) => ({
      ...prev,
      locations: [
        ...prev.locations,
        { type: "google_meet", label: "Google Meet" },
      ],
    }));
  };

  const removeLocation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index),
    }));
  };

  const updateLocation = (
    index: number,
    field: keyof EventLocation,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      locations: prev.locations.map((l, i) =>
        i === index ? { ...l, [field]: value } : l,
      ),
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {eventType ? "Edit Event Type" : "Create Event Type"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Event Type Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Quick Chat"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of this event type"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <div className="mt-2 flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 ${formData.color === color ? "border-gray-400" : "border-gray-200"}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Durations */}
          <div>
            <Label className="text-base font-medium">Durations (minutes)</Label>
            <div className="mt-2 space-y-2">
              {formData.durations.map((duration, index) => (
                <div
                  key={`duration-${duration}-${index}`}
                  className="flex items-center gap-2"
                >
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) =>
                      updateDuration(index, parseInt(e.target.value) ?? 0)
                    }
                    className="w-24"
                    min="5"
                    max="480"
                  />
                  <span className="text-sm text-gray-500">minutes</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDuration(index)}
                    aria-label="Remove duration"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDuration}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Duration
              </Button>
            </div>
          </div>

          <Separator />

          {/* Locations */}
          <div>
            <Label className="text-base font-medium">Locations</Label>
            <div className="mt-2 space-y-2">
              {formData.locations.map((location, index) => (
                <div
                  key={`location-${location.type}-${location.details ?? ""}-${index}`}
                  className="flex items-center gap-2"
                >
                  <Select
                    value={location.type}
                    onValueChange={(value) =>
                      updateLocation(index, "type", value)
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={location.label}
                    onChange={(e) =>
                      updateLocation(index, "label", e.target.value)
                    }
                    placeholder="Display name"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLocation(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLocation}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </div>
          </div>

          <Separator />

          {/* Rules */}
          <div>
            <Label className="text-base font-medium">Booking Rules</Label>
            <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="bufferTime">Buffer Time (minutes)</Label>
                <Input
                  id="bufferTime"
                  type="number"
                  value={formData.rules.bufferTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      rules: {
                        ...prev.rules,
                        bufferTime: parseInt(e.target.value) ?? 0,
                      },
                    }))
                  }
                  min="0"
                  max="60"
                />
              </div>
              <div>
                <Label htmlFor="maxMeetingsPerDay">Max Meetings Per Day</Label>
                <Input
                  id="maxMeetingsPerDay"
                  type="number"
                  value={formData.rules.maxMeetingsPerDay ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      rules: {
                        ...prev.rules,
                        maxMeetingsPerDay:
                          parseInt(e.target.value) || undefined,
                      },
                    }))
                  }
                  min="1"
                  max="20"
                  placeholder="No limit"
                />
              </div>
              <div>
                <Label htmlFor="maxHoursPerDay">Max Hours Per Day</Label>
                <Input
                  id="maxHoursPerDay"
                  type="number"
                  value={formData.rules.maxHoursPerDay ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      rules: {
                        ...prev.rules,
                        maxHoursPerDay: parseInt(e.target.value) || undefined,
                      },
                    }))
                  }
                  min="1"
                  max="12"
                  placeholder="No limit"
                />
              </div>
              <div>
                <Label htmlFor="advanceBookingMin">
                  Min Advance Booking (hours)
                </Label>
                <Input
                  id="advanceBookingMin"
                  type="number"
                  value={formData.rules.advanceBooking.min}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      rules: {
                        ...prev.rules,
                        advanceBooking: {
                          ...prev.rules.advanceBooking,
                          min: parseInt(e.target.value) || 0,
                        },
                      },
                    }))
                  }
                  min="0"
                  max="168"
                />
              </div>
              <div>
                <Label htmlFor="advanceBookingMax">
                  Max Advance Booking (days)
                </Label>
                <Input
                  id="advanceBookingMax"
                  type="number"
                  value={formData.rules.advanceBooking.max}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      rules: {
                        ...prev.rules,
                        advanceBooking: {
                          ...prev.rules.advanceBooking,
                          max: parseInt(e.target.value) || 0,
                        },
                      },
                    }))
                  }
                  min="1"
                  max="365"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {eventType ? "Update" : "Create"} Event Type
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
