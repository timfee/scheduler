/** @jest-environment jsdom */
import React from 'react'
import { describe, it, expect, jest } from '@jest/globals'
import ReactDOM from 'react-dom/test-utils'
import { createRoot } from 'react-dom/client'
import { useBookingState } from '@/features/booking/hooks/use-booking-state'

// Polyfill TextEncoder for undici in jsdom environment
import { TextEncoder, TextDecoder } from 'util'
// @ts-expect-error jsdom provides no TextEncoder
global.TextEncoder = TextEncoder
// @ts-expect-error jsdom provides no TextDecoder
global.TextDecoder = TextDecoder

const mockUseSearchParams = jest.fn()
jest.mock('next/navigation', () => ({ useSearchParams: mockUseSearchParams }))

function TestComponent() {
  const [state, setState] = useBookingState()
  return (
    <div>
      <span>{state.type}</span>
      <button onClick={() => setState({ type: 'intro' })}>set</button>
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

describe.skip('booking flow parallel routes', () => {
  it('URL state updates correctly', () => {
    const params = new URLSearchParams()
    const setParams = jest.fn()
    mockUseSearchParams.mockReturnValue([params, setParams])
    const div = document.createElement('div')
    ReactDOM.act(() => {
      createRoot(div).render(<TestComponent />)
    })
    const button = div.querySelector('button')!
    ReactDOM.act(() => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(setParams).toHaveBeenCalled()
  })

  it('slots render independently', () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), jest.fn()])
    function Slot({ fail }: { fail?: boolean }) {
      if (fail) throw new Error('oops')
      return <div>ok</div>
    }
    function App() {
      return (
        <>
          <Boundary>
            <Slot />
          </Boundary>
          <Boundary>
            <Slot fail />
          </Boundary>
        </>
      )
    }
    const div = document.createElement('div')
    ReactDOM.act(() => {
      createRoot(div).render(<App />)
    })
    expect(div.textContent).toContain('ok')
    expect(div.textContent).toContain('error')
  })
})
