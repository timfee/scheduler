"use client";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
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
import { useCallback } from "react";

import { type ProviderType } from "@/app/connections/actions";
import { type ConnectionFormValues } from "@/app/connections/hooks/use-connection-form";

interface ProviderSelectProps {
  control: Control<ConnectionFormValues>;
  value: ProviderType;
  onChange: (provider: ProviderType) => void;
  disabled?: boolean;
}

export default function ProviderSelect({
  control,
  value,
  onChange,
  disabled,
}: ProviderSelectProps) {
  const handleSelectValueChange = useCallback((provider: ProviderType) => {
    onChange(provider);
  }, [onChange]);

  return (
    <FormField
      control={control}
      name="provider"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Provider</FormLabel>
          <Select
            value={value}
            onValueChange={(provider: ProviderType) => {
              field.onChange(provider);
              handleSelectValueChange(provider);
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
      )}
    />
  );
}
