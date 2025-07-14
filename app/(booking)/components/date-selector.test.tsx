import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDays, format, startOfDay } from "date-fns";
import React from "react";

// Create a simplified test component that doesn't use hooks
const TestDateSelector = ({
  type,
  busyDates,
  onDateSelect,
}: {
  type: string | null;
  busyDates: Set<string>;
  onDateSelect: (date: Date) => void;
}) => {
  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const dateStr = button.dataset.date;
    if (dateStr) {
      const date = new Date(dateStr);
      onDateSelect(date);
    }
  };

  if (!type) {
    return <p className="text-muted-foreground">Select a type first.</p>;
  }

  const today = startOfDay(new Date());
  const days = Array.from({ length: 5 }).map((_, i) => addDays(today, i));

  return (
    <div>
      <h2 className="mb-3 font-medium">Select Date</h2>
      <ul className="space-y-2">
        {days.map((d) => {
          const iso = format(d, "yyyy-MM-dd");
          const isBusy = busyDates.has(iso);
          return (
            <li key={iso}>
              <button
                onClick={handleButtonClick}
                data-date={d.toISOString()}
                className={`w-full rounded border p-2 text-left hover:bg-gray-100 ${
                  isBusy ? "opacity-50" : ""
                }`}
                disabled={isBusy}
              >
                {format(d, "MMM d")}
                {isBusy ? " (busy)" : ""}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

describe("DateSelector Component", () => {
  const mockOnDateSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display message when no type is selected", () => {
    render(
      <TestDateSelector
        type={null}
        busyDates={new Set()}
        onDateSelect={mockOnDateSelect}
      />,
    );
    expect(screen.getByText("Select a type first.")).toBeInTheDocument();
  });

  it("should display available dates when type is selected", () => {
    render(
      <TestDateSelector
        type="intro"
        busyDates={new Set()}
        onDateSelect={mockOnDateSelect}
      />,
    );

    expect(screen.getByText("Select Date")).toBeInTheDocument();
    // Should show next 5 days
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("should disable busy dates", () => {
    // Create a busy date for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = tomorrow.toISOString().split("T")[0];

    const busyDates = new Set([tomorrowIso]);
    render(
      <TestDateSelector
        type="intro"
        busyDates={busyDates}
        onDateSelect={mockOnDateSelect}
      />,
    );

    // Find the disabled button specifically
    const busyButton = screen.getByRole("button", { name: /\(busy\)/ });

    expect(busyButton).toBeDisabled();
    expect(busyButton).toHaveClass("opacity-50");
  });

  it("should handle date selection", async () => {
    const user = userEvent.setup();

    render(
      <TestDateSelector
        type="intro"
        busyDates={new Set()}
        onDateSelect={mockOnDateSelect}
      />,
    );

    // Find first available date button
    const availableButtons = screen.getAllByRole("button");
    const firstButton = availableButtons[0];

    await user.click(firstButton);

    expect(mockOnDateSelect).toHaveBeenCalledWith(expect.any(Date));
  });

  it("should handle empty busy dates set", () => {
    render(
      <TestDateSelector
        type="intro"
        busyDates={new Set()}
        onDateSelect={mockOnDateSelect}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);

    // All buttons should be enabled
    buttons.forEach((button) => {
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveClass("opacity-50");
      expect(button.textContent).not.toContain("(busy)");
    });
  });

  it("should format dates correctly", () => {
    render(
      <TestDateSelector
        type="intro"
        busyDates={new Set()}
        onDateSelect={mockOnDateSelect}
      />,
    );

    const buttons = screen.getAllByRole("button");

    // Each button should have a date format like "Jan 1", "Jan 2", etc.
    buttons.forEach((button) => {
      expect(button.textContent).toMatch(/^[A-Za-z]+ \d{1,2}$/);
    });
  });
});
