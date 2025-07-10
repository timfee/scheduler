'use client'
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="space-y-2">
      <p>Error loading times.</p>
      <button onClick={() => reset()} className="underline text-sm">Try again</button>
    </div>
  )
}
