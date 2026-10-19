import test from 'node:test'
import assert from 'node:assert/strict'
import { mailDraftUrl } from '../src/clubs/mail.ts'

test('email subject and multiline body survive special characters', () => {
  const subject = "hi, I'd like to come along & ask a question"
  const body = 'Kia ora!\nCan I bring A&B? #first visit\nThanks, Mei'
  const url = new URL(mailDraftUrl('club@example.com', subject, body))
  assert.equal(url.protocol, 'mailto:')
  assert.equal(url.pathname, 'club@example.com')
  assert.equal(url.searchParams.get('subject'), subject)
  assert.equal(url.searchParams.get('body'), body)
  assert.equal(url.searchParams.has('from'), false)
})
