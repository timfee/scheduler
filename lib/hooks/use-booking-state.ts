import { parseAsIsoDateTime, parseAsString, useQueryStates } from "nuqs";

export const bookingParsers = {
  type: parseAsString.withDefault(""),
  selectedDate: parseAsIsoDateTime,
  selectedTime: parseAsString.withDefault(""),
};

export function useBookingState() {
  const [state, setState] = useQueryStates(bookingParsers);

  const updateBookingStep = (updates: Partial<typeof state>) => {
    const result = setState(updates);
    // Handle both cases: when setState returns a Promise and when it doesn't
    if (
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      result &&
      typeof result === "object" &&
      "catch" in result &&
      typeof result.catch === "function"
    ) {
      void result.catch((error) => {
        console.error("Failed to update booking state:", error);
      });
    }
  };

  const progress = [state.type, state.selectedDate, state.selectedTime].filter(
    Boolean,
  ).length;
  const isComplete = Boolean(
    state.type && state.selectedDate && state.selectedTime,
  );

  return {
    ...state,
    updateBookingStep,
    isComplete,
    progress,
    // Keep backward compatibility
    setState,
  };
}
