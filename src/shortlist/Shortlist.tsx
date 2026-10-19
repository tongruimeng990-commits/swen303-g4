import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { clubBySlug, hasOwnPage, posterVars, type ClubSummary } from '../content/clubs'
import { usePins } from '../lib/pins'
import { MOTION_EASE, MOTION_MS, PILE_ID, SHORTLIST_CATCH_EVENT, pileTargetRect, prefersReducedMotion, useShortlist } from '../lib/shortlist'
import { returnTransform } from './pile-motion'
import { PILE_HIT_EVENT } from '../golem/useGolem'
import { WeekView } from './WeekView'

type Mode = { kind: 'pile' } | { kind: 'spread' } | { kind: 'focus'; slug: string }
type View = 'cards' | 'week'

const PILE_VISIBLE = 5
const STAGGER_MS = 28
/** How long the mouse has to rest on a neighbouring card before it slides in. */
const HOVER_FOCUS_MS = 140
const VIEW_KEY = 'vuwclubs:stage-view'

const rememberedView = (): View => {
  try {
    return sessionStorage.getItem(VIEW_KEY) === 'week' ? 'week' : 'cards'
  } catch {
    return 'cards'
  }
}

/**
 * The pile in the corner, and what happens when you open it:
 * pile → spread (cards side by side) → focus (one card, details) → back.
 */
export function Shortlist({ tone }: { tone: 'dark' | 'light' }) {
  const shortlist = useShortlist()
  const pins = usePins()
  const [mode, setMode] = useState<Mode>({ kind: 'pile' })
  const [view, setView] = useState<View>(rememberedView)
  const [closing, setClosing] = useState(false)
  const closingRef = useRef(false)
  const [caughtHint, setCaughtHint] = useState(false)
  const pileRef = useRef<HTMLButtonElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const rowRef = useRef<HTMLDivElement | null>(null)
  const beforeRects = useRef<Map<string, DOMRect> | null>(null)
  const enteredFrom = useRef<DOMRect | null>(null)

  const clubs = shortlist.items
    .map((slug) => clubBySlug(slug))
    .filter((club): club is ClubSummary => Boolean(club))
  const stageOpen = mode.kind !== 'pile'
  const focusedSlug = mode.kind === 'focus' ? mode.slug : null
  // A focused card is always a card; the week only replaces the spread.
  const showWeek = view === 'week' && mode.kind === 'spread'

  const chooseView = (next: View) => {
    if (closingRef.current) return
    try {
      sessionStorage.setItem(VIEW_KEY, next)
    } catch { /* Forgetting the view between opens is fine. */ }
    setView(next)
    if (next === 'week' && mode.kind === 'focus') setMode({ kind: 'spread' })
  }

  useEffect(() => {
    let timer: number | undefined
    let taught = false
    const onCatch = () => {
      if (taught) return
      try {
        if (sessionStorage.getItem('vuwclubs:catch-taught')) return
        sessionStorage.setItem('vuwclubs:catch-taught', '1')
      } catch { /* The hint still works when storage is unavailable. */ }
      taught = true
      setCaughtHint(true)
      timer = window.setTimeout(() => setCaughtHint(false), 1500)
    }
    window.addEventListener(SHORTLIST_CATCH_EVENT, onCatch)
    return () => {
      window.removeEventListener(SHORTLIST_CATCH_EVENT, onCatch)
      window.clearTimeout(timer)
    }
  }, [])

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

  // Cards behind the week view are display:none; they have no box to animate.
  const cardElements = () =>
    Array.from(rowRef.current?.querySelectorAll<HTMLElement>('.shortlist-card') ?? []).filter(
      (el) => el.offsetWidth > 0,
    )

  const snapshot = () => {
    const map = new Map<string, DOMRect>()
    for (const el of cardElements()) {
      const visible = el.getBoundingClientRect()
      el.getAnimations().forEach((animation) => animation.cancel())
      map.set(el.dataset.slug ?? '', visible)
    }
    beforeRects.current = map
  }

  const open = () => {
    if (closingRef.current || !clubs.length) return
    enteredFrom.current = pileTargetRect()
    setMode({ kind: 'spread' })
  }

  const close = useCallback(async () => {
    if (closingRef.current) return
    closingRef.current = true
    setClosing(true)
    const target = pileTargetRect()
    const reduced = prefersReducedMotion()
    const animations = cardElements().map((el, index) => {
      const visible = el.getBoundingClientRect()
      const opacity = getComputedStyle(el).opacity
      el.getAnimations().forEach((animation) => animation.cancel())
      const rect = el.getBoundingClientRect()
      if (!target || reduced) {
        return el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }).finished
      }
      return el.animate(
        [
          { transform: returnTransform(rect, visible), opacity },
          { transform: returnTransform(rect, target), opacity: 0.4 },
        ],
        { duration: MOTION_MS - 60, delay: index * (STAGGER_MS / 2), easing: MOTION_EASE, fill: 'forwards' },
      ).finished
    })
    await Promise.allSettled(animations)
    setMode({ kind: 'pile' })
    setClosing(false)
    closingRef.current = false
    pileRef.current?.focus({ preventScroll: true })
  }, [])

  const focusCard = (slug: string) => {
    if (closingRef.current) return
    snapshot()
    setMode({ kind: 'focus', slug })
  }

  const unfocus = () => {
    if (closingRef.current) return
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
    const first =
      rowRef.current?.querySelector<HTMLElement>(
        focusedSlug ? `.shortlist-card[data-slug="${focusedSlug}"]` : '.shortlist-card',
      ) ?? stageRef.current?.querySelector<HTMLElement>('.shortlist-stage__view [aria-pressed="true"]')
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
  }, [stageOpen, mode, showWeek])

  const onCardClick = (event: MouseEvent<HTMLElement>, club: ClubSummary) => {
    const target = event.target as HTMLElement
    if (target.closest('a, button, input')) return
    if (focusedSlug === club.slug) return
    focusCard(club.slug)
  }

  // While one card is open, resting the mouse on a neighbour slides to it; no
  // click needed. Only real pointer movement counts (cards re-laying out under
  // a still mouse don't), and a short rest filters out passing through. Touch
  // and pen keep tapping. Spread mode stays click: there you are meant to
  // read the cards side by side.
  const hoverTimer = useRef<number | null>(null)
  const cancelHover = () => {
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
  }
  const onCardPointerMove = (event: ReactPointerEvent<HTMLElement>, club: ClubSummary) => {
    if (event.pointerType !== 'mouse') return
    if (mode.kind !== 'focus' || mode.slug === club.slug) return cancelHover()
    if (hoverTimer.current !== null) return
    hoverTimer.current = window.setTimeout(() => {
      hoverTimer.current = null
      if (closingRef.current) return
      focusCard(club.slug)
    }, HOVER_FOCUS_MS)
  }
  useEffect(() => cancelHover, [])

  const count = clubs.length
  const label = caughtHint ? `saved ✓ · ${count}` : `my clubs · ${count}`

  return (
    <>
      <button
        ref={pileRef}
        id={PILE_ID}
        type="button"
        className="shortlist-pile"
        data-open={stageOpen || undefined}
        aria-label={`${label}. Open my clubs`}
        aria-expanded={stageOpen}
        aria-disabled={count === 0}
        onClick={open}
      >
        <span className="shortlist-pile__stack" aria-hidden="true">
          {count === 0 && <span className="shortlist-pile__empty">save a club<br />to compare</span>}
          {clubs.slice(-PILE_VISIBLE).map((club, index) => (
            <span
              key={club.slug}
              className="shortlist-pile__card"
              style={{ ...posterVars(club), '--i': index } as CSSProperties}
            />
          ))}
        </span>
        <span className="shortlist-pile__label" aria-live="polite">{label}</span>
      </button>

      {stageOpen ? (
        <div
          ref={stageRef}
          className="shortlist-stage"
          data-tone={tone}
          data-mode={mode.kind}
          data-view={showWeek ? 'week' : 'cards'}
          data-closing={closing || undefined}
          role="dialog"
          aria-modal="true"
          aria-label="My clubs"
        >
          <div className="shortlist-stage__scrim" onClick={() => void close()} />
          <div className="shortlist-stage__view" role="group" aria-label="Show my clubs as">
            <button type="button" aria-pressed={!showWeek} onClick={() => chooseView('cards')}>
              cards
            </button>
            <button type="button" aria-pressed={showWeek} onClick={() => chooseView('week')}>
              week
            </button>
          </div>
          {showWeek ? (
            <WeekView
              clubs={clubs}
              onPick={(slug) => {
                chooseView('cards')
                focusCard(slug)
              }}
            />
          ) : null}
          <div
            className="shortlist-stage__row"
            ref={rowRef}
            data-closing={closing || undefined}
            hidden={showWeek}
          >
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
                  onPointerMove={(event) => onCardPointerMove(event, club)}
                  onPointerLeave={cancelHover}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      if (!focused) focusCard(club.slug)
                    }
                  }}
                >
                  <div className="shortlist-card__bar">
                    <span className="shortlist-card__lights" aria-hidden="true">
                      <span className="shortlist-card__dot" />
                      <span className="shortlist-card__dot" />
                      <span className="shortlist-card__dot" />
                    </span>
                    <span className="shortlist-card__title">{club.slug}.poster</span>
                    <button
                      type="button"
                      className="shortlist-card__remove"
                      aria-label={`Remove ${club.name} from my clubs`}
                      onClick={() => void removeCard(club.slug)}
                    >
                      remove
                    </button>
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
                          {hasOwnPage(club) && <a className="shortlist-button shortlist-button--primary" href={`${club.href}#say-hi`}>come along →</a>}
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
                          <button type="button" onClick={unfocus}>back to my clubs</button>
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
            {mode.kind === 'focus'
              ? 'hover or ← → for the next club · esc back'
              : showWeek
                ? 'click a block to read that club · esc closes'
                : 'click a card to read · esc closes'}
          </p>
        </div>
      ) : null}
    </>
  )
}
