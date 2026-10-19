/**
 * Every club page's content in one place, so the router and the homepage
 * "what's on" block read the same events.
 */
import { vicfolkDesktop } from './vicfolk'
import { vuwtcDesktop } from './vuwtc'
import { vuccDesktop } from './vucc'
import { debsocDesktop } from './debsoc'
import { taikoDesktop } from './taiko'
import { vicukeDesktop } from './vicuke'
import type { ClubDesktopContent } from './types'

export const clubDesktops: ClubDesktopContent[] = [
  vicfolkDesktop,
  vuwtcDesktop,
  vuccDesktop,
  debsocDesktop,
  taikoDesktop,
  vicukeDesktop,
]

export const desktopBySlug: Record<string, ClubDesktopContent> = Object.fromEntries(
  clubDesktops.map((club) => [club.slug, club]),
)
