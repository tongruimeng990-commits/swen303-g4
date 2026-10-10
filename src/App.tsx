import { EditorialPage } from './EditorialPage'
import { ClubDesktopPage } from './clubs/ClubDesktopPage'
import { vicfolkDesktop } from './content/vicfolk'
import { vuwtcDesktop } from './content/vuwtc'
import { vuccDesktop } from './content/vucc'
import { debsocDesktop } from './content/debsoc'
import { taikoDesktop } from './content/taiko'
import { vicukeDesktop } from './content/vicuke'
import type { ClubDesktopContent } from './content/types'

const clubs: Record<string, ClubDesktopContent> = Object.fromEntries(
  [vicfolkDesktop, vuwtcDesktop, vuccDesktop, debsocDesktop, taikoDesktop, vicukeDesktop].map((club) => [club.slug, club]),
)

export default function App() {
  const match = window.location.pathname.match(/^\/editorial\/([^/]+)\/?$/)
  const slug = match?.[1]
  if (slug && clubs[slug]) return <ClubDesktopPage club={clubs[slug]} />
  return <EditorialPage />
}
