/** @jest-environment jsdom */
import React from 'react'
import { describe, it, expect, jest } from '@jest/globals'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { useBookingState } from '@/app/(booking)/hooks/use-booking-state'

// Polyfill TextEncoder for undici in jsdom environment


const mockUseSearchParams = jest.fn()
jest.mock('next/navigation', () => ({ useSearchParams: mockUseSearchParams }))

function TestComponent() {
  const { type, selectedDate, selectedTime, progress, isComplete, updateBookingStep } = useBookingState()
  return (
    <div>
      <span data-testid="type">{type}</span>
      <span data-testid="date">{selectedDate?.toISOString() ?? ''}</span>
      <span data-testid="time">{selectedTime}</span>
      <span data-testid="progress">{progress}</span>
      <span data-testid="complete">{isComplete ? 'true' : 'false'}</span>
      <button onClick={() => updateBookingStep({ type: 'intro' })}>set type</button>
      <button onClick={() => updateBookingStep({ selectedDate: new Date('2024-01-01') })}>set date</button>
      <button onClick={() => updateBookingStep({ selectedTime: '10:00' })}>set time</button>
      <button onClick={() => updateBookingStep({ type: 'intro', selectedDate: new Date('2024-01-01'), selectedTime: '10:00' })}>set all</button>
    </div>
  )
}

class Boundary extends React.Component<React.PropsWithChildren> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) return <p>error</p>
    return this.props.children
  }
}

describe('booking flow parallel routes', () => {
  it('URL state updates correctly for type', () => {
    const params = new URLSearchParams()
    mockUseSearchParams.mockReturnValue([params, jest.fn()])
    const div = document.createElement('div')
    const root = createRoot(div)
    
    act(() => {
      root.render(
        <NuqsTestingAdapter>
          <TestComponent />
        </NuqsTestingAdapter>
      )
    })
    
    const button = div.querySelector('button')!
    act(() => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    
    expect(div.querySelector('[data-testid="type"]')?.textContent).toBe('intro')
  })

  it('tracks progress correctly', () => {
    const params = new URLSearchParams()
    mockUseSearchParams.mockReturnValue([params, jest.fn()])
    const div = document.createElement('div')
    const root = createRoot(div)
    
    act(() => {
      root.render(
        <NuqsTestingAdapter>
          <TestComponent />
        </NuqsTestingAdapter>
      )
    })
    
    // Initially progress should be 0
    expect(div.querySelector('[data-testid="progress"]')?.textContent).toBe('0')
    expect(div.querySelector('[data-testid="complete"]')?.textContent).toBe('false')
    
    // Set type - progress should be 1
    const setTypeButton = div.querySelector('button')!
    act(() => {
      setTypeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(div.querySelector('[data-testid="progress"]')?.textContent).toBe('1')
    expect(div.querySelector('[data-testid="complete"]')?.textContent).toBe('false')
  })

  it('completes booking when all fields are set', () => {
    const params = new URLSearchParams()
    mockUseSearchParams.mockReturnValue([params, jest.fn()])
    const div = document.createElement('div')
    const root = createRoot(div)
    
    act(() => {
      root.render(
        <NuqsTestingAdapter>
          <TestComponent />
        </NuqsTestingAdapter>
      )
    })
    
    // Set all fields at once
    const setAllButton = div.querySelectorAll('button')[3]
    if (setAllButton) {
      act(() => {
        setAllButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })
    }
    
    expect(div.querySelector('[data-testid="progress"]')?.textContent).toBe('3')
    expect(div.querySelector('[data-testid="complete"]')?.textContent).toBe('true')
    expect(div.querySelector('[data-testid="type"]')?.textContent).toBe('intro')
    expect(div.querySelector('[data-testid="time"]')?.textContent).toBe('10:00')
  })

  it('slots render independently', () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()])
    function Slot({ fail }: { fail?: boolean }) {
      if (fail) throw new Error('oops')
      return <div>ok</div>
    }
    function App() {
      return (
        <NuqsTestingAdapter>
          <>
            <Boundary>
              <Slot />
            </Boundary>
            <Boundary>
              <Slot fail />
            </Boundary>
          </>
        </NuqsTestingAdapter>
      )
    }
    const div = document.createElement('div')
    const root = createRoot(div)
    
    act(() => {
      root.render(<App />)
    })
    
    expect(div.textContent).toContain('ok')
    expect(div.textContent).toContain('error')
  })
})
