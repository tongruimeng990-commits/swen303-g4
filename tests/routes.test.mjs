import test from 'node:test'
import assert from 'node:assert/strict'
import { clubListUrl, isClubListPath } from '../src/lib/routes.ts'

test('the club list has a directly accessible route with an optional trailing slash', () => {
  assert.equal(isClubListPath('/clubs'), true)
  assert.equal(isClubListPath('/clubs/'), true)
  assert.equal(isClubListPath('/'), false)
  assert.equal(isClubListPath('/editorial/vicfolk'), false)
})

test('homepage searches carry the complete query to the separate list page', () => {
  assert.equal(clubListUrl(''), '/clubs')
  assert.equal(clubListUrl('   '), '/clubs')
  const query = 'folk thursday & music #1'
  const url = new URL(clubListUrl(query), 'http://localhost')
  assert.equal(url.pathname, '/clubs')
  assert.equal(url.searchParams.get('q'), query)
})
