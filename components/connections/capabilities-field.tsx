"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { type ConnectionFormValues } from "@/lib/hooks/use-connection-form";
import {
  CALENDAR_CAPABILITY,
  type CalendarCapability,
} from "@/lib/types/constants";
import { type Control } from "react-hook-form";

interface CapabilitiesFieldProps {
  control: Control<ConnectionFormValues>;
}

export default function CapabilitiesField({ control }: CapabilitiesFieldProps) {
  return (
    <FormField
      control={control}
      name="capabilities"
      render={() => (
        <FormItem>
          <div className="mb-4">
            <FormLabel className="text-base">Capabilities</FormLabel>
            <FormDescription>
              Select what this calendar connection can be used for
            </FormDescription>
          </div>
          <FormField
            control={control}
            name="capabilities"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                <FormControl>
                  <Checkbox
                    checked={field.value?.includes(
                      CALENDAR_CAPABILITY.BLOCKING_BUSY,
                    )}
                    onCheckedChange={(checked) => {
                      const updated = checked
                        ? [...field.value, CALENDAR_CAPABILITY.BLOCKING_BUSY]
                        : field.value?.filter(
                            (v: CalendarCapability) =>
                              v !== CALENDAR_CAPABILITY.BLOCKING_BUSY,
                          );
                      field.onChange(updated);
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Conflict Checking</FormLabel>
                  <FormDescription>Booked time is blocked</FormDescription>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="capabilities"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                <FormControl>
                  <Checkbox
                    checked={field.value?.includes(
                      CALENDAR_CAPABILITY.BLOCKING_AVAILABLE,
                    )}
                    onCheckedChange={(checked) => {
                      const updated = checked
                        ? [
                            ...field.value,
                            CALENDAR_CAPABILITY.BLOCKING_AVAILABLE,
                          ]
                        : field.value?.filter(
                            (v: CalendarCapability) =>
                              v !== CALENDAR_CAPABILITY.BLOCKING_AVAILABLE,
                          );
                      field.onChange(updated);
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Availability Checking</FormLabel>
                  <FormDescription>
                    Booked time is available unless blocked later
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="capabilities"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                <FormControl>
                  <Checkbox
                    checked={field.value?.includes(CALENDAR_CAPABILITY.BOOKING)}
                    onCheckedChange={(checked) => {
                      const updated = checked
                        ? [...field.value, CALENDAR_CAPABILITY.BOOKING]
                        : field.value?.filter(
                            (v: CalendarCapability) =>
                              v !== CALENDAR_CAPABILITY.BOOKING,
                          );
                      field.onChange(updated);
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Booking</FormLabel>
                  <FormDescription>
                    Can add new events to this calendar
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
