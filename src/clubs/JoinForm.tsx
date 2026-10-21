import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { ClubDesktopContent } from '../content/types'
import { prefersReducedMotion } from '../lib/shortlist'
import { MailCompose } from './MailCompose'
import {
  sentLine,
  STARTER_QUESTIONS,
  validateAsk,
  validateSignup,
  type AskFields,
  type FieldErrors,
  type JoinTab,
  type SignupFields,
} from './join'

type Phase = 'idle' | 'sending' | 'sent'

/** How long the prototype pretends to send for. Long enough to read "Sending…". */
const SEND_MS = 650

interface JoinFormProps {
  club: ClubDesktopContent
  /** Something was sent (the window retitles itself). */
  onSent?: (tab: JoinTab) => void
}

/**
 * The club's say-hi window: a sign-up form and an ask-a-question form that
 * stay on the page, and the old email draft behind a disclosure. The forms
 * are a prototype, labelled as such; nothing leaves the browser. Each fact
 * is said once: the tabs name the two choices, the contact list under the
 * window is the one place the address appears.
 */
export function JoinForm({ club, onSent }: JoinFormProps) {
  const [tab, setTab] = useState<JoinTab>('signup')
  const [phase, setPhase] = useState<Phase>('idle')
  const [sentTab, setSentTab] = useState<JoinTab | null>(null)
  const [signup, setSignup] = useState<SignupFields>({ name: '', studentId: '', email: '', note: '' })
  const [ask, setAsk] = useState<AskFields>({ email: '', question: '' })
  const [signupErrors, setSignupErrors] = useState<FieldErrors<SignupFields>>({})
  const [askErrors, setAskErrors] = useState<FieldErrors<AskFields>>({})
  const formRef = useRef<HTMLFormElement | null>(null)
  const timer = useRef<number | null>(null)
  const baseId = useId()

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
  }, [])

  const shake = (name: string) => {
    if (prefersReducedMotion()) return
    const field = formRef.current?.querySelector<HTMLElement>(`[name="${name}"]`)
    field?.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }],
      { duration: 220, easing: 'ease-out' },
    )
  }

  const send = (which: JoinTab) => {
    setPhase('sending')
    timer.current = window.setTimeout(() => {
      timer.current = null
      setPhase('sent')
      setSentTab(which)
      onSent?.(which)
    }, SEND_MS)
  }

  const submitSignup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (phase !== 'idle') return
    const errors = validateSignup(signup)
    setSignupErrors(errors)
    const first = (Object.keys(errors) as Array<keyof SignupFields>)[0]
    if (first) {
      shake(first)
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    send('signup')
  }

  const submitAsk = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (phase !== 'idle') return
    const errors = validateAsk(ask)
    setAskErrors(errors)
    const first = (Object.keys(errors) as Array<keyof AskFields>)[0]
    if (first) {
      shake(first)
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    send('ask')
  }

  const reset = () => {
    setPhase('idle')
    setSentTab(null)
  }

  const switchTab = (next: JoinTab) => {
    if (next === tab) return
    setTab(next)
    if (phase === 'sent' && sentTab !== next) reset()
  }

  const tabId = (which: JoinTab) => `${baseId}-tab-${which}`
  const panelId = (which: JoinTab) => `${baseId}-panel-${which}`

  return (
    <div className="join join--balanced" data-phase={phase}>
      <div className="join__tabs" role="tablist" aria-label="Sign up, or ask a question first">
        {(['signup', 'ask'] as const).map((which) => (
          <button
            key={which}
            type="button"
            role="tab"
            id={tabId(which)}
            aria-selected={tab === which}
            aria-controls={panelId(which)}
            tabIndex={tab === which ? 0 : -1}
            className="join__tab"
            onClick={() => switchTab(which)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault()
                const other: JoinTab = which === 'signup' ? 'ask' : 'signup'
                switchTab(other)
                document.getElementById(tabId(other))?.focus()
              }
            }}
          >
            {which === 'signup' ? 'sign up' : 'ask a question'}
          </button>
        ))}
      </div>

      {tab === 'signup' ? (
        <form
          ref={formRef}
          id={panelId('signup')}
          role="tabpanel"
          aria-labelledby={tabId('signup')}
          className="join__form"
          noValidate
          onSubmit={submitSignup}
        >
          <div className="join__row">
            <Field label="your name" error={signupErrors.name} id={`${baseId}-name`}>
              <input id={`${baseId}-name`} name="name" autoComplete="name" placeholder="Your name" value={signup.name} disabled={phase !== 'idle'} onChange={(e) => setSignup({ ...signup, name: e.target.value })} />
            </Field>
            <Field label="your email" error={signupErrors.email} id={`${baseId}-email`}>
              <input id={`${baseId}-email`} name="email" type="email" autoComplete="email" placeholder="you@myvuw.ac.nz" value={signup.email} disabled={phase !== 'idle'} onChange={(e) => setSignup({ ...signup, email: e.target.value })} />
            </Field>
          </div>
          <div className="join__row join__row--details">
            <Field label="student ID" error={signupErrors.studentId} id={`${baseId}-sid`}>
              <input id={`${baseId}-sid`} name="studentId" inputMode="numeric" autoComplete="off" placeholder="300123456" value={signup.studentId} disabled={phase !== 'idle'} onChange={(e) => setSignup({ ...signup, studentId: e.target.value })} />
            </Field>
            <Field label="your message (optional)" id={`${baseId}-note`}>
              <textarea id={`${baseId}-note`} name="note" rows={1} placeholder="e.g. total beginner, free after 6pm" value={signup.note} disabled={phase !== 'idle'} onChange={(e) => setSignup({ ...signup, note: e.target.value })} />
            </Field>
          </div>
          <div className="join__actions">
            <StatusButton phase={phase} idle="Sign up" />
          </div>
        </form>
      ) : (
        <form
          ref={formRef}
          id={panelId('ask')}
          role="tabpanel"
          aria-labelledby={tabId('ask')}
          className="join__form"
          noValidate
          onSubmit={submitAsk}
        >
          <Field label="your question" error={askErrors.question} id={`${baseId}-q`}>
            <textarea id={`${baseId}-q`} name="question" rows={3} value={ask.question} disabled={phase !== 'idle'} onChange={(e) => setAsk({ ...ask, question: e.target.value })} />
          </Field>
          <div className="join__chips" aria-label="Common questions">
            {STARTER_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                className="join__chip"
                disabled={phase !== 'idle'}
                aria-pressed={ask.question === question}
                onClick={() => {
                  setAsk({ ...ask, question })
                  setAskErrors({})
                }}
              >
                {question}
              </button>
            ))}
          </div>
          <Field label="email for the reply (optional)" error={askErrors.email} id={`${baseId}-aemail`}>
            <input id={`${baseId}-aemail`} name="email" type="email" autoComplete="email" value={ask.email} disabled={phase !== 'idle'} onChange={(e) => setAsk({ ...ask, email: e.target.value })} />
          </Field>
          <div className="join__actions">
            <StatusButton phase={phase} idle="Ask" />
          </div>
        </form>
      )}

      <p className="join__sent" role="status" aria-live="polite" data-visible={phase === 'sent' || undefined}>
        {phase === 'sent'
          ? sentTab === 'signup'
            ? sentLine(club)
            : `${club.name} usually replies within a few days. in the meantime their page above covers most of it.`
          : ''}
        {phase === 'sent' ? (
          <button type="button" className="join__again" onClick={reset}>
            send another
          </button>
        ) : null}
      </p>

      <p className="join__proto">
        <span aria-hidden="true">◐</span> Prototype only — this form does not send to {club.name}. Use the email option below to contact them.
      </p>

      <details className="join__mail">
        <summary>or email them yourself — opens your mail app</summary>
        <MailCompose club={club} />
      </details>
    </div>
  )
}

function Field({ label, error, id, children }: { label: string; error?: string; id: string; children: ReactNode }) {
  return (
    <div className="join__field" data-invalid={error ? '' : undefined}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <span className="join__error" role="alert">{error}</span> : null}
    </div>
  )
}

/**
 * One button that becomes its own receipt: label → spinner → a check that
 * draws itself. Width is fixed from the idle label so nothing jumps.
 */
function StatusButton({ phase, idle }: { phase: Phase; idle: string }) {
  return (
    <button
      type="submit"
      className="desk-button desk-button--primary join__submit"
      data-phase={phase}
      disabled={phase !== 'idle'}
      aria-live="polite"
    >
      <span className="join__submit-label">{phase === 'sending' ? 'Sending…' : phase === 'sent' ? 'Sent' : idle}</span>
      <span className="join__submit-icon" aria-hidden="true">
        <svg viewBox="0 0 20 20" width="18" height="18">
          <circle className="join__ring" cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path className="join__check" d="M5.5 10.5 8.5 13.5 14.5 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  )
}
