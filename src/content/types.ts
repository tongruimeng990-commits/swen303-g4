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
  where?: string
  note?: string
}

export interface ClubDesktopContent {
  slug: string
  name: string
  fullName: string
  /** Lowercase one-liner for the hero. */
  hello: string
  meets: {
    line: string
    room: string
    caveat: string
    directions: string
  }
  thisWeek: {
    subject: string
    lines: string[]
  }
  firstTime: string[]
  /** Window title + lead line above the video grid, e.g. "watch-a-ceilidh.mov". */
  watch: { file: string; lead: string }
  /** Window title for the quote wall, e.g. "what-members-say". */
  quotesFile: string
  quotes: ClubQuote[]
  comingUp: ClubEvent[]
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
