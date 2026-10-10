import { useCallback, useEffect, useState } from 'react'

/**
 * "Pinned" clubs: the only piece of state the dark clubs page and the club
 * desktop pages share. Stored in localStorage, so it is per browser/device.
 */

const PINS_KEY = 'vuwclubs:pins'
const PINS_EVENT = 'vuwclubs:pins-change'

export function readPins(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(PINS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function writePins(slugs: string[]) {
  try {
    window.localStorage.setItem(PINS_KEY, JSON.stringify(slugs))
  } catch {
    // storage full or blocked: pins simply won't persist
  }
  window.dispatchEvent(new Event(PINS_EVENT))
}

export function usePins() {
  const [pins, setPins] = useState<string[]>(() => readPins())

  useEffect(() => {
    const sync = () => setPins(readPins())
    window.addEventListener(PINS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(PINS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const toggle = useCallback((slug: string) => {
    const current = readPins()
    const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]
    writePins(next)
    setPins(next)
  }, [])

  const isPinned = useCallback((slug: string) => pins.includes(slug), [pins])

  return { pins, isPinned, toggle }
}

/**
 * Where you left the dark page: which poster was settled and where. Lets the
 * clubs page put the same poster back when you come back from a club.
 */

const LAST_POSTER_KEY = 'vuwclubs:last-poster'

export interface RememberedPoster {
  slug: string
  /** viewport fractions, so the poster lands sensibly after a resize */
  fx: number
  fy: number
}

export function rememberPoster(poster: RememberedPoster) {
  try {
    window.sessionStorage.setItem(LAST_POSTER_KEY, JSON.stringify(poster))
  } catch {
    // ignore
  }
}

export function takeRememberedPoster(): RememberedPoster | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(LAST_POSTER_KEY)
    window.sessionStorage.removeItem(LAST_POSTER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<RememberedPoster>
    if (typeof parsed.slug !== 'string' || typeof parsed.fx !== 'number' || typeof parsed.fy !== 'number') return null
    return { slug: parsed.slug, fx: parsed.fx, fy: parsed.fy }
  } catch {
    return null
  }
}
