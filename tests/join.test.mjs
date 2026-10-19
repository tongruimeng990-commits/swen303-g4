import test from 'node:test'
import assert from 'node:assert/strict'
import { emailOk, sentLine, STARTER_QUESTIONS, studentIdOk, validateAsk, validateSignup } from '../src/clubs/join.ts'

test('sign up needs a name, a numeric student ID and an email', () => {
  const errors = validateSignup({ name: '', studentId: '', email: '', note: '' })
  assert.deepEqual(Object.keys(errors), ['name', 'studentId', 'email'])

  assert.deepEqual(validateSignup({ name: 'Iris', studentId: '300123456', email: 'iris@myvuw.ac.nz', note: '' }), {})
  assert.deepEqual(validateSignup({ name: 'Iris', studentId: ' 300123456 ', email: 'iris@myvuw.ac.nz', note: 'beginner' }), {})
})

test('student ID is numbers only, 6–10 digits; the error says so', () => {
  assert.equal(studentIdOk('300123456'), true)
  assert.equal(studentIdOk('123456'), true)
  assert.equal(studentIdOk('12345'), false)
  assert.equal(studentIdOk('abc123456'), false)
  const { studentId } = validateSignup({ name: 'Iris', studentId: '3001-2345', email: 'iris@myvuw.ac.nz', note: '' })
  assert.match(studentId, /numbers/i)
})

test('email is checked loosely but catches the usual slips', () => {
  assert.equal(emailOk('iris@myvuw.ac.nz'), true)
  assert.equal(emailOk('iris@myvuw'), false)
  assert.equal(emailOk('iris myvuw.ac.nz'), false)
  assert.equal(emailOk(''), false)
})

test('asking a question needs the question; the reply email is optional but must be valid if given', () => {
  assert.deepEqual(Object.keys(validateAsk({ email: '', question: '' })), ['question'])
  assert.deepEqual(validateAsk({ email: '', question: 'do I need any experience?' }), {})
  assert.deepEqual(Object.keys(validateAsk({ email: 'nope', question: 'what does it cost?' })), ['email'])
  assert.deepEqual(validateAsk({ email: 'iris@myvuw.ac.nz', question: 'is it ok to come alone?' }), {})
})

test('starter questions are the ones first-timers actually ask, and are valid as-is', () => {
  assert.equal(STARTER_QUESTIONS.length, 3)
  for (const question of STARTER_QUESTIONS) {
    assert.deepEqual(validateAsk({ email: '', question }), {})
  }
})

test('the sent line tells you when to turn up, so the form never dead-ends', () => {
  const line = sentLine({ name: 'Vic Debsoc', meets: { line: 'Wednesdays 6pm', room: 'MY 301' } })
  assert.match(line, /^Vic Debsoc usually replies/)
  assert.match(line, /Wednesdays 6pm, MY 301/)
  assert.match(line, /just turn up/)
})
