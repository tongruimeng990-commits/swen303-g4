import { EditorialPage } from './EditorialPage'
import { ClubDesktopPage } from './clubs/ClubDesktopPage'
import { desktopBySlug } from './content/desktops'
import { isClubListPath } from './lib/routes'

export default function App() {
  if (isClubListPath(window.location.pathname)) return <EditorialPage listOnly />
  const match = window.location.pathname.match(/^\/editorial\/([^/]+)\/?$/)
  const slug = match?.[1]
  if (slug && desktopBySlug[slug]) return <ClubDesktopPage club={desktopBySlug[slug]} />
  return <EditorialPage />
}
