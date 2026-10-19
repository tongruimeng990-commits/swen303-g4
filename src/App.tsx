import { EditorialPage } from './EditorialPage'
import { ClubDesktopPage } from './clubs/ClubDesktopPage'
import { desktopBySlug } from './content/desktops'

export default function App() {
  const match = window.location.pathname.match(/^\/editorial\/([^/]+)\/?$/)
  const slug = match?.[1]
  if (slug && desktopBySlug[slug]) return <ClubDesktopPage club={desktopBySlug[slug]} />
  return <EditorialPage />
}
