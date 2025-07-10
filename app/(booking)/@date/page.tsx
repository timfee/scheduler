import { format } from 'date-fns'
import Link from 'next/link'

export default function DatePage({ searchParams }: { searchParams: { type?: string; date?: string } }) {
  if (!searchParams.type) {
    return <p className="text-muted-foreground">Select a type first.</p>
  }

  const today = new Date()
  const days = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    return d
  })

  return (
    <ul className="space-y-2">
      {days.map((d) => (
        <li key={d.toISOString()}>
          <Link href={{ query: { type: searchParams.type, date: format(d, 'yyyy-MM-dd') } }}>
            {format(d, 'MMM d')}
          </Link>
        </li>
      ))}
    </ul>
  )
}
