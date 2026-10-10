import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react'
import { clubBySlug, hasOwnPage, posterVars, type ClubSummary } from '../content/clubs'
import { usePins } from '../lib/pins'
import { MOTION_EASE, MOTION_MS, PILE_ID, prefersReducedMotion, useShortlist } from '../lib/shortlist'
import { PILE_HIT_EVENT } from '../golem/useGolem'

type Mode = { kind: 'pile' } | { kind: 'spread' } | { kind: 'focus'; slug: string }

const PILE_VISIBLE = 5
const STAGGER_MS = 28

/**
 * The pile in the corner, and what happens when you open it:
 * pile → spread (cards side by side) → focus (one card, details) → back.
 */
export function Shortlist({ tone }: { tone: 'dark' | 'light' }) {
  const shortlist = useShortlist()
  const pins = usePins()
  const [mode, setMode] = useState<Mode>({ kind: 'pile' })
  const [closing, setClosing] = useState(false)
  const pileRef = useRef<HTMLButtonElement | null>(null)
  const rowRef = useRef<HTMLDivElement | null>(null)
  const beforeRects = useRef<Map<string, DOMRect> | null>(null)
  const enteredFrom = useRef<DOMRect | null>(null)

  const clubs = shortlist.items
    .map((slug) => clubBySlug(slug))
    .filter((club): club is ClubSummary => Boolean(club))
  const stageOpen = mode.kind !== 'pile'
  const focusedSlug = mode.kind === 'focus' ? mode.slug : null

  // If the focused club disappears (removed here or in another tab), fall back.
  useEffect(() => {
    if (focusedSlug && !clubs.some((club) => club.slug === focusedSlug)) {
      setMode(clubs.length ? { kind: 'spread' } : { kind: 'pile' })
    } else if (stageOpen && clubs.length === 0) {
      setMode({ kind: 'pile' })
    }
  }, [clubs, focusedSlug, stageOpen])

  // A poster landing on the pile: a quick shake, the label bumps, then still.
  useEffect(() => {
    const onHit = () => {
      const pile = pileRef.current
      if (!pile || prefersReducedMotion()) return
      pile.animate(
        [
          { transform: 'translate(0, 0) rotate(0deg)' },
          { transform: 'translate(-3px, 2px) rotate(-2deg)', offset: 0.2 },
          { transform: 'translate(3px, -1px) rotate(2deg)', offset: 0.4 },
          { transform: 'translate(-2px, 1px) rotate(-1.2deg)', offset: 0.6 },
          { transform: 'translate(1px, 0) rotate(0.6deg)', offset: 0.8 },
          { transform: 'translate(0, 0) rotate(0deg)' },
        ],
        { duration: 300, easing: 'ease-out' },
      )
      const label = pile.querySelector<HTMLElement>('.shortlist-pile__label')
      label?.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.18)', offset: 0.35 }, { transform: 'scale(1)' }],
        { duration: 260, easing: MOTION_EASE },
      )
    }
    window.addEventListener(PILE_HIT_EVENT, onHit)
    return () => window.removeEventListener(PILE_HIT_EVENT, onHit)
  }, [])

  const cardElements = () =>
    Array.from(rowRef.current?.querySelectorAll<HTMLElement>('.shortlist-card') ?? [])

  const snapshot = () => {
    const map = new Map<string, DOMRect>()
    for (const el of cardElements()) map.set(el.dataset.slug ?? '', el.getBoundingClientRect())
    beforeRects.current = map
  }

  const open = () => {
    enteredFrom.current = pileRef.current?.getBoundingClientRect() ?? null
    setMode({ kind: 'spread' })
  }

  const close = useCallback(async () => {
    if (closing) return
    setClosing(true)
    const target = pileRef.current?.getBoundingClientRect()
    const reduced = prefersReducedMotion()
    const animations = cardElements().map((el, index) => {
      const rect = el.getBoundingClientRect()
      if (!target || reduced) {
        return el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }).finished
      }
      const dx = target.left + target.width / 2 - (rect.left + rect.width / 2)
      const dy = target.top + target.height / 2 - (rect.top + rect.height / 2)
      const scale = target.width / rect.width
      return el.animate(
        [
          { transform: 'none', opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0.4 },
        ],
        { duration: MOTION_MS - 60, delay: index * (STAGGER_MS / 2), easing: MOTION_EASE, fill: 'forwards' },
      ).finished
    })
    await Promise.allSettled(animations)
    setMode({ kind: 'pile' })
    setClosing(false)
    pileRef.current?.focus({ preventScroll: true })
  }, [closing])

  const focusCard = (slug: string) => {
    snapshot()
    setMode({ kind: 'focus', slug })
  }

  const unfocus = () => {
    snapshot()
    setMode({ kind: 'spread' })
  }

  const step = (direction: 1 | -1) => {
    if (!focusedSlug) return
    const index = clubs.findIndex((club) => club.slug === focusedSlug)
    const next = clubs[(index + direction + clubs.length) % clubs.length]
    if (next) focusCard(next.slug)
  }

  const removeCard = async (slug: string) => {
    const el = rowRef.current?.querySelector<HTMLElement>(`.shortlist-card[data-slug="${slug}"]`)
    snapshot()
    beforeRects.current?.delete(slug)
    if (el) {
      const reduced = prefersReducedMotion()
      await el.animate(
        reduced
          ? [{ opacity: 1 }, { opacity: 0 }]
          : [
              { transform: 'none', opacity: 1 },
              { transform: 'translateY(48px) rotate(-3deg) scale(0.92)', opacity: 0 },
            ],
        { duration: 220, easing: 'ease-in', fill: 'forwards' },
      ).finished.catch(() => undefined)
    }
    shortlist.remove(slug)
  }

  // Entrance from the pile, and FLIP for every later layout change.
  useLayoutEffect(() => {
    if (!stageOpen) return
    const reduced = prefersReducedMotion()
    const cards = cardElements()
    const from = enteredFrom.current
    const before = beforeRects.current
    enteredFrom.current = null
    beforeRects.current = null

    cards.forEach((el, index) => {
      const rect = el.getBoundingClientRect()
      const slug = el.dataset.slug ?? ''
      const origin = from ?? before?.get(slug) ?? null
      if (!origin) {
        if (from === null && before) {
          // new card appearing mid-session: just fade in
          el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'backwards' })
        }
        return
      }
      if (reduced) {
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, fill: 'backwards' })
        return
      }
      const dx = origin.left + origin.width / 2 - (rect.left + rect.width / 2)
      const dy = origin.top + origin.height / 2 - (rect.top + rect.height / 2)
      const scale = origin.width / rect.width
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: from ? 0.5 : 1 },
          { transform: 'none', opacity: 1 },
        ],
        {
          duration: MOTION_MS,
          delay: from ? index * STAGGER_MS : 0,
          easing: MOTION_EASE,
          fill: 'backwards',
        },
      )
    })
  }, [mode, stageOpen, clubs.length])

  // Keyboard, scroll lock and initial focus while the stage is open.
  useEffect(() => {
    if (!stageOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const first = rowRef.current?.querySelector<HTMLElement>(
      focusedSlug ? `.shortlist-card[data-slug="${focusedSlug}"]` : '.shortlist-card',
    )
    first?.focus({ preventScroll: true })

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (mode.kind === 'focus') unfocus()
        else void close()
      } else if (mode.kind === 'focus' && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
        event.preventDefault()
        step(event.key === 'ArrowRight' ? 1 : -1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageOpen, mode])

  const onCardClick = (event: MouseEvent<HTMLElement>, club: ClubSummary) => {
    const target = event.target as HTMLElement
    if (target.closest('a, button, input')) return
    if (focusedSlug === club.slug) return
    focusCard(club.slug)
  }

  if (clubs.length === 0 && !stageOpen) return null

  const count = clubs.length
  const label = count === 1 ? '1 to read' : `${count} to read`

  return (
    <>
      <button
        ref={pileRef}
        id={PILE_ID}
        type="button"
        className="shortlist-pile"
        data-open={stageOpen || undefined}
        aria-label={`${label}. Open your pile`}
        aria-expanded={stageOpen}
        onClick={open}
      >
        <span className="shortlist-pile__stack" aria-hidden="true">
          {clubs.slice(-PILE_VISIBLE).map((club, index) => (
            <span
              key={club.slug}
              className="shortlist-pile__card"
              style={{ ...posterVars(club), '--i': index } as CSSProperties}
            />
          ))}
        </span>
        <span className="shortlist-pile__label">{label}</span>
      </button>

      {stageOpen ? (
        <div
          className="shortlist-stage"
          data-tone={tone}
          data-mode={mode.kind}
          data-closing={closing || undefined}
          role="dialog"
          aria-modal="true"
          aria-label="Your pile"
        >
          <div className="shortlist-stage__scrim" onClick={() => void close()} />
          <div className="shortlist-stage__row" ref={rowRef}>
            {clubs.map((club) => {
              const focused = focusedSlug === club.slug
              const quiet = focusedSlug !== null && !focused
              const pinned = pins.isPinned(club.slug)
              const signal = club.signals?.[0]
              return (
                <article
                  key={club.slug}
                  className="shortlist-card"
                  data-slug={club.slug}
                  data-focused={focused || undefined}
                  data-quiet={quiet || undefined}
                  tabIndex={0}
                  aria-label={`${club.name}${focused ? '' : ', read'}`}
                  onClick={(event) => onCardClick(event, club)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      if (!focused) focusCard(club.slug)
                    }
                  }}
                >
                  <div className="shortlist-card__bar">
                    <button
                      type="button"
                      className="shortlist-card__close"
                      aria-label={`Remove ${club.name} from your pile`}
                      onClick={() => void removeCard(club.slug)}
                    />
                    <span className="shortlist-card__dot" aria-hidden="true" />
                    <span className="shortlist-card__dot" aria-hidden="true" />
                    <span className="shortlist-card__title">{club.slug}.poster</span>
                  </div>
                  <div className="shortlist-card__body">
                    <div className="shortlist-card__poster" style={posterVars(club) as CSSProperties} />
                    <div className="shortlist-card__note" aria-hidden={focused || undefined}>
                      <span>{club.when ?? 'details coming'}</span>
                      <span>{club.where ?? club.next}</span>
                      <span>{signal ?? club.blurb}</span>
                    </div>
                    {focused ? (
                      <div className="shortlist-card__details">
                        <h3>{club.name}</h3>
                        <p className="shortlist-card__blurb">{club.blurb}</p>
                        <dl>
                          <div>
                            <dt>when</dt>
                            <dd>{club.when ?? <em>details coming</em>}</dd>
                          </div>
                          <div>
                            <dt>where</dt>
                            <dd>{club.where ?? <em>details coming</em>}</dd>
                          </div>
                          <div>
                            <dt>who it’s for</dt>
                            <dd>{club.signals?.length ? club.signals.join(' · ') : <em>details coming</em>}</dd>
                          </div>
                          <div>
                            <dt>reach them</dt>
                            <dd>{club.contact?.length ? club.contact.join(' · ') : <em>details coming</em>}</dd>
                          </div>
                        </dl>
                        <div className="shortlist-card__actions">
                          {hasOwnPage(club) ? (
                            <a className="shortlist-button shortlist-button--primary" href={club.href}>
                              open {club.slug}
                            </a>
                          ) : (
                            <span className="shortlist-button" aria-disabled="true">
                              no page yet
                            </span>
                          )}
                          <button
                            type="button"
                            className="shortlist-button shortlist-button--pin"
                            aria-pressed={pinned}
                            onClick={() => pins.toggle(club.slug)}
                          >
                            <span className="shortlist-button__pin" aria-hidden="true" />
                            {pinned ? 'pinned to my desk' : 'pin to my desk'}
                          </button>
                        </div>
                        <div className="shortlist-card__nav">
                          <button type="button" onClick={() => step(-1)} aria-label="Previous club">←</button>
                          <button type="button" onClick={unfocus}>back to the pile</button>
                          <button type="button" onClick={() => step(1)} aria-label="Next club">→</button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
          <p className="shortlist-stage__hint" aria-hidden="true">
            {mode.kind === 'focus' ? '← → next club · esc back' : 'click a card to read · red dot removes · esc closes'}
          </p>
        </div>
      ) : null}
    </>
  )
}
