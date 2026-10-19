import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { rememberPoster, takeRememberedPoster, usePins } from './lib/pins'
import { pileTargetRect, prefersReducedMotion } from './lib/shortlist'
import { clubsByTone, clubsByWeek, posterVars, type ClubSummary } from './content/clubs'
import { GolemProvider, useGolemHandle } from './golem/useGolem'
import type { GolemMode } from './golem/Golem'
import { ClubList } from './shortlist/ClubList'
import { CLUB_FILTERS_ID } from './shortlist/ClubFilters'
import { Shortlist } from './shortlist/Shortlist'
import { HeroTitle } from './HeroTitle'
import { HeroSearch } from './home/HeroSearch'
import { posterInteraction } from './lib/poster-interaction'

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

/**
 * One link, one target. "what's on" and "your first visit" went: the homepage
 * is the first screen and the club list; sessions live in each club's
 * coming-up.ics and in my clubs' week view, and how joining works is on every
 * club's first-time.note.
 */
const navigation = [{ label: 'find a club', href: '#clubs' }]

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
  locked?: boolean
  /** Put back after visiting the club, keeping the selected state. */
  restored?: boolean
}

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
      locked: true,
    }
    settledRef.current = restored
    setSettled(restored)
  }, [])

  const toneFor = (order: number) => {
    const sequence = cycleRef.current
    return sequence[order % sequence.length]
  }

  const lockPoster = (card: SettledCard) => {
    const poster = clubsByTone[card.tone].poster
    const halfWidth = poster.width / 2 + 16
    const halfHeight = (poster.height + 120) / 2 + 16
    const next = {
      ...card,
      x: Math.max(halfWidth, Math.min(window.innerWidth - halfWidth, card.x)),
      y: Math.max(halfHeight, Math.min(window.innerHeight - halfHeight, card.y)),
      locked: true,
    }
    settledRef.current = next
    setSettled(next)
    ghostsRef.current = []
    setGhosts([])
  }

  const lockNearest = (point: { x: number; y: number }) => {
    if (!canSettle() || settledRef.current) return

    const living = ghostsRef.current
    if (living.length === 0) return

    let nearest: Ghost | null = null
    let position = point
    let nearestDistance = Number.POSITIVE_INFINITY
    for (const ghost of living) {
      const element = document.querySelector<HTMLElement>(`[data-ghost-id="${ghost.id}"]`)
      if (!element || Number(getComputedStyle(element).opacity) < 0.08) continue
      const rect = element.getBoundingClientRect()
      const centre = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      const distance = Math.hypot(centre.x - point.x, centre.y - point.y)
      if (distance < nearestDistance) {
        nearest = ghost
        nearestDistance = distance
        position = centre
      }
    }
    if (!nearest) return

    const next = {
      id: nearest.id,
      x: position.x,
      y: position.y,
      tone: nearest.tone,
    }
    lockPoster(next)
  }

  const dismissSettled = () => {
    settledRef.current = null
    setSettled(null)
    lastPointer.current = null
    lastEmission.current = null
  }

  const leaveTrace = (event: React.PointerEvent<HTMLElement>) => {
    const now = performance.now()
    const point = { x: event.clientX, y: event.clientY }

    const current = settledRef.current
    if (current) {
      if (posterInteraction(Boolean(current.locked), 'move') === 'keep' || (event.target as HTMLElement).closest('.settled-card')) return
      dismissSettled()
    }

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

  // Depth: where the pointer is on the screen, -1…1 each way. The photo and
  // the title lean against it (hero.css); the trail does not read these.
  const trackDepth = (event: React.PointerEvent<HTMLElement>) => {
    const screen = event.currentTarget
    const rect = screen.getBoundingClientRect()
    screen.style.setProperty('--px', (((event.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3))
    screen.style.setProperty('--py', (((event.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3))
  }

  const onPointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty('--px', '0')
    event.currentTarget.style.setProperty('--py', '0')
    lastPointer.current = null
    lastEmission.current = null
    smoothedSpeed.current = 0
    if (posterInteraction(Boolean(settledRef.current?.locked), 'leave') === 'dismiss') dismissSettled()
  }

  const onFieldClick = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    // Clicks inside the search box are for the search box, not the trail.
    if (target.closest('.settled-card, .image-ghost, .hero-search, a, button')) return
    if (settledRef.current) {
      if (posterInteraction(Boolean(settledRef.current.locked), 'outside') === 'dismiss') dismissSettled()
      return
    }
    lockNearest({ x: event.clientX, y: event.clientY })
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !settledRef.current) return
      settledRef.current = null
      setSettled(null)
      lastPointer.current = null
      lastEmission.current = null
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const club = settled ? clubsByTone[settled.tone % clubsByTone.length] : null

  return (
    <main className="homepage" ref={pageRef}>
      <section
        id="home"
        className="black-field"
        aria-labelledby="hero-title"
        onPointerMove={(event) => {
          trackDepth(event)
          leaveTrace(event)
        }}
        onPointerLeave={onPointerLeave}
        onClick={onFieldClick}
      >
        <img
          className="hero-photo"
          src="/clubs/vicfolk/dancing.jpg"
          alt=""
          fetchPriority="high"
        />
        <header className="header">
          <a className="brand" href="#home" aria-label="vuw clubs home">
            <span>vuw</span>
            <span>clubs.</span>
          </a>
          <nav aria-label="Primary navigation">
            {navigation.map((item) => (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
        </header>

        <div className="ghost-layer">
          {ghosts.map((ghost) => (
            <button
              type="button"
              key={ghost.id}
              className="image-ghost"
              data-ghost-id={ghost.id}
              aria-label={`Stop to look at ${clubsByTone[ghost.tone].name}`}
              onClick={(event) => {
                event.stopPropagation()
                const rect = event.currentTarget.getBoundingClientRect()
                lockPoster({ id: ghost.id, tone: ghost.tone, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
              }}
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
              <i aria-hidden="true" />
            </button>
          ))}
        </div>

        {settled && club ? (
          <a
            className="settled-card"
            href={club.href}
            data-tone={settled.tone}
            data-restored={settled.restored || undefined}
            data-locked={settled.locked || undefined}
            style={{ ...posterStyle(club), left: settled.x, top: settled.y }}
            aria-label={`${club.name}: ${club.blurb}. ${settled.locked ? 'Click again to open this club' : 'Click to stop and preview'}`}
            onClick={(event) => {
              if (posterInteraction(Boolean(settled.locked), 'activate') === 'lock') {
                event.preventDefault()
                lockPoster(settled)
                return
              }
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
              <span className="settled-card__hint">{settled.locked ? 'click again to explore · esc to release' : 'click to stop and look'}</span>
            </span>
          </a>
        ) : null}

        <HeroTitle />
        <HeroSearch />

        <a className="scroll-hint" href="#clubs" aria-label="Browse all clubs">
          <span aria-hidden="true">↓</span>
        </a>

        {/* The glass: scanlines, glare, bezel, and the set switching on. Purely visual. */}
        <div className="crt" aria-hidden="true">
          <span className="crt__scan" />
          <span className="crt__glass" />
          <span className="crt__bezel" />
          <span className="crt__on crt__on--top" />
          <span className="crt__on crt__on--bottom" />
        </div>
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
