import { useId } from 'react'
import {
  EMPTY_FILTER,
  filterIsActive,
  SLOT_LABELS,
  SLOTS,
  WEEKDAY_LABELS,
  type ClubFilter,
  type ClubSlot,
} from '../content/clubs'

export const CLUB_FILTERS_ID = 'club-filters'

interface ClubFiltersProps {
  value: ClubFilter
  onChange: (update: (previous: ClubFilter) => ClubFilter) => void
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
 * Search + weekday + time-of-day filters for the club list. One sticky bar
 * under the heading, always in the same place; multi-select, clearable.
 */
export function ClubFilters({ value, onChange, total, matched, unplaced, incoming, landed }: ClubFiltersProps) {
  const searchId = useId()
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
      <label className="club-filters__search" htmlFor={searchId}>
        <svg className="club-filters__glass" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          id={searchId}
          type="search"
          placeholder="search by name"
          aria-label="search clubs by name"
          value={value.query}
          onChange={(event) => {
            const query = event.target.value
            onChange((previous) => ({ ...previous, query }))
          }}
          autoComplete="off"
          spellCheck={false}
        />
      </label>

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
              onClick={() => onChange(() => EMPTY_FILTER)}
            >
              clear
            </button>
          </>
        ) : null}
      </p>
    </div>
  )
}
