/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-var-requires */
// Use Jest's injected globals and import `jest` for mocking functions.
import { jest } from '@jest/globals';
import { createCalDavProvider } from '@/infrastructure/providers/caldav';
import { ICAL_PROD_ID } from '@/types/constants';
import { type createDAVClient } from 'tsdav';

const client = {
  createCalendarObject: jest
    .fn<() => Promise<unknown>>()
    .mockResolvedValue({}),
  deleteCalendarObject: jest.fn<() => Promise<unknown>>().mockResolvedValue({}),
  fetchCalendarObjects: jest
    .fn<() => Promise<unknown[]>>()
    .mockResolvedValue([]),
} as unknown as Awaited<ReturnType<typeof createDAVClient>>;

describe('CalDav provider', () => {
  it('generates iCal event using ical-generator', async () => {
    const provider = createCalDavProvider(client, 'https://calendar.local');
    const input = {
      title: 'Test Event',
      description: 'Desc',
      location: 'Room 1',
      startUtc: '2025-07-05T15:00:00+00:00',
      endUtc: '2025-07-05T16:00:00+00:00',
      ownerTimeZone: 'UTC',
    };

    const event = await provider.createAppointment(input);

  const mockCreate =
    client.createCalendarObject as jest.MockedFunction<
      (arg: { iCalString: string }) => Promise<unknown>
    >;
  expect(mockCreate).toHaveBeenCalledTimes(1);
  const call = mockCreate.mock.calls[0][0];
    expect(call.iCalString).toContain('BEGIN:VCALENDAR');
    expect(call.iCalString).toContain('BEGIN:VEVENT');
    expect(call.iCalString).toContain(`SUMMARY:${input.title}`);
    expect(call.iCalString).toContain(`LOCATION:${input.location}`);
    expect(call.iCalString).toContain(`DESCRIPTION:${input.description}`);
    expect(call.iCalString).toContain(`UID:${event.id}`);
    expect(call.iCalString).toContain(
      `PRODID:-//${ICAL_PROD_ID.company}//${ICAL_PROD_ID.product}//EN`,
    );

    expect(event.title).toBe(input.title);
    expect(event.location).toBe(input.location);
  });
});
