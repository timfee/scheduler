# Server Actions

This directory contains all server actions for the application, organized by feature.

## Files

- `booking-actions.ts` - Server actions for the booking workflow
- `appointments-actions.ts` - Server actions for appointments management
- `connections-actions.ts` - Server actions for calendar connections
- `calendar-actions.ts` - Server actions for calendar operations

## Usage

Import server actions from this centralized location:

```typescript
import { createBookingAction } from '@/actions/booking-actions';
import { createConnectionAction } from '@/actions/connections-actions';
import { listBusyTimesAction } from '@/actions/appointments-actions';
```

This follows the simplified architecture with centralized server actions instead of feature-based nested directories.