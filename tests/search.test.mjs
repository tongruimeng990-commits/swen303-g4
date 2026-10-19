import test from 'node:test'
import assert from 'node:assert/strict'
import { aliasHit, applyClubFilter, clubsByTone, clubsByWeek, EMPTY_FILTER } from '../src/content/clubs.ts'

const names = (items) => items.map(({ club }) => club.name)

test('search finds clubs by what people call them, not only the name', () => {
  const all = clubsByWeek()
  assert.deepEqual(names(applyClubFilter(all, { ...EMPTY_FILTER, query: 'debate' }).matched), ['Vic Debsoc'])
  assert.deepEqual(names(applyClubFilter(all, { ...EMPTY_FILTER, query: 'debating society' }).matched), ['Vic Debsoc'])
  assert.deepEqual(names(applyClubFilter(all, { ...EMPTY_FILTER, query: 'kayak' }).matched), ['VUCC'])
  assert.deepEqual(names(applyClubFilter(all, { ...EMPTY_FILTER, query: 'drum' }).matched), ['Mukume Taiko'])
  assert.deepEqual(names(applyClubFilter(all, { ...EMPTY_FILTER, query: 'tramping club' }).matched), ['VUWTC'])
})

test('the row can say which alias matched, and stays quiet when the name did', () => {
  const debsoc = clubsByTone.find((club) => club.slug === 'debsoc')
  assert.equal(aliasHit(debsoc, 'debate'), 'debate')
  assert.equal(aliasHit(debsoc, 'Debsoc'), null)
  assert.equal(aliasHit(debsoc, ''), null)
})

test('every club has lower-case aliases and none collide with another club', () => {
  const seen = new Map()
  for (const club of clubsByTone) {
    assert.ok(club.aliases.length >= 3, club.slug)
    for (const alias of club.aliases) {
      assert.equal(alias, alias.toLowerCase(), `${club.slug}: ${alias}`)
      assert.ok(!seen.has(alias) || seen.get(alias) === club.slug, `alias "${alias}" used by ${seen.get(alias)} and ${club.slug}`)
      seen.set(alias, club.slug)
    }
  }
})
