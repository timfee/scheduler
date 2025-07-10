import Link from 'next/link'

export default function TimePage({ searchParams }: { searchParams: { type?: string; date?: string; time?: string } }) {
  if (!searchParams.type || !searchParams.date) {
    return <p className="text-muted-foreground">Select a date first.</p>
  }

  const times = ['09:00', '10:00', '11:00', '14:00']

  return (
    <ul className="space-y-2">
      {times.map((t) => (
        <li key={t}>
          <Link href={{ query: { type: searchParams.type, date: searchParams.date, time: t } }}>
            {t}
          </Link>
        </li>
      ))}
    </ul>
  )
}
