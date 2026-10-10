import { createContext, useContext, useMemo, useRef, type MutableRefObject } from 'react'
import { flyPoster } from '../lib/shortlist'

/**
 * The golem is a small 3D companion on the clubs page. This module is the
 * seam between React UI (the club list, the pile) and the imperative
 * character: UI asks for scenes through a controller; the character, when
 * mounted and able, performs them. When it is not there, every request
 * falls back to the plain behaviour the page had before.
 */

export interface GolemScene {
  /** Where the poster is on screen right now (floating preview or row thumb). */
  from: DOMRect
  /**
   * Which of the two it is. The list picks whichever is nearer to him: the
   * row's thumbnail when he is in the left margin, the big preview when he
   * is on the right. The preview is the real photo (hidden while he has it);
   * the thumb is a copy.
   */
  source: 'preview' | 'thumb'
  /** Where the poster should end up (the pile). */
  to: DOMRect
  /** CSS custom properties that paint the poster (from `posterVars`). */
  style: Record<string, string>
}

/** Implemented by the mounted character. */
export interface GolemPerformer {
  /** Run to the poster, grab it, get it to `to` one way or another. Resolves when it lands. */
  catchPoster(scene: GolemScene): Promise<void>
  /**
   * Toss `ghost` (a fixed-position copy already laid out at `to`) from the
   * character's hands so it lands in place. Resolves when it lands; the
   * caller removes the ghost and reveals the real thing.
   */
  throwTools(ghost: HTMLElement, to: DOMRect): Promise<void>
}

export interface GolemHandle {
  performer: GolemPerformer | null
  /** Scenes waiting for the performer; beyond this many we stop queueing. */
  pending: number
  /** Where his feet are right now (viewport px), when he is on the page. */
  where: (() => { x: number; y: number }) | null
}

const MAX_QUEUE = 3

const GolemContext = createContext<MutableRefObject<GolemHandle> | null>(null)
export const GolemProvider = GolemContext.Provider

export function useGolemHandle(): MutableRefObject<GolemHandle> {
  return useRef<GolemHandle>({ performer: null, pending: 0, where: null })
}

/** Dispatched on `window` when a kicked poster reaches the pile. */
export const PILE_HIT_EVENT = 'vuwclubs:pile-hit'

export function announcePileHit() {
  window.dispatchEvent(new Event(PILE_HIT_EVENT))
}

/** The golem's chat asking the list to filter by weekday: `detail = { day: 1–7 }`. */
export const FILTER_EVENT = 'vuwclubs:filter'
/** The golem's chat asking the list to catch a club: `detail = { slug }`. */
export const CATCH_EVENT = 'vuwclubs:catch'

export function requestFilterDay(day: number) {
  window.dispatchEvent(new CustomEvent(FILTER_EVENT, { detail: { day } }))
}

export function requestCatch(slug: string) {
  window.dispatchEvent(new CustomEvent(CATCH_EVENT, { detail: { slug } }))
}

/** The list telling the golem the pointer has settled on a row: `detail = { slug | null }`. */
export const HOVER_EVENT = 'vuwclubs:hover'

export function announceHover(slug: string | null) {
  window.dispatchEvent(new CustomEvent(HOVER_EVENT, { detail: { slug } }))
}

/**
 * What the club list uses: `catchPoster` plays the golem scene when the
 * character is present and not swamped, otherwise the old straight flight.
 */
export function useGolem() {
  const handle = useContext(GolemContext)

  return useMemo(
    () => ({
      catchPoster: async (scene: GolemScene) => {
        const current = handle?.current
        if (current?.performer && current.pending < MAX_QUEUE) {
          current.pending += 1
          try {
            await current.performer.catchPoster(scene)
          } finally {
            current.pending -= 1
          }
          return
        }
        await flyPoster(scene.from, scene.to, scene.style)
        announcePileHit()
      },
      /** His feet, or null when he is not on the page. */
      where: () => handle?.current.where?.() ?? null,
    }),
    [handle],
  )
}
