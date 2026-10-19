/**
 * The hero search box talks to the club list through one window event, the
 * same way the golem's chat does. `parseQuery` turns what people actually
 * type ("thursday", "folk on tue", "weekend kayak") into the list's filter:
 * weekday and time-of-day words become day/slot filters, the rest is text.
 */
import type { ClubFilter, ClubSlot } from '../content/clubs'

export const SEARCH_EVENT = 'vuwclubs:search'

/** The slot in the list's filter bar where the search box docks once you scroll down. */
export const SEARCH_DOCK_ID = 'club-filters-dock'

export interface SearchRequest {
  query: string
  /** True on Enter / the arrow button: scroll to the list and hand focus over. */
  commit: boolean
  /** Set when the list itself changed the words (its clear button), so the box follows suit. */
  origin?: 'list'
}

export function requestSearch(query: string, commit: boolean, origin?: 'list') {
  window.dispatchEvent(new CustomEvent<SearchRequest>(SEARCH_EVENT, { detail: { query, commit, origin } }))
}

/** 1 = Monday … 7 = Sunday for the user's local date. */
export const todayWeekday = () => ((new Date().getDay() + 6) % 7) + 1

const DAY_WORDS: Record<string, number> = {
  monday: 1, mondays: 1, mon: 1,
  tuesday: 2, tuesdays: 2, tue: 2, tues: 2,
  wednesday: 3, wednesdays: 3, wed: 3, weds: 3,
  thursday: 4, thursdays: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fridays: 5, fri: 5,
  saturday: 6, saturdays: 6, sat: 6,
  sunday: 7, sundays: 7, sun: 7,
}

const SLOT_WORDS: Record<string, ClubSlot> = {
  weekend: 'weekend', weekends: 'weekend',
  evening: 'evening', evenings: 'evening', night: 'evening', nights: 'evening', tonight: 'evening',
  daytime: 'daytime', morning: 'daytime', mornings: 'daytime', afternoon: 'daytime', afternoons: 'daytime',
  lunchtime: 'daytime', lunch: 'daytime',
}

/** Words that carry no meaning for matching and would otherwise hit aliases ("club"). */
const FILLER = new Set(['a', 'an', 'the', 'on', 'in', 'at', 'for', 'club', 'clubs', 'society', 'something', 'any', 'this', 'next'])

export function parseQuery(raw: string, today: number = todayWeekday()): ClubFilter {
  const days = new Set<number>()
  const slots = new Set<ClubSlot>()
  const text: string[] = []
  for (const token of raw.toLowerCase().split(/[\s,]+/).filter(Boolean)) {
    const word = token.replace(/[^a-z0-9'’-]/g, '')
    if (!word) continue
    if (word in DAY_WORDS) {
      days.add(DAY_WORDS[word])
      continue
    }
    if (word === 'today' || word === 'tonight') {
      days.add(today)
      if (word === 'tonight') slots.add('evening')
      continue
    }
    if (word === 'tomorrow') {
      days.add((today % 7) + 1)
      continue
    }
    if (word in SLOT_WORDS) {
      slots.add(SLOT_WORDS[word])
      continue
    }
    if (FILLER.has(word)) continue
    text.push(word)
  }
  return { query: text.join(' '), days: [...days].sort((a, b) => a - b), slots: [...slots] }
}
