export interface AppointmentType {
  id: string
  name: string
  durationMinutes: number
}

export async function listAppointmentTypes(): Promise<AppointmentType[]> {
  // Placeholder static list until a real database table exists
  return [
    { id: 'intro', name: 'Intro Call', durationMinutes: 30 },
    { id: 'consult', name: 'Consultation', durationMinutes: 60 },
  ]
}

export async function getAppointmentType(id: string): Promise<AppointmentType | null> {
  const types = await listAppointmentTypes()
  return types.find(t => t.id === id) ?? null
}
