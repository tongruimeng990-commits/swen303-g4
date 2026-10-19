import { hasOwnPage, hasPublishedTime, type ClubSummary } from '../content/clubs'

/**
 * What the golem can answer. Plain keyword rules over the page's own data:
 * it never says anything the clubs have not published here, and it says so
 * when it does not know.
 */

export type GuideActionKind = 'filter-day' | 'open-pile' | 'open-page' | 'catch'

export interface GuideAction {
  label: string
  kind: GuideActionKind
  /** weekday 1–7 for filter-day; slug for open-page / catch */
  arg?: string | number
}

export interface Reply {
  text: string
  actions?: GuideAction[]
}

export interface GuideContext {
  clubs: ClubSummary[]
  /** 1 = Monday … 7 = Sunday */
  today: number
  shortlist: string[]
}

export const SUGGESTED_QUESTIONS = [
  'what’s on thursday?',
  'which clubs are beginner-friendly?',
  'how do I save a club?',
  'when does VicFolk meet?',
]

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_SHORT = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

/**
 * What the golem offers when the pointer settles on a row: a chip and the
 * question it stands for. Not the time or place — the row already says those.
 */
export const hoverPrompts = (club: ClubSummary): Array<{ label: string; question: string }> => [
  { label: 'how to join', question: `how do I join ${club.name}?` },
  { label: 'what should I know?', question: `what should I know about ${club.name}?` },
  hasPublishedTime(club)
    ? { label: 'what else that day?', question: `what else is on ${DAY_NAMES[club.weekday - 1]}?` }
    : { label: 'what’s on this week?', question: 'what’s on this week?' },
]

/** Aliases too generic to identify a club from a sentence ("music", "dance"). */
const VAGUE = new Set(['music', 'dance', 'dancing', 'singing', 'river', 'outdoors'])

const has = (text: string, words: string[]) => words.some((w) => text.includes(w))

function dayFromText(text: string, today: number): number | null {
  if (has(text, ['today', 'tonight'])) return today
  if (text.includes('tomorrow')) return (today % 7) + 1
  for (let i = 0; i < 7; i++) {
    if (text.includes(DAY_NAMES[i]) || new RegExp(`\\b${DAY_SHORT[i]}s?\\b`).test(text)) return i + 1
  }
  return null
}

function clubFromText(text: string, clubs: ClubSummary[]): ClubSummary | null {
  for (const club of clubs) {
    const names = [club.name.toLowerCase(), club.slug, ...club.aliases.filter((alias) => !VAGUE.has(alias))]
    if (names.some((n) => text.includes(n))) return club
  }
  return null
}

const list = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`

const clubActions = (club: ClubSummary, shortlist: string[]): GuideAction[] => {
  const actions: GuideAction[] = []
  if (hasOwnPage(club)) actions.push({ label: `open ${club.name}’s page`, kind: 'open-page', arg: club.slug })
  if (!shortlist.includes(club.slug)) actions.push({ label: `save ${club.name}`, kind: 'catch', arg: club.slug })
  return actions
}

function describeClub(club: ClubSummary, shortlist: string[]): Reply {
  const parts: string[] = []
  parts.push(`${club.name}: ${club.blurb}.`)
  if (club.when) parts.push(`they meet ${club.when}${club.where ? `, ${club.where}` : ''}.`)
  else parts.push(`they haven’t published a regular time here${club.where ? ` — ${club.where}` : ''}.`)
  if (club.signals?.length) parts.push(`worth knowing: ${list(club.signals)}.`)
  if (club.contact?.length) parts.push(`you can reach them by ${list(club.contact)} — links are on their page.`)
  if (shortlist.includes(club.slug)) parts.push('it’s already in your saved clubs.')
  return { text: parts.join(' '), actions: clubActions(club, shortlist) }
}

function describeDay(day: number, ctx: GuideContext): Reply {
  const name = DAY_NAMES[day - 1]
  const on = ctx.clubs.filter((c) => hasPublishedTime(c) && c.weekday === day)
  const unknown = ctx.clubs.filter((c) => !hasPublishedTime(c))
  const action: GuideAction = { label: `show ${DAY_SHORT[day - 1]}`, kind: 'filter-day', arg: day }
  if (on.length === 0) {
    const tail = unknown.length
      ? ` ${list(unknown.map((c) => c.name))} haven’t said when they meet yet, so maybe them.`
      : ''
    return { text: `nobody has published a ${name} session here.${tail}`, actions: [action] }
  }
  const lines = on.map((c) => `${c.name} (${c.next})`)
  return {
    text: `on ${name}: ${list(lines)}.${unknown.length ? ` ${list(unknown.map((c) => c.name))} haven’t published a time.` : ''}`,
    actions: [action, ...on.filter((c) => hasOwnPage(c)).slice(0, 2).map((c) => ({ label: `open ${c.name}`, kind: 'open-page' as const, arg: c.slug }))],
  }
}

export function answer(question: string, ctx: GuideContext): Reply {
  const text = question.trim().toLowerCase().replace(/[’']/g, '’')
  if (!text) return { text: 'ask me about a club, a day of the week, or how saving a club works.' }

  const club = clubFromText(text, ctx.clubs)
  const day = dayFromText(text, ctx.today)

  if (/\b(hi|hey|hello|kia ora|tēnā koe|tena koe)\b|who are you|what are you|your name|are you a/.test(text)) {
    return {
      text: 'kia ora. a small stone that lives on this page — graduated a while back, kept the gown. I only know what the clubs have put here, and I’m good at kicking posters over to your saved clubs.',
    }
  }

  if (has(text, ['free', 'cost', 'fee', 'price', 'money', 'pay', 'membership'])) {
    return {
      text: club
        ? `${club.name} hasn’t published fees here — ask them directly, their contacts are on their page.`
        : 'none of the clubs have published fees on this page. ask them directly; each page lists how to reach them.',
      actions: club ? clubActions(club, ctx.shortlist) : undefined,
    }
  }

  if (has(text, ['pile', 'catch', 'caught', 'save', 'saved', 'my clubs', 'later', 'shortlist', 'bookmark', 'compare'])) {
    return {
      text:
        'click a row to save it — the poster lands in “my clubs” in the corner (I’ll see to that). open my clubs to read them side by side, and click a saved row again to remove it.',
      actions: ctx.shortlist.length ? [{ label: 'open my clubs', kind: 'open-pile' }] : undefined,
    }
  }

  if (has(text, ['filter', 'search', 'find', 'narrow'])) {
    return {
      text: 'the bar under the heading: type a name, or pick weekdays and daytime / evening / weekend. clubs without a published time sink to the bottom instead of vanishing.',
    }
  }

  if (club && has(text, ['should i know', 'worth knowing', 'what to expect', 'expect', 'tips', 'heads up', 'good to know'])) {
    const says = club.signals ?? []
    return {
      text: says.length
        ? `${club.name}, in their own words: ${list(says)}. and it’s ${club.blurb}.`
        : `${club.name} hasn’t said much here beyond “${club.blurb}”${hasOwnPage(club) ? ' — their page has more' : ''}.`,
      actions: clubActions(club, ctx.shortlist),
    }
  }

  if (club && has(text, ['join', 'contact', 'reach', 'sign up', 'signup', 'get in touch', 'email', 'instagram', 'facebook', 'discord', 'message'])) {
    return {
      text: club.contact?.length
        ? `there’s a sign-up form and an ask-a-question box at the bottom of ${club.name}’s page (say hi). you can also reach them by ${list(club.contact)}, or just turn up.`
        : `${club.name} hasn’t published a contact here${hasOwnPage(club) ? ' — their page may say more' : ''}.`,
      actions: clubActions(club, ctx.shortlist),
    }
  }

  if (club && has(text, ['when', 'time', 'what day', 'how often'])) {
    return {
      text: club.when
        ? `${club.name} meets ${club.when}${club.where ? `, ${club.where}` : ''}.`
        : `${club.name} hasn’t published a regular time here${club.where ? ` — they’re at ${club.where}` : ''}.`,
      actions: clubActions(club, ctx.shortlist),
    }
  }

  const BEGINNER = /no experience|all levels|every level|skill level|beginner|all ages/
  if (has(text, ['beginner', 'experience', 'first time', 'never', 'new to', 'newbie', 'start'])) {
    if (club) {
      const says = club.signals?.filter((s) => BEGINNER.test(s)) ?? []
      return {
        text: says.length
          ? `${club.name} says: ${list(says)}. so yes, by their own account.`
          : `${club.name} hasn’t said anything about experience here — ask them, their contacts are on their page.`,
        actions: clubActions(club, ctx.shortlist),
      }
    }
    const easy = ctx.clubs.filter((c) => c.signals?.some((s) => BEGINNER.test(s)))
    return {
      text: easy.length
        ? `these say beginners are fine: ${list(easy.map((c) => c.name))}.`
        : 'none of the clubs have said anything about experience here.',
      actions: easy.slice(0, 3).map((c) => ({ label: c.name, kind: 'open-page' as const, arg: c.slug })),
    }
  }

  if (club && has(text, ['where', 'room', 'campus', 'place', 'venue'])) {
    return {
      text: club.where ? `${club.name} meets at ${club.where}.` : `${club.name} hasn’t published where they meet.`,
      actions: clubActions(club, ctx.shortlist),
    }
  }

  if (club) return describeClub(club, ctx.shortlist)
  if (day) return describeDay(day, ctx)

  if (has(text, ['what’s on', 'whats on', 'this week', 'all clubs', 'which clubs', 'list'])) {
    return {
      text: `${ctx.clubs.length} clubs here: ${list(ctx.clubs.map((c) => `${c.name} (${c.next})`))}.`,
    }
  }

  return {
    text: `I only know what the clubs have put on this page. try “${SUGGESTED_QUESTIONS[0]}”, “${SUGGESTED_QUESTIONS[1]}” or a club’s name.`,
  }
}

/** 1 = Monday … 7 = Sunday for the user's local date. */
export const todayWeekday = () => ((new Date().getDay() + 6) % 7) + 1
