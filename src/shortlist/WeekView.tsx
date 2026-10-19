import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { WEEKDAY_LABELS, type ClubSummary } from '../content/clubs'
import { todayWeekday } from '../lib/search'
import { clashes, clock, laneBlocks, weekBlocks, weekRange, type WeekBlock } from './week'

const HOUR_PX = 64
const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

interface WeekViewProps {
  clubs: ClubSummary[]
  /** A block or a name was clicked: show that club's card. */
  onPick: (slug: string) => void
}

/**
 * Saved clubs on one week. Name, day and start–end only; the card has the
 * rest. Two blocks on the same day at the same time go red and get a line
 * of plain text above the grid saying so.
 */
export function WeekView({ clubs, onPick }: WeekViewProps) {
  const blocks = useMemo(() => weekBlocks(clubs), [clubs])
  const found = useMemo(() => clashes(blocks), [blocks])
  const lanes = useMemo(() => laneBlocks(blocks), [blocks])
  const { from, to } = weekRange(blocks)
  const hours = Array.from({ length: (to - from) / 60 + 1 }, (_, index) => from + index * 60)
  const today = todayWeekday()
  const unplaced = clubs.filter((club) => !club.session)
  const clashing = new Set(found.flatMap((clash) => [clash.a.slug, clash.b.slug]))
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // On a narrow screen the grid scrolls sideways: start on the first busy day.
  useEffect(() => {
    const scroller = scrollRef.current
    const first = blocks[0]
    if (!scroller || !first || scroller.scrollWidth <= scroller.clientWidth) return
    const column = scroller.querySelector<HTMLElement>(`.week__day:nth-of-type(${first.weekday + 1})`)
    const axis = scroller.querySelector<HTMLElement>('.week__axis')
    if (column) scroller.scrollLeft = Math.max(0, column.offsetLeft - (axis?.offsetWidth ?? 0) - 8)
  }, [blocks])

  const summary = (() => {
    if (clubs.length < 2) return 'save another club to see whether their nights clash.'
    if (blocks.length < 2) return 'only one of these has a published time, so nothing can clash yet.'
    if (found.length === 0) return 'no clashes: all of these fit in one week.'
    return null
  })()

  const place = (block: WeekBlock): CSSProperties => {
    // Later blocks in an overlap step right and sit on top, so both names
    // stay readable and the overlap itself is still visible.
    const { lane } = lanes.get(block.slug) ?? { lane: 0, lanes: 1 }
    const step = Math.min(lane * 0.22, 0.66)
    return {
      top: ((block.start - from) / 60) * HOUR_PX,
      height: Math.max(30, ((block.end - block.start) / 60) * HOUR_PX),
      left: `calc(6px + (100% - 12px) * ${step})`,
      width: `calc((100% - 12px) * ${1 - step})`,
      zIndex: lane + 1,
    }
  }

  return (
    <div className="week" aria-label="Your clubs on a week">
      <div className="week__status" role="status">
        {summary ? (
          <p>{summary}</p>
        ) : (
          <ul className="week__clashes">
            {found.map(({ a, b, certain }) => (
              <li key={`${a.slug}-${b.slug}`}>
                <span className="week__clash-mark" aria-hidden="true" />
                <strong>{a.name}</strong> and <strong>{b.name}</strong> {certain ? 'clash' : 'may clash'} on{' '}
                {DAY_NAMES[a.weekday - 1]} ({clock(a.start)}
                {a.endKnown ? `–${clock(a.end)}` : ''} vs {clock(b.start)}
                {b.endKnown ? `–${clock(b.end)}` : ''}){certain ? '' : ' — one of them hasn’t said when it ends'}.
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="week__scroll" ref={scrollRef}>
        <div className="week__grid" style={{ '--hours': hours.length - 1, '--hour-px': `${HOUR_PX}px` } as CSSProperties}>
          <div className="week__axis" aria-hidden="true">
            {hours.map((minutes) => (
              <span key={minutes} style={{ top: ((minutes - from) / 60) * HOUR_PX }}>
                {clock(minutes)}
              </span>
            ))}
          </div>
          {WEEKDAY_LABELS.map((label, index) => {
            const weekday = index + 1
            const dayBlocks = blocks.filter((block) => block.weekday === weekday)
            return (
              <div className="week__day" key={label} data-today={weekday === today || undefined}>
                <h3 className="week__day-label">
                  {label}
                  {weekday === today ? <small>today</small> : null}
                </h3>
                <div className="week__column">
                  {hours.slice(1).map((minutes) => (
                    <span
                      key={minutes}
                      className="week__line"
                      aria-hidden="true"
                      style={{ top: ((minutes - from) / 60) * HOUR_PX }}
                    />
                  ))}
                  {dayBlocks.map((block) => (
                    <button
                      key={block.slug}
                      type="button"
                      className="week__block"
                      data-clash={clashing.has(block.slug) || undefined}
                      data-open-end={!block.endKnown || undefined}
                      style={place(block)}
                      onClick={() => onPick(block.slug)}
                      aria-label={`${block.name}, ${DAY_NAMES[block.weekday - 1]} ${clock(block.start)}${
                        block.endKnown ? ` to ${clock(block.end)}` : ', end not published'
                      }. Read the club`}
                    >
                      <span className="week__block-name">{block.name}</span>
                      <span className="week__block-time">
                        {clock(block.start)}
                        {block.endKnown ? `–${clock(block.end)}` : ''}
                      </span>
                      {!block.endKnown ? <span className="week__block-open">end not listed</span> : null}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {unplaced.length > 0 ? (
        <p className="week__unplaced">
          time not published:{' '}
          {unplaced.map((club, index) => (
            <span key={club.slug}>
              {index > 0 ? ', ' : ''}
              <button type="button" onClick={() => onPick(club.slug)}>
                {club.name}
              </button>
            </span>
          ))}
          . their cards say how to ask.
        </p>
      ) : null}
    </div>
  )
}
