/**
 * The clubs that appear on the dark clubs page: poster trail, club list and
 * the shortlist pile. Index in this array is the "tone" that editorial.css
 * uses for shapes, so keep the order stable and append new clubs at the end.
 */

export interface ClubPoster {
  src: string
  width: number
  height: number
  fit: 'cover' | 'contain'
}

/** Rough part of the week the regular session falls in. */
export type ClubSlot = 'daytime' | 'evening' | 'weekend'

export interface ClubSummary {
  slug: string
  name: string
  blurb: string
  /** short line for the trail card and list row, e.g. "Thu 6pm · Hub" */
  next: string
  /** 1 = Monday … 7 = Sunday; orders the "this week" cycle for first-time visitors */
  weekday: number
  /**
   * Derived from the published meeting time; left out when the club has not
   * published one (then `weekday` is only a sort placeholder).
   */
  slot?: ClubSlot
  /**
   * The regular session's clock times, 24h "HH:MM", for the week view in
   * my clubs. `end` is left out when the club has not published one; the
   * view then draws an hour and says so. Day comes from `weekday`.
   */
  session?: { start: string; end?: string }
  /**
   * Other things people call the club, lower case: the full name, the
   * activity, nicknames. Search and the golem both match on these.
   */
  aliases: string[]
  /** "#clubs" when the club has no page of its own yet */
  href: string
  poster: ClubPoster
  /** Details for the shortlist sticky note / focus panel. Leave out what we don't know. */
  when?: string
  where?: string
  signals?: string[]
  contact?: string[]
}

export const clubsByTone: ClubSummary[] = [
  {
    slug: 'vicfolk',
    name: 'VicFolk',
    blurb: 'irish & scottish tunes, dances and songs',
    next: 'Thu 6pm · SU217',
    weekday: 4,
    slot: 'evening',
    session: { start: '18:00', end: '20:00' },
    aliases: ['vic folk', 'folk', 'folk music', 'folk music club', 'ceilidh', 'dance', 'dancing', 'fiddle'],
    href: '/editorial/vicfolk',
    poster: { src: '/clubs/vicfolk/poster-midwinter-ceilidh-2026.webp', width: 260, height: 130, fit: 'cover' },
    when: 'thursdays 6–8pm',
    where: 'Student Union SU217/218',
    signals: ['no experience needed', 'all ages, students and alumni'],
    contact: ['email', 'weekly email', 'instagram', 'facebook'],
  },
  {
    slug: 'vuwtc',
    name: 'VUWTC',
    blurb: 'tramping, climbing and tacos since 1921',
    next: 'Tue 6pm · Kelburn',
    weekday: 2,
    slot: 'evening',
    session: { start: '18:00' },
    aliases: ['tramping', 'tramping club', 'tramp', 'hiking', 'climbing', 'climb', 'outdoors', 'taco'],
    href: '/editorial/vuwtc',
    poster: { src: '/clubs/vuwtc/poster-bushball-2019.jpg', width: 260, height: 146, fit: 'cover' },
    when: 'tuesdays 6pm',
    where: 'Kelburn campus, room on their story each week',
    signals: ['a trip every weekend, all levels', 'club gear to borrow', 'taco tuesday after'],
    contact: ['email', 'email list', 'instagram', 'facebook', 'tiktok'],
  },
  {
    slug: 'vucc',
    name: 'VUCC',
    blurb: 'white-water kayaking, pool sessions first',
    next: 'Thu 7:45pm · Freyberg Pool',
    weekday: 4,
    slot: 'evening',
    session: { start: '19:45' },
    aliases: ['canoe', 'canoe club', 'kayak', 'kayaking', 'white-water', 'whitewater', 'paddle', 'river'],
    href: '/editorial/vucc',
    poster: { src: '/clubs/vucc/40th-mangahao.jpg', width: 260, height: 146, fit: 'cover' },
    when: 'thursdays 7:45pm',
    where: 'Freyberg Pool, Oriental Parade',
    signals: ['open to non-students too', 'beginners trips on the hutt river'],
    contact: ['email', 'instagram', 'facebook', 'youtube'],
  },
  {
    slug: 'debsoc',
    name: 'Vic Debsoc',
    blurb: 'learn to speak, learn to convince',
    next: 'Wed 6:30pm · KK301',
    weekday: 3,
    slot: 'evening',
    session: { start: '18:30' },
    aliases: ['debsoc', 'debate', 'debating', 'debating society', 'debate society', 'public speaking'],
    href: '/editorial/debsoc',
    poster: { src: '/clubs/debsoc/team-photo.jpg', width: 260, height: 146, fit: 'cover' },
    when: 'wednesdays 6:30pm',
    where: 'KK301, Kirk Building',
    signals: ['no experience necessary', 'beginner grade', 'since 1899'],
    contact: ['email', 'mailing list', 'instagram', 'facebook'],
  },
  {
    slug: 'mukume-taiko',
    name: 'Mukume Taiko',
    blurb: 'japanese drumming, loud and beginner-friendly',
    next: 'weekly · time tbc',
    weekday: 7,
    aliases: ['taiko', 'mukume', 'drum', 'drums', 'drumming', 'japanese drumming'],
    href: '/editorial/mukume-taiko',
    poster: { src: '/clubs/taiko/poster-heartbeat-2024.jpg', width: 260, height: 130, fit: 'cover' },
    when: 'weekly practice, time not published',
    where: 'Kelburn campus, ask on instagram',
    signals: ['no experience needed', 'performing since 1994'],
    contact: ['email', 'instagram', 'facebook'],
  },
  {
    slug: 'vicuke',
    name: 'Vic Uke',
    blurb: 'ukulele for every level, songs together',
    next: 'weekly · time tbc',
    weekday: 7,
    aliases: ['vic uke', 'uke', 'ukulele', 'ukulele club', 'music', 'singing'],
    href: '/editorial/vicuke',
    poster: { src: '/clubs/vicuke/poster-promo.jpg', width: 260, height: 146, fit: 'cover' },
    when: 'weekly, time not published',
    where: 'Kelburn campus, email to ask',
    signals: ['all skill levels', 'gigs are optional'],
    contact: ['email', 'youtube'],
  },
]

export const clubBySlug = (slug: string) => clubsByTone.find((club) => club.slug === slug)

/** Clubs ordered by the soonest night in the week. */
export const clubsByWeek = () =>
  clubsByTone
    .map((club, tone) => ({ club, tone }))
    .sort((a, b) => a.club.weekday - b.club.weekday)

export const hasOwnPage = (club: ClubSummary) => !club.href.startsWith('#')

/** True when the club has published a regular time we can filter by. */
export const hasPublishedTime = (club: ClubSummary) => club.slot !== undefined

export const WEEKDAY_LABELS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export const SLOT_LABELS: Record<ClubSlot, string> = { daytime: 'daytime', evening: 'evening', weekend: 'weekend' }
export const SLOTS: ClubSlot[] = ['daytime', 'evening', 'weekend']

export interface ClubFilter {
  query: string
  /** 1 = Monday … 7 = Sunday */
  days: number[]
  slots: ClubSlot[]
}

export const EMPTY_FILTER: ClubFilter = { query: '', days: [], slots: [] }

export const filterIsActive = (filter: ClubFilter) =>
  filter.query.trim() !== '' || filter.days.length > 0 || filter.slots.length > 0

export const filterHasTime = (filter: ClubFilter) => filter.days.length > 0 || filter.slots.length > 0

/**
 * The alias that made a club match a search when its name did not, so the
 * row can say "also: debating society". Null when the name or blurb matched
 * or the query is empty.
 */
export function aliasHit(club: ClubSummary, query: string): string | null {
  const q = query.trim().toLowerCase()
  if (!q) return null
  if (`${club.name} ${club.blurb}`.toLowerCase().includes(q)) return null
  return club.aliases.find((alias) => alias.includes(q) || q.includes(alias)) ?? null
}

/** True when the query matches the name, blurb or any alias. */
export const matchesQuery = (club: ClubSummary, query: string) => {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return `${club.name} ${club.blurb}`.toLowerCase().includes(q) || aliasHit(club, q) !== null
}

/**
 * Split clubs into the ones that match the filter and the ones that cannot
 * be judged because they have not published a time. Text search (name,
 * blurb, aliases) hides non-matches outright; time filters only sink the
 * unknowns.
 */
export function applyClubFilter<T extends { club: ClubSummary }>(items: T[], filter: ClubFilter) {
  const query = filter.query.trim().toLowerCase()
  const byText = query ? items.filter(({ club }) => matchesQuery(club, query)) : items
  if (!filterHasTime(filter)) return { matched: byText, unplaced: [] as T[] }
  const matched: T[] = []
  const unplaced: T[] = []
  for (const item of byText) {
    const { club } = item
    if (!hasPublishedTime(club)) {
      unplaced.push(item)
      continue
    }
    const dayOk = filter.days.length === 0 || filter.days.includes(club.weekday)
    const slotOk = filter.slots.length === 0 || (club.slot !== undefined && filter.slots.includes(club.slot))
    if (dayOk && slotOk) matched.push(item)
  }
  return { matched, unplaced }
}

/** CSS custom properties the poster styles read (editorial.css, shortlist.css). */
export function posterVars(club: ClubSummary): Record<string, string> {
  return {
    '--poster': `url("${encodeURI(club.poster.src)}")`,
    '--poster-w': `${club.poster.width}px`,
    '--poster-h': `${club.poster.height}px`,
    '--poster-fit': club.poster.fit,
    '--poster-aspect': `${club.poster.width} / ${club.poster.height}`,
  }
}
