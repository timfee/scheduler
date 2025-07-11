import { listAppointmentTypes } from '@/app/(booking)/data'
import { AppointmentTypeSelector } from './appointment-type-selector'

export default async function AppointmentTypePage({
  searchParams
}: {
  searchParams: { type?: string; date?: string; time?: string }
}) {
  const types = await listAppointmentTypes();
  
  return (
    <div>
      <h2 className="font-medium mb-3">Select Appointment Type</h2>
      <AppointmentTypeSelector 
        types={types} 
        selectedType={searchParams.type}
      />
    </div>
  );
}
