import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Mock nuqs module
jest.mock('nuqs', () => ({
  parseAsString: {
    withDefault: (defaultValue: string) => ({ defaultValue }),
  },
  parseAsIsoDateTime: { defaultValue: null },
  useQueryStates: jest.fn(() => [
    { type: '', date: null, time: '' },
    jest.fn()
  ]),
}));

// Mock the booking state hook BEFORE importing the component
const mockUpdateBookingStep = jest.fn();

jest.mock('@/app/(booking)/_hooks/use-booking-state', () => ({
  useBookingState: () => ({
    updateBookingStep: mockUpdateBookingStep,
  }),
}));

// Import component AFTER the mock
import { DateSelector } from '../date-selector';

describe('DateSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display message when no type is selected', () => {
    render(<DateSelector type={null} busyDates={new Set()} />);
    expect(screen.getByText('Select a type first.')).toBeInTheDocument();
  });

  it('should display available dates when type is selected', () => {
    render(<DateSelector type="intro" busyDates={new Set()} />);
    
    expect(screen.getByText('Select Date')).toBeInTheDocument();
    // Should show next 5 days
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('should disable busy dates', () => {
    // Create a busy date for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = tomorrow.toISOString().split('T')[0];
    
    const busyDates = new Set([tomorrowIso]);
    render(<DateSelector type="intro" busyDates={busyDates} />);
    
    // Find the busy date button
    const busyButton = screen.getByText(
      (content, element) => element?.textContent?.includes('(busy)') || false
    );
    
    expect(busyButton).toBeDisabled();
    expect(busyButton).toHaveClass('opacity-50');
  });

  it('should handle date selection', async () => {
    const user = userEvent.setup();
    
    render(<DateSelector type="intro" busyDates={new Set()} />);
    
    // Find first available date button
    const availableButtons = screen.getAllByRole('button');
    const firstButton = availableButtons[0];
    
    await user.click(firstButton);
    
    expect(mockUpdateBookingStep).toHaveBeenCalledWith({
      date: expect.any(Date)
    });
  });

  it('should handle empty busy dates set', () => {
    render(<DateSelector type="intro" busyDates={new Set()} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
    
    // All buttons should be enabled
    buttons.forEach(button => {
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveClass('opacity-50');
      expect(button.textContent).not.toContain('(busy)');
    });
  });
});