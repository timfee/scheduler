import { getAppointmentType } from "@/app/(booking)/data";
import { listBusyTimesAction } from "@/app/appointments/actions";
import { TimeSelector } from "./time-selector";

export default async function TimePage({
  searchParams
}: {
  searchParams: { type?: string; date?: string; time?: string }
}) {
  if (!searchParams.type || !searchParams.date) {
    return <p className="text-muted-foreground">Select a date first.</p>;
  }

  const date = new Date(searchParams.date);
  
  try {
    const [apptType, busy] = await Promise.all([
      getAppointmentType(searchParams.type),
      listBusyTimesAction(
        new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          0,
          0,
          0,
        ).toISOString(),
        new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          23,
          59,
          59,
        ).toISOString(),
      ),
    ]);

    if (!apptType) {
      return <p className="text-muted-foreground">Invalid appointment type.</p>;
    }

    return (
      <div>
        <h2 className="mb-3 font-medium">Select Time</h2>
        <TimeSelector 
          date={date}
          appointmentType={apptType}
          busyTimes={busy}
          selectedTime={searchParams.time}
        />
      </div>
    );
  } catch (error) {
    console.error("Failed to load time slots:", error);
    return <p className="text-muted-foreground">Unable to load available times. Please try again.</p>;
  }
}
