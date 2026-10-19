import test from 'node:test'
import assert from 'node:assert/strict'
import { eventGroup } from '../src/clubs/events.ts'

test('NZ Monday to Sunday includes an event spanning into this week', () => {
  assert.equal(eventGroup({ date: '2026-10-11', endDate: '2026-10-14' }, '2026-10-13'), 'this week')
  assert.equal(eventGroup({ date: '2026-10-18' }, '2026-10-13'), 'this week')
  assert.equal(eventGroup({ date: '2026-10-19' }, '2026-10-13'), 'upcoming')
})
test('past and approximate dates never appear as upcoming dated events', () => {
  assert.equal(eventGroup({ date: '2026-10-10', endDate: '2026-10-11' }, '2026-10-13'), 'past events')
  assert.equal(eventGroup({ when: 'early trimester 1' }, '2026-10-13'), 'dates to confirm')
  assert.equal(eventGroup({ weekday: 4, when: 'during teaching weeks' }, '2026-10-13'), 'regular sessions')
  assert.equal(eventGroup({ date: '2026-02-30' }, '2026-10-13'), 'dates to confirm')
})
test('week calculations cross year boundaries', () => {
  assert.equal(eventGroup({ date: '2027-01-01' }, '2026-12-30'), 'this week')
  assert.equal(eventGroup({ date: '2027-01-04' }, '2026-12-30'), 'upcoming')
})
