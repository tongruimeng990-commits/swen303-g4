import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { Colophon } from '../Colophon'
import {
  aliasHit,
  applyClubFilter,
  clubsByWeek,
  EMPTY_FILTER,
  filterHasTime,
  filterIsActive,
  hasOwnPage,
  posterVars,
  type ClubFilter,
  type ClubSummary,
} from '../content/clubs'
import { announceHover, CATCH_EVENT, FILTER_EVENT, useGolem } from '../golem/useGolem'
import { pileTargetRect, useShortlist } from '../lib/shortlist'
import { parseQuery, requestSearch, SEARCH_EVENT, type SearchRequest } from '../lib/search'
import { ClubFilters } from './ClubFilters'

interface Preview {
  slug: string
  /** viewport y of the hovered row's centre */
  centerY: number
}

const PREVIEW_GAP = 36
const VIEWPORT_MARGIN = 16
const HOVER_DWELL_MS = 700

interface ClubListProps {
  /** The filter bar is in the DOM but not yet thrown in by the golem. */
  filtersIncoming?: boolean
  /** The bar just landed: play its settle animation. */
  filtersLanded?: boolean
}

/**
 * The club list: scan top to bottom, click a row to save it for later,
 * open a name to read its page. Hovering a row floats its poster alongside.
 */
export function ClubList({ filtersIncoming, filtersLanded }: ClubListProps = {}) {
  const shortlist = useShortlist()
  const golem = useGolem()
  const [preview, setPreview] = useState<Preview | null>(null)
  const [filter, setFilter] = useState<ClubFilter>(EMPTY_FILTER)
  const listRef = useRef<HTMLOListElement | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const all = useMemo(() => clubsByWeek(), [])
  const { matched, unplaced } = useMemo(() => applyClubFilter(all, filter), [all, filter])
  const timeFilter = filterHasTime(filter)
  // Matches first; clubs without a published time sink to the bottom, dimmed.
  const rows = [...matched, ...unplaced]

  // After the golem grabs the big preview, the row keeps it hidden until the
  // pointer leaves — otherwise the hover would paint it straight back.
  const previewSuppressed = useRef<string | null>(null)

  const showPreview = (club: ClubSummary, row: HTMLElement) => {
    if (previewSuppressed.current === club.slug) return
    const rect = row.getBoundingClientRect()
    setPreview({ slug: club.slug, centerY: rect.top + rect.height / 2 })
  }

  // The pointer settling on a row for a moment is the golem's cue to offer
  // a couple of things it can tell you about that club.
  const dwell = useRef<number | null>(null)
  const startDwell = (slug: string) => {
    if (dwell.current !== null) window.clearTimeout(dwell.current)
    dwell.current = window.setTimeout(() => {
      dwell.current = null
      announceHover(slug)
    }, HOVER_DWELL_MS)
  }
  const endDwell = () => {
    if (dwell.current !== null) window.clearTimeout(dwell.current)
    dwell.current = null
    announceHover(null)
  }
  useEffect(() => endDwell, [])

  const catchClub = useCallback(
    async (club: ClubSummary, row: HTMLElement) => {
      if (shortlist.has(club.slug)) {
        shortlist.remove(club.slug)
        return
      }
      const previewEl = previewRef.current
      const previewVisible =
        previewEl && previewEl.hasAttribute('data-visible') && getComputedStyle(previewEl).display !== 'none'
      const thumb = (row.querySelector<HTMLElement>('.club-row__thumb') ?? row).getBoundingClientRect()
      // He takes whichever picture is nearer to him: the row's thumbnail when
      // he is over on the left, the big preview when he is on the right.
      let source: 'preview' | 'thumb' = 'thumb'
      let from = thumb
      if (previewVisible) {
        const preview = previewEl.getBoundingClientRect()
        const feet = golem.where()
        const reach = (rect: DOMRect) => (feet ? Math.hypot(rect.left - 26 - feet.x, rect.bottom - feet.y) : Infinity)
        if (!feet || reach(preview) < reach(thumb)) {
          source = 'preview'
          from = preview
          // the golem takes the photo itself: hide the real one from this instant
          previewSuppressed.current = club.slug
          setPreview(null)
        }
      }
      // The catch is real the moment you click; the flight (or the golem's
      // scene) is just how the poster gets to the pile.
      shortlist.add(club.slug)
      await golem.catchPoster({
        from,
        source,
        to: pileTargetRect(),
        style: posterVars(club),
      })
    },
    [shortlist, golem],
  )

  // Requests from the golem's chat.
  useEffect(() => {
    const onFilter = (event: Event) => {
      const day = (event as CustomEvent<{ day: number }>).detail?.day
      if (!day) return
      setFilter((previous) => ({ ...previous, days: [day] }))
      document.getElementById('club-filters')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
    const onCatch = (event: Event) => {
      const slug = (event as CustomEvent<{ slug: string }>).detail?.slug
      const item = all.find((entry) => entry.club.slug === slug)
      const row = listRef.current?.querySelector<HTMLElement>(`.club-row[data-slug="${slug}"]`)
      if (!item || !row || shortlist.has(item.club.slug)) return
      void catchClub(item.club, row)
    }
    window.addEventListener(FILTER_EVENT, onFilter)
    window.addEventListener(CATCH_EVENT, onCatch)
    return () => {
      window.removeEventListener(FILTER_EVENT, onFilter)
      window.removeEventListener(CATCH_EVENT, onCatch)
    }
  }, [all, shortlist, catchClub])

  // The search box: live typing just filters; Enter brings you down here.
  // The box itself follows (it docks into the filter bar), keeping its focus.
  // Day and time words in the box light the matching pills; pills you pressed
  // yourself stay pressed while you type.
  const lastQuery = useRef('')
  useEffect(() => {
    const onSearch = (event: Event) => {
      const detail = (event as CustomEvent<SearchRequest>).detail
      if (!detail) return
      const parsed = parseQuery(detail.query)
      const before = parseQuery(lastQuery.current)
      lastQuery.current = detail.query
      const swap = <T,>(current: T[], old: T[], fresh: T[]) => [...new Set([...current.filter((x) => !old.includes(x)), ...fresh])]
      setFilter((previous) => ({
        query: parsed.query,
        days: swap(previous.days, before.days, parsed.days).sort((a, b) => a - b),
        slots: swap(previous.slots, before.slots, parsed.slots),
      }))
      if (!detail.commit) return
      document.getElementById('clubs')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
    window.addEventListener(SEARCH_EVENT, onSearch)
    return () => window.removeEventListener(SEARCH_EVENT, onSearch)
  }, [])

  // "clear" drops the pills and empties the search box in one go.
  const clearFilters = () => {
    setFilter(EMPTY_FILTER)
    requestSearch('', false, 'list')
  }

  const onRowKeyDown = (event: KeyboardEvent<HTMLDivElement>, club: ClubSummary) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      void catchClub(club, event.currentTarget)
    }
  }

  const previewClub = preview ? rows.find((item) => item.club.slug === preview.slug)?.club : null
  const previewStyle = (() => {
    if (!preview || !previewClub) return undefined
    const list = listRef.current?.getBoundingClientRect()
    const width = previewClub.poster.width
    const height = previewClub.poster.height
    const left = Math.min(
      (list ? list.right : 0) + PREVIEW_GAP,
      window.innerWidth - width - VIEWPORT_MARGIN,
    )
    const top = Math.min(
      Math.max(preview.centerY - height / 2, VIEWPORT_MARGIN),
      window.innerHeight - height - VIEWPORT_MARGIN,
    )
    return { ...posterVars(previewClub), left, top } as CSSProperties
  })()

  return (
    <section id="clubs" className="club-list" aria-labelledby="club-list-title">
      <header className="club-list__head">
        <p className="club-list__eyebrow">all clubs · {all.length}</p>
        <h2 id="club-list-title">find a club that fits your week</h2>
        <p className="club-list__lead">
          click a row to save it for later. saved clubs collect in the corner; open them to read side by side.
        </p>
      </header>

      <ClubFilters
        value={filter}
        onChange={setFilter}
        onClear={clearFilters}
        total={all.length}
        matched={matched.length}
        unplaced={unplaced.length}
        incoming={filtersIncoming}
        landed={filtersLanded}
      />

      {matched.length === 0 && filterIsActive(filter) ? (
        <p className="club-list__empty">
          {unplaced.length > 0
            ? `no club has published a time that fits. ${
                unplaced.length === 1
                  ? 'the one below hasn’t said when it meets yet.'
                  : `the ${unplaced.length} below haven’t said when they meet yet.`
              }`
            : 'no club matches that.'}{' '}
          <button type="button" className="club-filters__clear" onClick={clearFilters}>
            clear filters
          </button>
        </p>
      ) : null}

      <ol
        className="club-list__rows"
        ref={listRef}
        onPointerLeave={() => {
          setPreview(null)
          endDwell()
        }}
      >
        {rows.map(({ club }) => {
          const caught = shortlist.has(club.slug)
          const unknownTime = timeFilter && unplaced.some((item) => item.club.slug === club.slug)
          const alias = aliasHit(club, filter.query)
          return (
            <li key={club.slug}>
              <div
                className="club-row"
                role="button"
                tabIndex={0}
                aria-pressed={caught}
                aria-label={`${caught ? 'Remove' : 'Save'} ${club.name} ${caught ? 'from' : 'to'} my clubs`}
                data-slug={club.slug}
                data-caught={caught || undefined}
                data-unplaced={unknownTime || undefined}
                onClick={(event) => void catchClub(club, event.currentTarget)}
                onKeyDown={(event) => onRowKeyDown(event, club)}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'touch') return
                  showPreview(club, event.currentTarget)
                  startDwell(club.slug)
                }}
                onPointerLeave={() => {
                  if (previewSuppressed.current === club.slug) previewSuppressed.current = null
                  endDwell()
                }}
                onFocus={(event) => showPreview(club, event.currentTarget)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPreview(null)
                }}
              >
                <span className="club-row__thumb" style={posterVars(club) as CSSProperties} aria-hidden="true" />
                <span className="club-row__main">
                  {hasOwnPage(club) ? (
                    <a
                      className="club-row__name"
                      href={club.href}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      {club.name}
                    </a>
                  ) : (
                    <span className="club-row__name club-row__name--static">
                      {club.name}
                      <small>page coming</small>
                    </span>
                  )}
                  <span className="club-row__blurb">
                    {club.blurb}
                    {alias ? <small className="club-row__alias"> · also: {alias}</small> : null}
                  </span>
                </span>
                <span className="club-row__when">{unknownTime ? 'time not published' : club.next}</span>
                <span className="club-row__mark" aria-hidden="true">
                  {caught ? 'saved ✓' : 'save'}
                </span>
              </div>
            </li>
          )
        })}
      </ol>

      <div
        ref={previewRef}
        className="club-preview"
        data-visible={previewStyle ? '' : undefined}
        style={previewStyle}
        aria-hidden="true"
      />

      <Colophon>a swen303 student project · not an official university site</Colophon>
    </section>
  )
}
