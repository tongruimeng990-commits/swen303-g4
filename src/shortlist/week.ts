/**
 * The week view in my clubs: saved clubs' regular sessions laid on a
 * Mon–Sun grid so clashes are visible. Pure functions; times are minutes
 * after midnight.
 */
import type { ClubSummary } from '../content/clubs'

/** How long a session is drawn when the club has not published an end. */
export const ASSUMED_MINUTES = 60

export interface WeekBlock {
  slug: string
  name: string
  /** 1 = Monday … 7 = Sunday */
  weekday: number
  start: number
  /** Real end, or start + ASSUMED_MINUTES when `endKnown` is false. */
  end: number
  endKnown: boolean
}

export interface Clash {
  a: WeekBlock
  b: WeekBlock
  /** True when the overlap does not rely on an assumed end. */
  certain: boolean
}

export const toMinutes = (clock: string) => {
  const [h, m] = clock.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** "6pm", "7:45pm", "12pm", "9am" */
export function clock(minutes: number) {
  const h24 = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  const suffix = h24 >= 12 ? 'pm' : 'am'
  const h = h24 % 12 === 0 ? 12 : h24 % 12
  return m ? `${h}:${String(m).padStart(2, '0')}${suffix}` : `${h}${suffix}`
}

export function weekBlocks(clubs: ClubSummary[]): WeekBlock[] {
  const blocks: WeekBlock[] = []
  for (const club of clubs) {
    if (!club.session) continue
    const start = toMinutes(club.session.start)
    const endKnown = club.session.end !== undefined
    blocks.push({
      slug: club.slug,
      name: club.name,
      weekday: club.weekday,
      start,
      end: endKnown ? toMinutes(club.session.end!) : start + ASSUMED_MINUTES,
      endKnown,
    })
  }
  return blocks.sort((a, b) => a.weekday - b.weekday || a.start - b.start)
}

const overlaps = (a: { start: number; end: number }, b: { start: number; end: number }) =>
  a.start < b.end && b.start < a.end

/** With unknown ends shrunk to a minute: does the overlap still hold? */
const firm = (block: WeekBlock) => ({ start: block.start, end: block.endKnown ? block.end : block.start + 1 })

export function clashes(blocks: WeekBlock[]): Clash[] {
  const found: Clash[] = []
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i]
      const b = blocks[j]
      if (a.weekday !== b.weekday || !overlaps(a, b)) continue
      found.push({ a, b, certain: overlaps(firm(a), firm(b)) })
    }
  }
  return found
}

export interface Lane {
  lane: number
  lanes: number
}

/**
 * Overlapping blocks on one day sit side by side instead of on top of each
 * other, so both names stay readable. Blocks that overlap nothing span the
 * whole column (lanes = 1).
 */
export function laneBlocks(blocks: WeekBlock[]): Map<string, Lane> {
  const result = new Map<string, Lane>()
  for (let day = 1; day <= 7; day++) {
    const dayBlocks = blocks.filter((block) => block.weekday === day).sort((a, b) => a.start - b.start)
    // Walk in start order; a cluster is a run of blocks chained by overlap.
    let cluster: WeekBlock[] = []
    let clusterEnd = -1
    const flush = () => {
      const laneEnds: number[] = []
      const lanes = new Map<string, number>()
      for (const block of cluster) {
        let lane = laneEnds.findIndex((end) => end <= block.start)
        if (lane === -1) lane = laneEnds.length
        laneEnds[lane] = block.end
        lanes.set(block.slug, lane)
      }
      for (const block of cluster) result.set(block.slug, { lane: lanes.get(block.slug)!, lanes: laneEnds.length })
      cluster = []
      clusterEnd = -1
    }
    for (const block of dayBlocks) {
      if (cluster.length && block.start >= clusterEnd) flush()
      cluster.push(block)
      clusterEnd = Math.max(clusterEnd, block.end)
    }
    if (cluster.length) flush()
  }
  return result
}

/** Whole hours to draw, with an hour of air either side, kept inside 8am–11pm. */
export function weekRange(blocks: WeekBlock[]): { from: number; to: number } {
  if (blocks.length === 0) return { from: 17 * 60, to: 21 * 60 }
  const first = Math.min(...blocks.map((block) => block.start))
  const last = Math.max(...blocks.map((block) => block.end))
  const from = Math.max(8 * 60, Math.floor(first / 60) * 60 - 60)
  const to = Math.min(23 * 60, Math.ceil(last / 60) * 60 + 60)
  return { from, to: Math.max(to, from + 120) }
}
