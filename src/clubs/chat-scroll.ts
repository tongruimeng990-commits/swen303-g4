export function conversationProgress(top: number, stickyTop: number, travel: number): number {
  if (travel <= 0) return 1
  return Math.max(0, Math.min(1, (stickyTop - top) / travel))
}

export function messageOpen(progress: number, index: number, count: number): number {
  if (index === 0 || count <= 1) return 1
  // Neighbouring messages overlap slightly so the thread grows continuously
  // instead of pausing at the boundary between each pair of quotes.
  const span = 1.2
  const open = Math.max(0, Math.min(1, (progress * (count - 2 + span) - (index - 1)) / span))
  return open * open * (3 - 2 * open)
}

export function calendarHeight(progress: number, preview: number, full: number): number {
  const initial = Math.min(preview, full)
  return initial + (full - initial) * Math.max(0, Math.min(1, progress))
}

export function revealStart(viewportHeight: number, stickyTop: number): number {
  return Math.max(stickyTop, viewportHeight * 0.6)
}

export function followProgress(current: number, target: number, elapsed: number): number {
  return current + (target - current) * (1 - Math.exp(-Math.max(0, elapsed) / 125))
}
