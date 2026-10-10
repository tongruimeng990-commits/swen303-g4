/**
 * Where the golem is allowed to stand. The white page is read as a set of
 * horizontal "ground" segments — the divider lines between club rows
 * continued into the margins either side of the reading column, and the
 * open floor under the last row — minus every span where standing would
 * cover the column itself, the floating poster or the pile. Everything is
 * measured from the live DOM in viewport coordinates, so callers re-measure
 * after scrolling or when the list changes.
 */

export interface Segment {
  /** viewport y of the line the feet stand on */
  y: number
  x1: number
  x2: number
}

export interface Ground {
  segments: Segment[]
  /** rectangles the character must never overlap */
  noGo: DOMRect[]
  /** the reading column the margins are either side of, when the list is there */
  column: DOMRect | null
}

/**
 * Only the segments left of the column, plus the open floor under it clipped
 * to its left part — the side of the page with the most empty space.
 */
export function leftSide(ground: Ground): Ground {
  const column = ground.column
  if (!column) return ground
  const floorRight = column.left + Math.min(200, column.width / 2)
  const segments: Segment[] = []
  for (const s of ground.segments) {
    if (s.x2 <= column.left + 1) segments.push(s)
    else if (s.y > column.bottom) {
      const x2 = Math.min(s.x2, floorRight)
      if (x2 - s.x1 >= FOOTPRINT) segments.push({ ...s, x2 })
    }
  }
  return { ...ground, segments }
}

/** Width the character needs on a segment. */
export const FOOTPRINT = 40
/** How tall the standing character is, for overlap checks. */
export const STAND_HEIGHT = 48
const PAD = 12
const FLOOR_STEP = 64

const rectsOf = (root: ParentNode, selector: string) =>
  Array.from(root.querySelectorAll<HTMLElement>(selector))
    .map((el) => el.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0)

const unionOf = (rects: DOMRect[]): DOMRect | null => {
  if (rects.length === 0) return null
  const left = Math.min(...rects.map((r) => r.left))
  const top = Math.min(...rects.map((r) => r.top))
  const right = Math.max(...rects.map((r) => r.right))
  const bottom = Math.max(...rects.map((r) => r.bottom))
  return new DOMRect(left, top, right - left, bottom - top)
}

/** Is the viewport point inside one of the no-go rectangles? */
export const inNoGo = (ground: Ground, p: { x: number; y: number }) =>
  ground.noGo.some((r) => p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom)

/** Subtract `blocked` x-spans from [x1, x2]; keep pieces wide enough to stand on. */
function carve(y: number, x1: number, x2: number, blocked: Array<[number, number]>): Segment[] {
  const sorted = [...blocked].sort((a, b) => a[0] - b[0])
  const out: Segment[] = []
  let cursor = x1
  for (const [b1, b2] of sorted) {
    if (b2 <= cursor) continue
    if (b1 > cursor) out.push({ y, x1: cursor, x2: Math.min(b1, x2) })
    cursor = Math.max(cursor, b2)
    if (cursor >= x2) break
  }
  if (cursor < x2) out.push({ y, x1: cursor, x2 })
  return out.filter((s) => s.x2 - s.x1 >= FOOTPRINT)
}

/** X-spans of no-go rects that a character standing on line `y` would overlap. */
function blockedBy(noGo: DOMRect[], y: number): Array<[number, number]> {
  const top = y - STAND_HEIGHT
  return noGo
    .filter((r) => r.bottom > top && r.top < y)
    .map((r) => [r.left - PAD, r.right + PAD] as [number, number])
}

export function measureGround(): Ground {
  const clubs = document.getElementById('clubs')
  if (!clubs) return { segments: [], noGo: [], column: null }
  const sheet = clubs.getBoundingClientRect()
  const left = sheet.left + 6
  const right = sheet.right - 6
  const vh = window.innerHeight

  // The reading column — heading, filter bar and every row — is one no-go
  // block: he lives in the margins beside it and on the floor below it, never
  // in the gaps between a blurb and its time, where he would sit in the eye line.
  const column = unionOf(rectsOf(clubs, '.club-list__head, .club-filters, .club-list__empty, .club-list__rows'))
  const noGo: DOMRect[] = [
    ...(column ? [column] : []),
    ...rectsOf(document, '.club-preview[data-visible], #shortlist-pile, .shortlist-stage'),
  ]

  const segments: Segment[] = []
  const lines: number[] = []

  // header: the lines under the heading and the lead
  for (const el of clubs.querySelectorAll<HTMLElement>('.club-list__head h2, .club-list__lead')) {
    lines.push(el.getBoundingClientRect().bottom)
  }
  // each row's divider
  const rows = Array.from(clubs.querySelectorAll<HTMLElement>('.club-row'))
  for (const row of rows) lines.push(row.getBoundingClientRect().bottom)
  // the floor under the last row, down to the bottom of the sheet or the viewport
  const lastLine = rows.length ? rows[rows.length - 1].getBoundingClientRect().bottom : sheet.top + 120
  const floorEnd = Math.min(sheet.bottom - 24, vh + STAND_HEIGHT)
  for (let y = lastLine + FLOOR_STEP; y <= floorEnd; y += FLOOR_STEP) lines.push(y)

  for (const y of lines) {
    // only lines whose standing character would be at least partly on screen
    if (y < 0 || y - STAND_HEIGHT > vh) continue
    segments.push(...carve(y, left, right, blockedBy(noGo, y)))
  }
  return { segments, noGo, column }
}

export interface GroundTarget {
  x: number
  y: number
  segment: Segment
}

/**
 * The nearest standing point to `ideal`. When `avoid` is given (the cursor),
 * the point keeps `avoid.distance` px away from it horizontally on lines
 * near the cursor, so the character never stands under the pointer.
 */
export function nearestGroundPoint(
  ground: Ground,
  ideal: { x: number; y: number },
  avoid?: { x: number; y: number; distance: number },
): GroundTarget | null {
  let best: GroundTarget | null = null
  let bestCost = Infinity
  for (const segment of ground.segments) {
    const lo = segment.x1 + FOOTPRINT / 2
    const hi = segment.x2 - FOOTPRINT / 2
    let x = Math.min(Math.max(ideal.x, lo), hi)
    if (avoid && Math.abs(segment.y - avoid.y) < STAND_HEIGHT + 24 && Math.abs(x - avoid.x) < avoid.distance) {
      const rightX = avoid.x + avoid.distance
      const leftX = avoid.x - avoid.distance
      const canRight = rightX <= hi
      const canLeft = leftX >= lo
      if (canRight && (!canLeft || ideal.x >= avoid.x)) x = rightX
      else if (canLeft) x = leftX
      else continue
    }
    const dx = x - ideal.x
    const dy = segment.y - ideal.y
    // standing a little below the cursor reads as "beside", above as "in the way"
    const cost = dx * dx + dy * dy * (dy < 0 ? 1.6 : 1)
    if (cost < bestCost) {
      bestCost = cost
      best = { x, y: segment.y, segment }
    }
  }
  return best
}

/** The highest line on screen, nearest `x`: where the golem waits for a cursor on the hero. */
export function topGroundPoint(ground: Ground, x: number): GroundTarget | null {
  if (ground.segments.length === 0) return null
  const topY = Math.min(...ground.segments.map((s) => s.y))
  const onTop = ground.segments.filter((s) => Math.abs(s.y - topY) < 1)
  return nearestGroundPoint({ ...ground, segments: onTop }, { x, y: topY })
}

/** The club row under viewport y, when there is one. */
export function rowRectAt(y: number): DOMRect | null {
  for (const row of document.querySelectorAll<HTMLElement>('.club-row')) {
    const r = row.getBoundingClientRect()
    if (y >= r.top && y < r.bottom) return r
  }
  return null
}

/** Index of the club row under viewport y, −1 when none. */
export function rowIndexAt(y: number): number {
  const rows = document.querySelectorAll<HTMLElement>('.club-row')
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i].getBoundingClientRect()
    if (y >= r.top && y < r.bottom) return i
  }
  return -1
}
