/**
 * Scroll-linked opening of a desk window: as the window's title bar rises
 * from the bottom of the screen, the window grows from just the bar to its
 * full height, the way the calendar grows next to the chat. Reversible,
 * like the calendar: scroll back and it closes again.
 */

/** The title bar starts opening when it rises past this fraction of the viewport ... */
const OPEN_FROM = 0.92
/** ... and the window is fully open once its top reaches this fraction. */
const OPEN_BY = 0.5

/**
 * 0 = just the title bar, 1 = full height.
 * `top`: the window's top in viewport coordinates.
 * `lowestTop`: the smallest `top` the page can ever scroll this window to
 * (the last window on a page can't reach the middle of the screen, so it
 * must finish opening by the time the page runs out of scroll).
 */
export function openProgress(top: number, viewportHeight: number, lowestTop = -Infinity): number {
  const start = viewportHeight * OPEN_FROM
  if (lowestTop >= start - 40) return 1 // can't travel: never leave it shut
  const end = Math.max(viewportHeight * OPEN_BY, Math.min(lowestTop, start - 40))
  const t = Math.max(0, Math.min(1, (start - top) / (start - end)))
  return t * t * (3 - 2 * t)
}

/** Height and bottom margin that keep the window's footprint constant while it grows. */
export function openMetrics(barHeight: number, fullHeight: number, progress: number) {
  const height = Math.round(barHeight + (fullHeight - barHeight) * progress)
  return { height, gap: Math.max(0, fullHeight - height) }
}
