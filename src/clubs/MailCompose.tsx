import { useState, type FormEvent } from 'react'
import type { ClubDesktopContent } from '../content/types'
import { mailDraftUrl } from './mail'

/**
 * The email draft behind "or email them yourself". The disclosure above it
 * already says it opens the mail app, and the contact list under the window
 * shows the address, so this is just the draft and one button.
 */
export function MailCompose({ club }: { club: ClubDesktopContent }) {
  const [replyTo, setReplyTo] = useState('')
  const [subject, setSubject] = useState("hi, I'd like to come along")
  const [body, setBody] = useState(`Kia ora ${club.name},\nI'd like to try a session. What should I know before coming along?\nThanks!`)
  const [status, setStatus] = useState('')
  const openDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = replyTo ? `${body}\n\nReply to: ${replyTo}` : body
    window.location.href = mailDraftUrl(club.contact.email, subject, message)
    setStatus('Draft requested. Send it from your email app. If nothing opened, use the address below.')
  }
  return (
    <form className="mail-compose" onSubmit={openDraft}>
      <label>to<input type="email" value={club.contact.email} readOnly /></label>
      <label>your email (optional)<input type="email" value={replyTo} autoComplete="email" onChange={(event) => setReplyTo(event.target.value)} placeholder="For the club to reply to" /></label>
      <label>subject<input value={subject} required onChange={(event) => setSubject(event.target.value)} /></label>
      <label className="mail-compose__body">message<textarea rows={5} value={body} required onChange={(event) => setBody(event.target.value)} /></label>
      <div className="mail-compose__actions">
        <button className="desk-button desk-button--primary" type="submit">Open email draft →</button>
      </div>
      <p className="mail-compose__status" role="status">{status}</p>
    </form>
  )
}
