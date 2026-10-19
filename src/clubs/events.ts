import type { ClubEvent } from '../content/types'

const DAY = 86_400_000

export function validDate(value?: string): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const stamp = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === value ? stamp : null
}

export function nzToday(): string {
  const parts = new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const part = (type: string) => parts.find((item) => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function eventGroup(event: Partial<ClubEvent>, today: string): string {
  const start = validDate(event.date)
  const now = validDate(today)
  if (start === null || now === null) return event.weekday ? 'regular sessions' : 'dates to confirm'
  const end = validDate(event.endDate) ?? start
  if (end < now) return 'past events'
  const monday = now - ((new Date(now).getUTCDay() + 6) % 7) * DAY
  return start < monday + 7 * DAY && end >= monday ? 'this week' : 'upcoming'
}
