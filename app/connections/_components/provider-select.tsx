"use client";

import { type ProviderType } from "@/app/connections/_server/actions";
import { type ConnectionFormValues } from "@/app/connections/_hooks/use-connection-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { type Control } from "react-hook-form";

interface ProviderSelectProps {
  control: Control<ConnectionFormValues>;
  onChange: (provider: ProviderType) => void;
  disabled?: boolean;
}

export default function ProviderSelect({
  control,
  onChange,
  disabled,
}: ProviderSelectProps) {
  return (
    <FormField
      control={control}
      name="provider"
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel>Provider</FormLabel>
            <Select
              value={field.value}
              onValueChange={(provider: ProviderType) => {
                field.onChange(provider);
                onChange(provider);
              }}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="apple">Apple iCloud</SelectItem>
                <SelectItem value="google">Google Calendar</SelectItem>
                <SelectItem value="fastmail">Fastmail</SelectItem>
                <SelectItem value="nextcloud">Nextcloud</SelectItem>
                <SelectItem value="caldav">Generic CalDAV</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
