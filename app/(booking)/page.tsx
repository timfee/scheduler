'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookingProgress } from '@/app/(booking)/components/booking-progress'
import { useBookingState } from '@/app/(booking)/hooks/use-booking-state'
import { createBookingAction } from '@/app/(booking)/server/actions'
import { mapErrorToUserMessage } from '@/lib/errors'
import { formatDateForBooking } from '@/lib/utils'

const TOTAL_STEPS = 3

export default function BookingPage() {
  const { type: appointmentType, selectedDate, selectedTime, progress, isComplete } = useBookingState()
  
  if (!isComplete) {
    return (
      <div className="col-span-full mt-6">
        <BookingProgress progress={progress} />
        <p className="text-muted-foreground">
          {progress === 0 && "Select an appointment type to begin."}
          {progress === 1 && "Choose a date for your appointment."}
          {progress === 2 && "Pick a time slot that works for you."}
        </p>
      </div>
    )
  }

  async function book(formData: FormData) {
    'use server'
    try {
      const rawName = formData.get('name')
      const rawEmail = formData.get('email')
      if (typeof rawName !== 'string' || typeof rawEmail !== 'string') {
        throw new Error('Invalid form submission')
      }
      
      // Validate all required booking fields are present
      if (!appointmentType || !selectedDate || !selectedTime) {
        throw new Error('Missing required booking information')
      }
      
      await createBookingAction({ 
        type: appointmentType, 
        selectedDate: typeof selectedDate === 'string' ? selectedDate : selectedDate instanceof Date ? formatDateForBooking(selectedDate) : '', 
        selectedTime: selectedTime, 
        name: rawName, 
        email: rawEmail 
      })
    } catch (error) {
      throw new Error(mapErrorToUserMessage(error, 'Failed to submit booking'))
    }
  }

  return (
    <div className="col-span-full mt-6">
      <BookingProgress progress={TOTAL_STEPS} />
      <p className="font-medium">You selected:</p>
      <ul className="list-disc pl-4 mb-4">
        <li>Type: {appointmentType}</li>
        <li>Date: {selectedDate ? formatDateForBooking(selectedDate) : ''}</li>
        <li>Time: {selectedTime}</li>
      </ul>
      <form action={book} className="space-y-2">
        <Input name="name" placeholder="Your name" required />
        <Input name="email" type="email" placeholder="Email" required />
        <Button type="submit">Confirm Booking</Button>
      </form>
    </div>
  )
}
