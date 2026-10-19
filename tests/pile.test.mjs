import test from 'node:test'
import assert from 'node:assert/strict'
import { returnTransform } from '../src/shortlist/pile-motion.ts'

test('return animation centres a tall card inside the actual stack', () => {
  const card = { left: 100, top: 100, width: 200, height: 400 }
  const stack = { left: 900, top: 600, width: 112, height: 112 }
  assert.equal(returnTransform(card, stack), 'translate(756px, 356px) scale(0.28)')
})
test('return animation fits a wide card without exceeding stack width', () => {
  assert.equal(returnTransform({ left: 0, top: 0, width: 400, height: 200 }, { left: 0, top: 0, width: 112, height: 112 }), 'translate(-144px, -44px) scale(0.28)')
})
