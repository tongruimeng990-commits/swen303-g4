import test from 'node:test'
import assert from 'node:assert/strict'
import { posterInteraction } from '../src/lib/poster-interaction.ts'

test('first activation locks the preview; only the second opens the club', () => {
  assert.equal(posterInteraction(false, 'activate'), 'lock')
  assert.equal(posterInteraction(true, 'activate'), 'open')
})
test('a locked poster survives pointer movement and leaving the hero', () => {
  assert.equal(posterInteraction(true, 'move'), 'keep')
  assert.equal(posterInteraction(true, 'leave'), 'keep')
  assert.equal(posterInteraction(false, 'move'), 'dismiss')
})
test('outside click or escape releases a locked poster', () => {
  assert.equal(posterInteraction(true, 'outside'), 'dismiss')
  assert.equal(posterInteraction(true, 'escape'), 'dismiss')
})
