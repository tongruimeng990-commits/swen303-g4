import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { rememberPoster, takeRememberedPoster, usePins } from './lib/pins'
import { pileTargetRect, prefersReducedMotion } from './lib/shortlist'
import { clubsByTone, clubsByWeek, posterVars, type ClubSummary } from './content/clubs'
import { GolemProvider, useGolemHandle } from './golem/useGolem'
import type { GolemMode } from './golem/Golem'
import { ClubList } from './shortlist/ClubList'
import { CLUB_FILTERS_ID } from './shortlist/ClubFilters'
import { Shortlist } from './shortlist/Shortlist'

const Golem = lazy(() => import('./golem/Golem'))

/** How far below the white page's top edge the golem's feet land when it digs out. */
const GOLEM_EMERGE_DEPTH = 40

/** 'incoming' = waiting for the golem's throw; 'landed' = just thrown; 'placed' = simply there. */
type ToolsState = 'incoming' | 'landed' | 'placed'
const TOOLS_THROWN_KEY = 'vuwclubs:tools-thrown'
/** Pause between the golem digging out and tossing the filter bar. */
const TOOLS_THROW_DELAY_MS = 1000
/** White page on screen this long with no golem: show the bar plainly. */
const TOOLS_PLAIN_AFTER_MS = 2500

function shouldThrowTools() {
  if (typeof window === 'undefined') return false
  if (prefersReducedMotion()) return false
  if (!window.matchMedia('(pointer: fine)').matches) return false
  try {
    return !sessionStorage.getItem(TOOLS_THROWN_KEY)
  } catch {
    return false
  }
}

const clubsTop = () => document.getElementById('clubs')?.getBoundingClientRect().top ?? 0

const golemRestingSpot = () => {
  const pile = pileTargetRect()
  return { x: pile.left - 34, y: pile.bottom - 4 }
}

const navigation = [
  { label: 'what’s on', href: '#this-week', featured: true },
  { label: 'find a club', href: '#clubs' },
  { label: 'your first visit', href: '#first-visit' },
  { label: 'about', href: '#about', quiet: true },
]

const RESTORED_DISMISS_DISTANCE = 140
/** How far you scroll (in viewport heights) before the hero has fully retreated. */
const REVEAL_DISTANCE = 0.8

const posterStyle = (club: ClubSummary) => posterVars(club) as CSSProperties

/**
 * Which posters come up as you move, and in what order.
 * First visit: clubs with the soonest night first. With pins: your clubs
 * first, and they come round twice as often as the rest.
 */
function buildCycle(pins: string[]): number[] {
  const byWeek = clubsByWeek().map((item) => item.tone)
  const pinned = byWeek.filter((tone) => pins.includes(clubsByTone[tone].slug))
  if (pinned.length === 0) return byWeek
  const rest = byWeek.filter((tone) => !pinned.includes(tone))
  return [...pinned, ...rest, ...pinned]
}

interface Ghost {
  id: number
  x: number
  y: number
  tone: number
  order: number
  driftX: number
  driftY: number
  rotation: number
}

interface SettledCard {
  id: number
  x: number
  y: number
  tone: number
  /** put back from a previous visit; sticks until the pointer moves well away */
  restored?: boolean
}

const SETTLE_IDLE_MS = 400

function canSettle() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (!window.matchMedia('(pointer: fine)').matches) return false
  return true
}

export function EditorialPage() {
  const [ghosts, setGhosts] = useState<Ghost[]>([])
  const [settled, setSettled] = useState<SettledCard | null>(null)
  const ghostSerial = useRef(0)
  const lastPointer = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastEmission = useRef<{ x: number; y: number; time: number } | null>(null)
  const smoothedSpeed = useRef(0)
  const ghostsRef = useRef<Ghost[]>([])
  const settledRef = useRef<SettledCard | null>(null)
  const idleTimer = useRef<number | null>(null)
  const { pins } = usePins()
  const cycle = useMemo(() => buildCycle(pins), [pins])
  const cycleRef = useRef(cycle)
  const pageRef = useRef<HTMLElement | null>(null)

  // The golem digs out where the pointer first crosses into the white page.
  const golemHandle = useGolemHandle()
  const [golem, setGolem] = useState<{ origin: { x: number; y: number }; mode: GolemMode } | null>(null)
  const summonGolem = useCallback((origin: { x: number; y: number }, mode: GolemMode) => {
    if (prefersReducedMotion()) return
    setGolem((current) => current ?? { origin, mode })
  }, [])

  const onClubsPointerEnter = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return
    summonGolem({ x: event.clientX, y: clubsTop() + GOLEM_EMERGE_DEPTH }, 'pointer')
  }

  // No pointer to follow (touch): the golem arrives when the white page scrolls into view.
  useEffect(() => {
    if (!window.matchMedia('(pointer: coarse)').matches) return
    const clubs = document.getElementById('clubs')
    if (!clubs) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          summonGolem(golemRestingSpot(), 'touch')
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(clubs)
    return () => observer.disconnect()
  }, [summonGolem])

  // The filter bar: once per session the golem throws it into place. Until
  // then it is in the DOM but unseen; several things reveal it plainly so
  // nobody is left without filters (touch, keyboard focus, no golem in time).
  const [tools, setTools] = useState<ToolsState>(() => (shouldThrowTools() ? 'incoming' : 'placed'))
  const toolsRef = useRef(tools)
  toolsRef.current = tools
  const revealTools = useCallback((how: 'landed' | 'placed') => {
    try {
      sessionStorage.setItem(TOOLS_THROWN_KEY, '1')
    } catch {
      // private mode without storage: the throw may replay next visit, no harm
    }
    setTools((current) => (current === 'incoming' ? how : current))
  }, [])

  useEffect(() => {
    if (tools !== 'incoming') return
    const bar = document.getElementById(CLUB_FILTERS_ID)
    const clubs = document.getElementById('clubs')
    if (!bar || !clubs) {
      revealTools('placed')
      return
    }
    const onFocus = () => revealTools('placed')
    bar.addEventListener('focusin', onFocus)
    // The white page is on screen but no golem has come: show the bar anyway.
    let timer: number | null = null
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || timer !== null) return
        timer = window.setTimeout(() => {
          if (toolsRef.current === 'incoming' && !golemHandle.current.performer) revealTools('placed')
        }, TOOLS_PLAIN_AFTER_MS)
      },
      { threshold: 0.3 },
    )
    observer.observe(clubs)
    return () => {
      bar.removeEventListener('focusin', onFocus)
      observer.disconnect()
      if (timer !== null) window.clearTimeout(timer)
    }
  }, [tools, revealTools, golemHandle])

  // Touch mode never throws: the golem sits by the pile and the bar is simply there.
  useEffect(() => {
    if (golem?.mode === 'touch') revealTools('placed')
  }, [golem, revealTools])

  const onGolemEmerged = useCallback(() => {
    window.setTimeout(() => {
      void (async () => {
        if (toolsRef.current !== 'incoming') return
        const performer = golemHandle.current.performer
        const bar = document.getElementById(CLUB_FILTERS_ID)
        if (!performer || !bar) {
          revealTools('placed')
          return
        }
        const to = bar.getBoundingClientRect()
        const onScreen = to.top >= 0 && to.bottom <= window.innerHeight
        if (!onScreen) {
          revealTools('placed')
          return
        }
        const ghost = bar.cloneNode(true) as HTMLElement
        ghost.removeAttribute('id')
        ghost.removeAttribute('data-incoming')
        ghost.removeAttribute('role')
        ghost.setAttribute('aria-hidden', 'true')
        ghost.inert = true
        ghost.classList.add('club-filters--ghost')
        Object.assign(ghost.style, {
          left: `${to.left}px`,
          top: `${to.top}px`,
          width: `${to.width}px`,
          height: `${to.height}px`,
          // unseen until the golem has it in hand (it may be mid-kick)
          opacity: '0',
        })
        document.body.appendChild(ghost)
        try {
          await performer.throwTools(ghost, to)
        } finally {
          // Reveal the real bar first, then drop the copy a frame later so
          // there is never a frame with neither on screen.
          revealTools('landed')
          requestAnimationFrame(() => requestAnimationFrame(() => ghost.remove()))
        }
      })()
    }, TOOLS_THROW_DELAY_MS)
  }, [golemHandle, revealTools])

  // Pinned hero: one passive scroll listener writes --reveal (0–1) for the CSS to use.
  // (Written synchronously: it is a single style property, and scroll events
  // are already frame-aligned.)
  useEffect(() => {
    const update = () => {
      const page = pageRef.current
      if (!page) return
      const progress = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * REVEAL_DISTANCE)))
      page.style.setProperty('--reveal', progress.toFixed(3))
      page.toggleAttribute('data-revealed', progress > 0.6)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    cycleRef.current = cycle
  }, [cycle])

  useEffect(() => {
    ghostsRef.current = ghosts
  }, [ghosts])

  useEffect(() => {
    settledRef.current = settled
  }, [settled])

  useEffect(() => {
    return () => {
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current)
    }
  }, [])

  // Coming back from a club page: put the poster you left through back where it was.
  useEffect(() => {
    const remembered = takeRememberedPoster()
    if (!remembered) return
    const tone = clubsByTone.findIndex((club) => club.slug === remembered.slug)
    if (tone < 0) return
    const restored: SettledCard = {
      id: -1,
      x: Math.min(Math.max(remembered.fx, 0.08), 0.92) * window.innerWidth,
      y: Math.min(Math.max(remembered.fy, 0.12), 0.88) * window.innerHeight,
      tone,
      restored: true,
    }
    settledRef.current = restored
    setSettled(restored)
  }, [])

  const toneFor = (order: number) => {
    const sequence = cycleRef.current
    return sequence[order % sequence.length]
  }

  const clearIdleTimer = () => {
    if (idleTimer.current !== null) {
      window.clearTimeout(idleTimer.current)
      idleTimer.current = null
    }
  }

  const settleNearest = (point: { x: number; y: number }) => {
    if (!canSettle() || settledRef.current) return

    const living = ghostsRef.current
    if (living.length === 0) return

    let nearest = living[0]
    let nearestDistance = Number.POSITIVE_INFINITY
    for (const ghost of living) {
      const distance = Math.hypot(ghost.x - point.x, ghost.y - point.y)
      if (distance < nearestDistance) {
        nearest = ghost
        nearestDistance = distance
      }
    }

    setGhosts((current) => current.filter((item) => item.id !== nearest.id))
    const next = {
      id: nearest.id,
      x: nearest.x,
      y: nearest.y,
      tone: nearest.tone,
    }
    settledRef.current = next
    setSettled(next)
  }

  const scheduleSettle = (point: { x: number; y: number }) => {
    clearIdleTimer()
    if (!canSettle() || settledRef.current) return
    idleTimer.current = window.setTimeout(() => {
      idleTimer.current = null
      settleNearest(point)
    }, SETTLE_IDLE_MS)
  }

  const dismissSettled = () => {
    settledRef.current = null
    setSettled(null)
  }

  const leaveTrace = (event: React.PointerEvent<HTMLElement>) => {
    const now = performance.now()
    const point = { x: event.clientX, y: event.clientY }

    const current = settledRef.current
    if (current) {
      if (
        current.restored &&
        Math.hypot(current.x - point.x, current.y - point.y) < RESTORED_DISMISS_DISTANCE
      ) {
        // You came back to this poster; leave it until you actually move on.
        return
      }
      dismissSettled()
    }

    scheduleSettle(point)

    const previousPointer = lastPointer.current
    const previousEmission = lastEmission.current

    if (!previousPointer || !previousEmission) {
      const order = ghostSerial.current++
      lastPointer.current = { ...point, time: now }
      lastEmission.current = { ...point, time: now }
      setGhosts((current) => [
        ...current.slice(-7),
        {
          id: now + order / 1000,
          ...point,
          tone: toneFor(order),
          order,
          driftX: 0,
          driftY: -15,
          rotation: 2,
        },
      ])
      return
    }

    const eventDistance = Math.hypot(
      point.x - previousPointer.x,
      point.y - previousPointer.y,
    )
    const elapsed = Math.max(1, now - previousPointer.time)
    const instantSpeed = eventDistance / elapsed
    smoothedSpeed.current += (instantSpeed - smoothedSpeed.current) * 0.28
    const speed = smoothedSpeed.current
    lastPointer.current = { ...point, time: now }

    const dx = point.x - previousEmission.x
    const dy = point.y - previousEmission.y
    const distance = Math.hypot(dx, dy)
    const minimumDistance = Math.min(80, Math.max(50, 54 + speed * 5))
    const minimumInterval = 120
    if (
      distance < minimumDistance ||
      now - previousEmission.time < minimumInterval
    ) return

    const ux = dx / distance
    const uy = dy / distance
    const order = ghostSerial.current++
    const momentum = Math.min(115, 28 + speed * 16)
    const sideways = order % 2 ? 7 : -7
    const next: Ghost = {
      id: now + order / 1000,
      ...point,
      tone: toneFor(order),
      order,
      driftX: ux * momentum - uy * sideways,
      driftY: uy * momentum + ux * sideways,
      rotation: (order % 2 ? 1 : -1) * Math.min(5, 2 + speed * 0.8),
    }
    lastEmission.current = { ...point, time: now }
    setGhosts((current) => [...current.slice(-7), next])
  }

  const onPointerLeave = () => {
    clearIdleTimer()
    lastPointer.current = null
    lastEmission.current = null
    smoothedSpeed.current = 0
    dismissSettled()
  }

  const onFieldPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (target.closest('.settled-card')) return
    if (settledRef.current) dismissSettled()
  }

  const club = settled ? clubsByTone[settled.tone % clubsByTone.length] : null

  return (
    <main className="homepage" ref={pageRef}>
      <section
        className="black-field"
        aria-labelledby="hero-title"
        onPointerMove={leaveTrace}
        onPointerLeave={onPointerLeave}
        onPointerDown={onFieldPointerDown}
      >
        <header className="header">
          <a className="brand" href="#home" aria-label="vuw clubs home">
            <span>vuw</span>
            <span>clubs.</span>
          </a>
          <nav aria-label="Primary navigation">
            {navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={[
                  item.featured ? 'nav-link--featured' : '',
                  item.quiet ? 'nav-link--quiet' : '',
                ].filter(Boolean).join(' ')}
              >
                {item.featured ? <span className="nav-live-dot" aria-hidden="true" /> : null}
                {item.label}
              </a>
            ))}
          </nav>
        </header>

        <div className="ghost-layer" aria-hidden="true">
          {ghosts.map((ghost) => (
            <span
              key={ghost.id}
              className="image-ghost"
              data-tone={ghost.tone}
              data-pinned={pins.includes(clubsByTone[ghost.tone].slug) || undefined}
              data-quiet={(pins.length > 0 && !pins.includes(clubsByTone[ghost.tone].slug)) || undefined}
              style={{
                ...posterStyle(clubsByTone[ghost.tone]),
                left: ghost.x,
                top: ghost.y,
                zIndex: ghost.order,
                '--drift-x': `${ghost.driftX}px`,
                '--drift-y': `${ghost.driftY}px`,
                '--drift-rotation': `${ghost.rotation}deg`,
              } as CSSProperties}
              onAnimationEnd={(event) => {
                if (
                  event.target !== event.currentTarget ||
                  event.animationName !== 'ghost-life'
                ) return
                setGhosts((current) => current.filter((item) => item.id !== ghost.id))
              }}
            >
              <i />
            </span>
          ))}
        </div>

        {settled && club ? (
          <a
            className="settled-card"
            href={club.href}
            data-tone={settled.tone}
            data-restored={settled.restored || undefined}
            style={{ ...posterStyle(club), left: settled.x, top: settled.y }}
            aria-label={`${club.name}: ${club.blurb}. Next: ${club.next}`}
            onClick={() => {
              if (club.href.startsWith('#')) return
              rememberPoster({
                slug: club.slug,
                fx: settled.x / window.innerWidth,
                fy: settled.y / window.innerHeight,
              })
            }}
          >
            <span className="settled-card__image" aria-hidden="true" />
            <span className="settled-card__copy">
              <span className="settled-card__name">
                {club.name}
                {pins.includes(club.slug) ? <span className="settled-card__pin">pinned</span> : null}
              </span>
              <span className="settled-card__blurb">{club.blurb}</span>
              <span className="settled-card__next">{club.next}</span>
            </span>
          </a>
        ) : null}

        <h1 id="hero-title" className="stair-title">
          <span className="stair-title__global">your</span>
          <span className="stair-title__creative">VUW</span>
          <span className="stair-title__studio">club.</span>
        </h1>

        <p className="aside-copy aside-copy--one">find a club that fits your week</p>
        <p className="aside-copy aside-copy--two">know before you go</p>

        <div className="dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <a className="scroll-hint" href="#clubs">
          <span>scroll</span>
          <span aria-hidden="true">·</span>
          <span>all clubs</span>
        </a>
      </section>

      <GolemProvider value={golemHandle}>
        <div className="clubs-sheet" onPointerEnter={onClubsPointerEnter}>
          <ClubList filtersIncoming={tools === 'incoming'} filtersLanded={tools === 'landed'} />
        </div>
        <Shortlist tone="dark" />
        {golem ? (
          <Suspense fallback={null}>
            <Golem
              handle={golemHandle}
              origin={golem.origin}
              mode={golem.mode}
              boundaryTop={clubsTop}
              restingSpot={golemRestingSpot}
              onEmerged={onGolemEmerged}
            />
          </Suspense>
        ) : null}
      </GolemProvider>
    </main>
  )
}
