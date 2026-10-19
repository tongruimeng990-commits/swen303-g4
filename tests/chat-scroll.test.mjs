import test from 'node:test'
import assert from 'node:assert/strict'
import { conversationProgress, messageOpen, calendarHeight, revealStart, followProgress } from '../src/clubs/chat-scroll.ts'

test('unfold progress follows distance in both scroll directions and clamps at the ends', () => {
  assert.equal(conversationProgress(200, 80, 600), 0)
  assert.equal(conversationProgress(-220, 80, 600), 0.5)
  assert.equal(conversationProgress(-520, 80, 600), 1)
  assert.equal(conversationProgress(-1000, 80, 600), 1)
  assert.equal(conversationProgress(-70, 80, 600), 0.25)
})

test('unfold starts while both windows are around the middle of the screen', () => {
  const start = revealStart(800, 80)
  assert.ok(conversationProgress(400, start, 800) > 0)
  assert.equal(conversationProgress(700, start, 800), 0)
  assert.equal(revealStart(100, 80), 80)
})

test('scroll following smooths wheel steps without overshooting or continuing indefinitely', () => {
  let progress = followProgress(0, 1, 16)
  assert.ok(progress > 0 && progress < 0.3)
  for (let i = 0; i < 40; i++) progress = followProgress(progress, 1, 16)
  assert.ok(progress > 0.99 && progress <= 1)
  assert.ok(followProgress(1, 0, 16) > 0.7)
})

test('calendar starts compact and grows with the same bounded scroll progress', () => {
  assert.equal(calendarHeight(0, 260, 1000), 260)
  assert.equal(calendarHeight(0.5, 260, 1000), 630)
  assert.equal(calendarHeight(1, 260, 1000), 1000)
  assert.equal(calendarHeight(2, 260, 1000), 1000)
  assert.equal(calendarHeight(0, 260, 180), 180)
})
test('first quote remains open while later quotes unfold in sequence', () => {
  assert.equal(messageOpen(0, 0, 5), 1)
  assert.equal(messageOpen(0, 1, 5), 0)
  assert.ok(messageOpen(0.125, 1, 5) > 0.35 && messageOpen(0.125, 1, 5) < 0.55)
  assert.equal(messageOpen(0.125, 2, 5), 0)
  assert.equal(messageOpen(1, 4, 5), 1)
  assert.equal(conversationProgress(0, 80, 0), 1)
})

test('the next message starts before the previous one stops expanding', () => {
  assert.ok(messageOpen(0.26, 1, 5) < 1)
  assert.ok(messageOpen(0.26, 2, 5) > 0)
  assert.equal(messageOpen(0, 1, 5), 0)
  assert.equal(messageOpen(1, 4, 5), 1)
})
