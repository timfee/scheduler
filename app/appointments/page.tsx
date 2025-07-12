import { Calendar } from "@/components/ui/calendar";
import { listBusyTimesAction } from "./actions";
import { createDateRange } from "@/lib/utils/date-range";

export default async function AppointmentsPage() {
  const { from, to } = createDateRange(7);

  const busy = await listBusyTimesAction(from, to);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-4 text-3xl font-bold">Appointments</h1>
      <Calendar
        mode="single"
        modifiers={{ busy: busy.map(b => ({ from: new Date(b.startUtc), to: new Date(b.endUtc) })) }}
        modifiersClassNames={{ busy: "bg-red-200" }}
      />
      <div className="mt-6 space-y-2">
        {busy.length === 0 ? (
          <p className="text-muted-foreground">No busy times in the next 7 days.</p>
        ) : (
          busy.map((b, i) => (
            <p key={i}>{b.startUtc} - {b.endUtc}</p>
          ))
        )}
      </div>
    </div>
  );
}
