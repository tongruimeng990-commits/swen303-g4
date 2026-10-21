export const CLUBS_PATH = '/clubs'

export function clubListUrl(query = ''): string {
  const value = query.trim()
  return value ? `${CLUBS_PATH}?${new URLSearchParams({ q: value })}` : CLUBS_PATH
}

export function isClubListPath(pathname: string): boolean {
  return pathname === CLUBS_PATH || pathname === `${CLUBS_PATH}/`
}
