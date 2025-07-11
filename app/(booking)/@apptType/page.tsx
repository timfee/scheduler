import { listAppointmentTypes } from '@/app/(booking)/data'
import { AppointmentTypeSelector } from '@/app/(booking)/components/appointment-type-selector'

export default async function AppointmentTypePage() {
  const types = await listAppointmentTypes()

  return <AppointmentTypeSelector types={types} />
}
