import test from 'node:test'
import assert from 'node:assert/strict'
import { openProgress, openMetrics } from '../src/clubs/window-open.ts'

test('a window opens as its title bar rises from the bottom of the screen to the middle', () => {
  assert.equal(openProgress(990, 1000), 0) // still below the start line
  assert.equal(openProgress(920, 1000), 0) // exactly on it
  assert.ok(openProgress(900, 1000) > 0) // just over it: starting to open
  assert.equal(openProgress(500, 1000), 1) // fully open at the middle
  assert.equal(openProgress(24, 1000), 1) // and anywhere above it
  const half = openProgress(710, 1000) // halfway between 920 and 500
  assert.ok(half > 0.45 && half < 0.55, String(half))
  assert.ok(openProgress(800, 1000) < openProgress(700, 1000))
})

test('the last window on a page finishes opening by the time the page runs out of scroll', () => {
  // It can only ever get as high as 700px from the top: fully open there.
  assert.equal(openProgress(700, 1000, 700), 1)
  assert.ok(openProgress(800, 1000, 700) > 0)
  // A window that can't move at all is simply open.
  assert.equal(openProgress(950, 1000, 950), 1)
})

test('height plus bottom margin always add up to the full height', () => {
  for (const p of [0, 0.25, 0.5, 0.8, 1]) {
    const { height, gap } = openMetrics(38, 437, p)
    assert.equal(height + gap, 437)
  }
  assert.deepEqual(openMetrics(38, 437, 0), { height: 38, gap: 399 })
  assert.deepEqual(openMetrics(38, 437, 1), { height: 437, gap: 0 })
})
