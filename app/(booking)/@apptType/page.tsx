import { listAppointmentTypes } from '@/app/(booking)/_server/data'
import { AppointmentTypeSelector } from '@/app/(booking)/_components/appointment-type-selector'

export default async function AppointmentTypePage() {
  const types = await listAppointmentTypes()

  return <AppointmentTypeSelector types={types} />
}
