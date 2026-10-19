import { useCallback, useEffect, useState } from 'react'

/**
 * The shortlist: clubs you "caught" while scanning the list and want to read
 * later. Ordered by when you caught them. localStorage, so per browser.
 * Independent from pins ("I'm going").
 */

const KEY = 'vuwclubs:shortlist'
const EVENT = 'vuwclubs:shortlist-change'
export const SHORTLIST_CATCH_EVENT = 'vuwclubs:shortlist-catch'

export function readShortlist(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function writeShortlist(slugs: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(slugs))
  } catch {
    // storage blocked: the pile just won't survive a reload
  }
  window.dispatchEvent(new Event(EVENT))
}

export function useShortlist() {
  const [items, setItems] = useState<string[]>(() => readShortlist())

  useEffect(() => {
    const sync = () => setItems(readShortlist())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const has = useCallback((slug: string) => items.includes(slug), [items])

  const add = useCallback((slug: string) => {
    const current = readShortlist()
    if (current.includes(slug)) return
    const next = [...current, slug]
    writeShortlist(next)
    setItems(next)
    window.dispatchEvent(new Event(SHORTLIST_CATCH_EVENT))
  }, [])

  const remove = useCallback((slug: string) => {
    const next = readShortlist().filter((item) => item !== slug)
    writeShortlist(next)
    setItems(next)
  }, [])

  const toggle = useCallback(
    (slug: string) => {
      if (readShortlist().includes(slug)) remove(slug)
      else add(slug)
    },
    [add, remove],
  )

  return { items, has, add, remove, toggle }
}

/** The pile element id, so the list can fly posters into it. */
export const PILE_ID = 'shortlist-pile'

/** Where a caught poster should fly to: the pile, or the corner it will appear in. */
export function pileTargetRect(): DOMRect {
  const pile = document.getElementById(PILE_ID)
  if (pile) return (pile.querySelector('.shortlist-pile__stack') ?? pile).getBoundingClientRect()
  const size = 112
  return new DOMRect(window.innerWidth - 24 - size, window.innerHeight - 24 - size, size, size)
}

export const MOTION_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
export const MOTION_MS = 320

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** A poster copy that can be moved around the screen, then removed. */
export function makeFlyer(source: DOMRect, style: Record<string, string>): HTMLDivElement {
  const ghost = document.createElement('div')
  ghost.className = 'shortlist-flyer'
  ghost.setAttribute('aria-hidden', 'true')
  Object.assign(ghost.style, {
    left: `${source.left}px`,
    top: `${source.top}px`,
    width: `${source.width}px`,
    height: `${source.height}px`,
  })
  for (const [key, value] of Object.entries(style)) ghost.style.setProperty(key, value)
  document.body.appendChild(ghost)
  return ghost
}

export interface FlightOptions {
  /** How high above the straight line the poster arcs, in px. 0 = straight. */
  arc?: number
  /** Degrees of spin over the flight. */
  spin?: number
  duration?: number
  easing?: string
}

/**
 * Move an existing flyer from where it is (`source`) to `target`, scaling to
 * fit, and remove it when it lands. Resolves when the flight ends.
 */
export function flyFlyer(
  ghost: HTMLElement,
  source: DOMRect,
  target: DOMRect,
  options: FlightOptions = {},
): Promise<void> {
  const { arc = 0, spin = 0, duration = MOTION_MS, easing = MOTION_EASE } = options
  const scale = Math.min(target.width / source.width, target.height / source.height)
  const dx = target.left + target.width / 2 - (source.left + source.width / 2)
  const dy = target.top + target.height / 2 - (source.top + source.height / 2)
  const reduced = prefersReducedMotion()
  const keyframes: Keyframe[] = reduced
    ? [{ opacity: 1 }, { opacity: 0 }]
    : arc > 0
      ? [
          { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1, offset: 0 },
          {
            transform: `translate(${dx * 0.5}px, ${dy * 0.5 - arc}px) scale(${(1 + scale) / 2}) rotate(${spin / 2}deg)`,
            opacity: 1,
            offset: 0.5,
          },
          { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(${spin}deg)`, opacity: 0.9, offset: 1 },
        ]
      : [
          { transform: 'translate(0, 0) scale(1)', opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0.9 },
        ]
  const animation = ghost.animate(keyframes, {
    duration: reduced ? 160 : duration,
    easing: arc > 0 && !reduced ? 'cubic-bezier(0.3, 0, 0.7, 1)' : easing,
    fill: 'forwards',
  })
  return animation.finished.then(
    () => ghost.remove(),
    () => ghost.remove(),
  )
}

/**
 * Fly a copy of `source` to `target`, then remove it. Used when catching a
 * club from the list. Resolves when the flight ends.
 */
export function flyPoster(
  source: DOMRect,
  target: DOMRect,
  style: Record<string, string>,
  options?: FlightOptions,
): Promise<void> {
  return flyFlyer(makeFlyer(source, style), source, target, options)
}
