/**
 * The join form's rules, kept out of the component so they can be tested
 * without a DOM. Nothing here sends anything: the form is a prototype and
 * says so on the page.
 */

export type JoinTab = 'signup' | 'ask'

export interface SignupFields {
  name: string
  studentId: string
  email: string
  note: string
}

export interface AskFields {
  email: string
  question: string
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>

/** VUW student IDs are 9 digits in practice; we accept 6–10 so test data works. */
export const studentIdOk = (value: string) => /^\d{6,10}$/.test(value.trim())

export const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

export function validateSignup(fields: SignupFields): FieldErrors<SignupFields> {
  const errors: FieldErrors<SignupFields> = {}
  if (!fields.name.trim()) errors.name = 'The club needs a name to say hi to.'
  if (!fields.studentId.trim()) errors.studentId = 'Your student ID is on your ID card.'
  else if (!studentIdOk(fields.studentId)) errors.studentId = 'VUW student IDs are numbers only.'
  if (!fields.email.trim()) errors.email = 'An email so the club can reply.'
  else if (!emailOk(fields.email)) errors.email = 'That email is missing an @ or a dot.'
  return errors
}

export function validateAsk(fields: AskFields): FieldErrors<AskFields> {
  const errors: FieldErrors<AskFields> = {}
  if (!fields.question.trim()) errors.question = 'Type a question, or pick one below.'
  if (fields.email.trim() && !emailOk(fields.email)) errors.email = 'That email is missing an @ or a dot.'
  return errors
}

/** Starter questions a first-timer tends to have; tapping one fills the box. */
export const STARTER_QUESTIONS = [
  'do I need any experience?',
  'what does it cost?',
  'is it ok to come alone?',
] as const

/**
 * The line shown after a successful sign-up. It repeats the one fact the
 * person now needs (when and where) and never claims membership.
 */
export function sentLine(club: { name: string; meets: { line: string; room: string } }) {
  const when = club.meets.line.trim()
  const where = club.meets.room.trim()
  const next = when ? `${when}${where ? `, ${where}` : ''}` : null
  return next
    ? `${club.name} usually replies within a few days. ${next} — you can just turn up.`
    : `${club.name} usually replies within a few days with when and where to come.`
}
