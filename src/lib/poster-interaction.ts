export type PosterInput = 'activate' | 'move' | 'leave' | 'outside' | 'escape'
export type PosterResult = 'lock' | 'open' | 'keep' | 'dismiss'

export function posterInteraction(locked: boolean, input: PosterInput): PosterResult {
  if (input === 'activate') return locked ? 'open' : 'lock'
  if (locked && (input === 'move' || input === 'leave')) return 'keep'
  return 'dismiss'
}
