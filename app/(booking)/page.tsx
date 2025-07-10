import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createBookingAction } from '@/features/booking'
import { mapErrorToUserMessage } from '@/lib/errors'

export default function BookingPage({ searchParams }: { searchParams: { type?: string; date?: string; time?: string } }) {
  const { type: appointmentType, date, time } = searchParams
  if (!appointmentType || !date || !time) {
    return <p className="text-muted-foreground">Select a type, date, and time.</p>
  }

  async function book(formData: FormData) {
    'use server'
    try {
      const rawName = formData.get('name')
      const rawEmail = formData.get('email')
      if (typeof rawName !== 'string' || typeof rawEmail !== 'string') {
        throw new Error('Invalid form submission')
      }
      await createBookingAction({ type: appointmentType!, date: date!, time: time!, name: rawName, email: rawEmail })
    } catch (error) {
      throw new Error(mapErrorToUserMessage(error, 'Failed to submit booking'))
    }
  }

  return (
    <div>
      <p className="font-medium">You selected:</p>
      <ul className="list-disc pl-4 mb-4">
        <li>Type: {appointmentType}</li>
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
