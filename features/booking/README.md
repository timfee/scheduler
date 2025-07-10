# Booking Feature

This feature implements the customer-facing booking flow using Next.js parallel routes.

The `app/(booking)` route group contains slots for appointment type, date, and time. Each slot updates its portion of the URL state using `nuqs`, allowing selections to be shareable and bookmarkable. Use the `useBookingState` hook from this feature to read and update the booking parameters. The main booking page shows a confirmation once all selections are made.

## Architecture

The booking flow uses parallel routes (`@apptType`, `@date`, `@time`) to enable independent loading and error states for each selection step.

## Database Schema

### appointment_types
- `id` (TEXT): UUID primary key
- `name` (TEXT): Display name of appointment type
- `description` (TEXT): Optional description
- `durationMinutes` (INTEGER): Length of appointment
- `isActive` (BOOLEAN): Whether type is available for booking
- `createdAt` (TIMESTAMP): Creation time
- `updatedAt` (TIMESTAMP): Last update time

## API

### Server Actions

#### createBookingAction(formData: BookingFormData)
Creates a calendar event for the booking.

**Parameters:**
- `type`: Appointment type ID
- `date`: Date in YYYY-MM-DD format
- `time`: Time in HH:mm format
- `name`: Customer name
- `email`: Customer email

**Rate Limiting:** 1 booking per email per minute

## Testing

Run tests with:
```bash
pnpm test features/booking
```
