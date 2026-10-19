export interface ClubPhoto {
  src: string
  alt: string
  portrait?: boolean
}

export interface ClubVideo {
  youtubeId: string
  title: string
  /** Filename shown on the desktop icon and window title, e.g. "strip-the-willow.mov" */
  file: string
  duration: string
  credit: string
  /** Width / height. Defaults to 16:9. */
  aspect?: number
}

export interface ClubQuote {
  text: string
  by: string
}

export interface ClubEvent {
  name: string
  when: string
  /** Clock time on its own for compact listings, e.g. "6–8pm". */
  time?: string
  date?: string
  endDate?: string
  weekday?: number
  headline?: boolean
  where?: string
  note?: string
}

export interface ClubDesktopContent {
  slug: string
  name: string
  fullName: string
  tags: string[]
  intro: string
  letter: { subject: string; greeting: string; body: string; signoff: string }
  costs: { label: string; price: string; note?: string }[]
  bring: { yes: string[]; no: string[] }
  /** The three or four things to know before the first visit; this is what first-time.note shows. */
  essentials: string[]
  /** Longer background and trivia. Kept for search and the research record; not shown on the desk. */
  goodToKnow: string[]
  events: ClubEvent[]
  meets: {
    line: string
    room: string
    caveat: string
    directions: string
  }
  /** Window title + lead line above the video grid, e.g. "watch-a-ceilidh.mov". */
  watch: { file: string; lead: string }
  quotes: ClubQuote[]
  /** Small print under the events list. */
  comingUpNote: string
  /** Small print under the contact list. */
  sayHiNote: string
  contact: {
    email: string
    website?: string
    facebook?: string
    instagram?: string
    instagramHandle?: string
    mailingList?: string
  }
  logo: string
  sticker: { src: string; alt: string }
  poster?: ClubPhoto
  photos: ClubPhoto[]
  videos: ClubVideo[]
}
