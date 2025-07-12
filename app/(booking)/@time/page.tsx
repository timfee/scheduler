import { getAppointmentType } from "@/app/(booking)/server/data";
import { listBusyTimesAction } from "@/app/appointments/actions";
import { TimeSelector } from "./time-selector";
import { calculateAvailableSlots, type BusinessHours } from "../server/availability-core";
import { TIME_ZONES } from "@/lib/constants";

export default async function TimePage({
  searchParams
}: {
  searchParams: { type?: string; date?: string; time?: string }
}) {
  if (!searchParams.type || !searchParams.date) {
    return <p className="text-muted-foreground">Select a date first.</p>;
  }

  let slots: string[] = [];
  let error: string | null = null;
  
  try {
    const [apptType, busyTimes] = await Promise.all([
      getAppointmentType(searchParams.type),
      listBusyTimesAction(
        `${searchParams.date}T00:00:00`, // Start of the day
        `${searchParams.date}T23:59:59`  // End of the day
      ),
    ])

    if (!apptType) {
      slots = []
    } else {
      // Define business hours with timezone support
      const businessHours: BusinessHours = {
        start: '09:00',
        end: '17:00',
        timeZone: TIME_ZONES.DEFAULT
      };

      // Use the centralized availability calculation function
      slots = calculateAvailableSlots({
        selectedDate: searchParams.date,
        durationMinutes: apptType.durationMinutes,
        businessHours,
        busyTimes
      });
    }
  } catch (err) {
    console.error('Failed to load time slots:', err)
    error = 'Unable to load available times. Please try again.'
    slots = []
  }

  return <TimeSelector slots={slots} error={error} />
}
