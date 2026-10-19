import test from 'node:test'
import assert from 'node:assert/strict'
import { weekBlocks, clashes, weekRange, clock, laneBlocks, ASSUMED_MINUTES } from '../src/shortlist/week.ts'

const club = (slug, weekday, start, end) => ({ slug, name: slug, weekday, session: start ? { start, end } : undefined })

test('blocks come from sessions only, sorted by day then start; unknown ends are assumed', () => {
  const blocks = weekBlocks([club('late', 4, '19:45'), club('early', 4, '18:00', '20:00'), club('none', 7), club('tue', 2, '18:00')])
  assert.deepEqual(blocks.map((b) => [b.slug, b.weekday, b.start, b.end, b.endKnown]), [
    ['tue', 2, 1080, 1080 + ASSUMED_MINUTES, false],
    ['early', 4, 1080, 1200, true],
    ['late', 4, 1185, 1185 + ASSUMED_MINUTES, false],
  ])
})

test('a start inside another known session is a certain clash', () => {
  const found = clashes(weekBlocks([club('folk', 4, '18:00', '20:00'), club('pool', 4, '19:45')]))
  assert.equal(found.length, 1)
  assert.equal(found[0].certain, true)
})

test('two sessions touching only through an assumed end are a possible clash', () => {
  const found = clashes(weekBlocks([club('a', 3, '18:30'), club('b', 3, '19:00', '20:00')]))
  assert.equal(found.length, 1)
  assert.equal(found[0].certain, false)
})

test('different days or back-to-back times never clash', () => {
  assert.equal(clashes(weekBlocks([club('a', 2, '18:00'), club('b', 3, '18:00')])).length, 0)
  assert.equal(clashes(weekBlocks([club('a', 4, '18:00', '19:00'), club('b', 4, '19:00', '20:00')])).length, 0)
})

test('the drawn range hugs the sessions with an hour of air, inside 8am–11pm', () => {
  assert.deepEqual(weekRange(weekBlocks([club('a', 4, '18:00', '20:00'), club('b', 4, '19:45')])), { from: 17 * 60, to: 22 * 60 })
  assert.deepEqual(weekRange(weekBlocks([club('a', 1, '08:15', '09:00')])), { from: 8 * 60, to: 10 * 60 })
  assert.deepEqual(weekRange(weekBlocks([club('a', 1, '22:30')])), { from: 21 * 60, to: 23 * 60 })
  assert.deepEqual(weekRange([]), { from: 17 * 60, to: 21 * 60 })
})

test('overlapping blocks share a day side by side; lone blocks take the column', () => {
  const lanes = laneBlocks(
    weekBlocks([club('folk', 4, '18:00', '20:00'), club('pool', 4, '19:45'), club('late', 4, '21:00'), club('tue', 2, '18:00')]),
  )
  assert.deepEqual(lanes.get('folk'), { lane: 0, lanes: 2 })
  assert.deepEqual(lanes.get('pool'), { lane: 1, lanes: 2 })
  assert.deepEqual(lanes.get('late'), { lane: 0, lanes: 1 })
  assert.deepEqual(lanes.get('tue'), { lane: 0, lanes: 1 })
})

test('clock formatting', () => {
  assert.equal(clock(18 * 60), '6pm')
  assert.equal(clock(19 * 60 + 45), '7:45pm')
  assert.equal(clock(12 * 60), '12pm')
  assert.equal(clock(9 * 60 + 5), '9:05am')
})
