import test from 'node:test'
import assert from 'node:assert/strict'
import { parseQuery } from '../src/lib/search.ts'

const THU = 4

test('plain words stay text', () => {
  assert.deepEqual(parseQuery('debate', THU), { query: 'debate', days: [], slots: [] })
  assert.deepEqual(parseQuery('  Folk  Music ', THU), { query: 'folk music', days: [], slots: [] })
})

test('weekday words become a day filter, in any spelling', () => {
  assert.deepEqual(parseQuery('thursday', THU).days, [4])
  assert.deepEqual(parseQuery('Thu', THU).days, [4])
  assert.deepEqual(parseQuery('tues or weds', THU).days, [2, 3])
  assert.equal(parseQuery('thursday', THU).query, '')
})

test('time-of-day words become a slot filter', () => {
  assert.deepEqual(parseQuery('weekend', THU).slots, ['weekend'])
  assert.deepEqual(parseQuery('evenings', THU).slots, ['evening'])
  assert.deepEqual(parseQuery('tonight', THU), { query: '', days: [4], slots: ['evening'] })
  assert.deepEqual(parseQuery('tomorrow', 7).days, [1])
})

test('mixed queries split into text and time', () => {
  assert.deepEqual(parseQuery('folk on thursday', THU), { query: 'folk', days: [4], slots: [] })
  assert.deepEqual(parseQuery('kayak club weekend', THU), { query: 'kayak', days: [], slots: ['weekend'] })
})

test('filler never becomes a text match', () => {
  assert.equal(parseQuery('a club', THU).query, '')
  assert.equal(parseQuery('', THU).query, '')
})
