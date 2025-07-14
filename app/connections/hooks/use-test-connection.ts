"use client";

import {
  listCalendarsAction,
  testConnectionAction,
  type CalendarOption,
} from "@/app/connections/server/actions";
import { buildConnectionFormData } from "@/app/connections/utils/form-data-builder";
import { mapErrorToUserMessage } from "@/lib/errors";
import { type ConnectionFormValues } from "@/lib/schemas/connection";
import { useCallback, useState } from "react";
import { type UseFormReturn } from "react-hook-form";

interface TestConnectionState {
  testing: boolean;
  success?: boolean;
  message?: string;
}

interface UseTestConnectionReturn {
  testStatus: TestConnectionState;
  calendars: CalendarOption[];
  setCalendars: (calendars: CalendarOption[]) => void;
  testConnection: (form: UseFormReturn<ConnectionFormValues>) => Promise<void>;
  resetTestStatus: () => void;
}

/**
 * Custom hook for testing calendar connections
 * Extracts the test connection logic from ConnectionsClient
 */
export function useTestConnection(): UseTestConnectionReturn {
  const [testStatus, setTestStatus] = useState<TestConnectionState>({
    testing: false,
  });
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);

  const resetTestStatus = useCallback(() => {
    setTestStatus({ testing: false });
  }, []);

  const testConnection = useCallback(
    async (form: UseFormReturn<ConnectionFormValues>) => {
      const isValid = await form.trigger();
      if (!isValid) return;

      const values = form.getValues();
      setTestStatus({ testing: true });

      try {
        const testData = buildConnectionFormData(values, true);

        await testConnectionAction(values.provider, testData);
        const fetchedCalendars = await listCalendarsAction(
          values.provider,
          testData,
        );
        setCalendars(fetchedCalendars);
        setTestStatus({
          testing: false,
          success: true,
          message: "Connection successful!",
        });
      } catch (error) {
        setTestStatus({
          testing: false,
          success: false,
          message: mapErrorToUserMessage(error, "Connection failed"),
        });
      }
    },
    [],
  );

  return {
    testStatus,
    calendars,
    setCalendars,
    testConnection,
    resetTestStatus,
  };
}
