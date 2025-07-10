import Link from 'next/link'
import { listAppointmentTypes } from '@/features/booking/data'

export default async function AppointmentTypePage() {
  const types = await listAppointmentTypes()

  return (
    <ul className="space-y-2">
      {types.map(t => (
        <li key={t.id}>
          <Link href={{ query: { type: t.id } }}>
            {t.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}
