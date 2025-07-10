import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createBookingAction } from '@/features/booking'

export default function BookingPage({ searchParams }: { searchParams: { type?: string; date?: string; time?: string } }) {
  const { type, date, time } = searchParams
  if (!type || !date || !time) {
    return <p className="text-muted-foreground">Select a type, date, and time.</p>
  }

  const t = type
  const d = date
  const ti = time

  async function book(formData: FormData) {
    'use server'
    const rawName = formData.get('name')
    const rawEmail = formData.get('email')
    if (typeof rawName !== 'string' || typeof rawEmail !== 'string') {
      throw new Error('Invalid form submission')
    }
    await createBookingAction({ type: t, date: d, time: ti, name: rawName, email: rawEmail })
  }

  return (
    <div>
      <p className="font-medium">You selected:</p>
      <ul className="list-disc pl-4 mb-4">
        <li>Type: {type}</li>
        <li>Date: {date}</li>
        <li>Time: {time}</li>
      </ul>
      <form action={book} className="space-y-2">
        <Input name="name" placeholder="Your name" required />
        <Input name="email" type="email" placeholder="Email" required />
        <Button type="submit">Confirm Booking</Button>
      </form>
    </div>
  )
}
