# Booking Feature

This feature implements the customer-facing booking flow using Next.js parallel routes.

The `app/(booking)` route group contains slots for appointment type, date, and time. Each slot updates its portion of the URL state using `nuqs`, allowing selections to be shareable and bookmarkable. Use the `useBookingState` hook from this feature to read and update the booking parameters. The main booking page shows a confirmation once all selections are made.
