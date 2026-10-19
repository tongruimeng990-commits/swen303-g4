import {
  filterIsActive,
  SLOT_LABELS,
  SLOTS,
  WEEKDAY_LABELS,
  type ClubFilter,
  type ClubSlot,
} from '../content/clubs'
import { SEARCH_DOCK_ID } from '../lib/search'

export const CLUB_FILTERS_ID = 'club-filters'

interface ClubFiltersProps {
  value: ClubFilter
  onChange: (update: (previous: ClubFilter) => ClubFilter) => void
  /** Drop every filter, including the words in the search box. */
  onClear: () => void
  total: number
  matched: number
  /** clubs that could not be judged because they have not published a time */
  unplaced: number
  /** The golem has not thrown the bar in yet: keep it in the DOM but unseen. */
  incoming?: boolean
  /** Just landed from the golem's hand: play the settle animation. */
  landed?: boolean
}

const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item])

/**
 * Weekday + time-of-day filters for the club list, with a slot for the page's
 * one search box. One sticky bar under the heading, always in the same place;
 * multi-select, clearable.
 */
export function ClubFilters({ value, onChange, onClear, total, matched, unplaced, incoming, landed }: ClubFiltersProps) {
  const active = filterIsActive(value)

  const summary = (() => {
    if (!active) return `${total} clubs`
    const head = `${matched} of ${total} match`
    return unplaced > 0 ? `${head} · ${unplaced} without a published time` : head
  })()

  return (
    <div
      id={CLUB_FILTERS_ID}
      className="club-filters"
      role="search"
      aria-label="Filter clubs"
      data-incoming={incoming || undefined}
      data-landed={landed || undefined}
    >
      {/* The search box from the first screen lands here once you scroll down. */}
      <div id={SEARCH_DOCK_ID} className="club-filters__dock" />

      <div className="club-filters__group" role="group" aria-label="weekday">
        {WEEKDAY_LABELS.map((label, index) => {
          const day = index + 1
          const pressed = value.days.includes(day)
          return (
            <button
              key={label}
              type="button"
              className="club-filters__pill"
              aria-pressed={pressed}
              onClick={() => onChange((previous) => ({ ...previous, days: toggle(previous.days, day) }))}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="club-filters__group" role="group" aria-label="time of day">
        {SLOTS.map((slot: ClubSlot) => {
          const pressed = value.slots.includes(slot)
          return (
            <button
              key={slot}
              type="button"
              className="club-filters__pill"
              aria-pressed={pressed}
              onClick={() => onChange((previous) => ({ ...previous, slots: toggle(previous.slots, slot) }))}
            >
              {SLOT_LABELS[slot]}
            </button>
          )
        })}
      </div>

      <p className="club-filters__count" aria-live="polite" data-idle={!active || undefined}>
        {summary}
        {active ? (
          <>
            {' · '}
            <button
              type="button"
              className="club-filters__clear"
              onClick={onClear}
            >
              clear
            </button>
          </>
        ) : null}
      </p>
    </div>
  )
}
