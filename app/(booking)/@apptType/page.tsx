import { listAppointmentTypes } from "@/app/(booking)/server/data";
import { AppointmentTypeSelectorWrapper } from "@/components/booking/appointment-type-selector-wrapper";

export default async function AppointmentTypePage({
  searchParams,
}: {
  searchParams: { type?: string; date?: string; time?: string };
}) {
  const types = await listAppointmentTypes();

  return (
    <AppointmentTypeSelectorWrapper
      types={types}
      selectedType={searchParams.type}
    />
  );
}
