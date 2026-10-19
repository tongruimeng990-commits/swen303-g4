import test from 'node:test'
import assert from 'node:assert/strict'
import { vicfolkDesktop } from '../src/content/vicfolk.ts'
import { vuwtcDesktop } from '../src/content/vuwtc.ts'
import { vuccDesktop } from '../src/content/vucc.ts'
import { debsocDesktop } from '../src/content/debsoc.ts'
import { taikoDesktop } from '../src/content/taiko.ts'
import { vicukeDesktop } from '../src/content/vicuke.ts'

test('all six clubs provide the migrated content without legacy duplicated fields', () => {
  for (const club of [vicfolkDesktop, vuwtcDesktop, vuccDesktop, debsocDesktop, taikoDesktop, vicukeDesktop]) {
    assert.equal(club.tags.length, 3, club.slug)
    assert.ok(club.intro && club.letter.body && club.contact.email, club.slug)
    assert.ok(club.events.length && club.goodToKnow.length, club.slug)
    assert.equal('thisWeek' in club || 'firstTime' in club || 'comingUp' in club, false, club.slug)
  }
})
test('first-time.note stays short: three or four essentials, each a line or two', () => {
  for (const club of [vicfolkDesktop, vuwtcDesktop, vuccDesktop, debsocDesktop, taikoDesktop, vicukeDesktop]) {
    assert.ok(club.essentials.length >= 3 && club.essentials.length <= 4, club.slug)
    for (const point of club.essentials) assert.ok(point.length <= 110, `${club.slug}: ${point}`)
    assert.ok(club.essentials.length + club.bring.yes.length + club.bring.no.length <= 5, club.slug)
  }
})
test('migration retains practical attendance instructions', () => {
  assert.match(vicfolkDesktop.goodToKnow.join(' '), /6:10/)
  assert.match(vuwtcDesktop.goodToKnow.join(' '), /flat is announced at the meeting/)
  assert.match(vuccDesktop.goodToKnow.join(' '), /River trips depend on flow/)
  assert.match(vuccDesktop.goodToKnow.join(' '), /live river gauges/)
})
