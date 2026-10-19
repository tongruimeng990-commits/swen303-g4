import { useEffect, useRef, useState, type FormEvent } from 'react'
import { clubBySlug, clubsByTone } from '../content/clubs'
import { useShortlist } from '../lib/shortlist'
import { answer, SUGGESTED_QUESTIONS, todayWeekday, type GuideAction, type Reply } from './guide'
import { requestCatch, requestFilterDay } from './useGolem'

interface Line {
  who: 'golem' | 'you'
  text: string
  actions?: GuideAction[]
}

interface GolemChatProps {
  open: boolean
  /** The golem has been told to wait where it is. */
  waiting: boolean
  /** Pointer mode only: there is a cursor to follow. */
  canFollow: boolean
  onClose: () => void
  onFollow: () => void
  onWait: () => void
  /** A question to ask the moment the bubble opens (from a hover chip). `id` makes repeats distinct. */
  initialQuestion?: { id: number; text: string } | null
}

const MAX_LINES = 5

/**
 * The speech bubble: a line from the golem, the question box, a few
 * suggestions, and answers. Lives in the DOM beside the canvas; its position
 * comes from the parent anchor, which the character updates every frame.
 */
export function GolemChat({ open, waiting, canFollow, onClose, onFollow, onWait, initialQuestion }: GolemChatProps) {
  const shortlist = useShortlist()
  const [lines, setLines] = useState<Line[]>([])
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)

  const push = (next: Line[]) => setLines((current) => [...current, ...next].slice(-MAX_LINES))

  const ask = (question: string) => {
    const q = question.trim()
    if (!q) return
    const reply: Reply = answer(q, { clubs: clubsByTone, today: todayWeekday(), shortlist: shortlist.items })
    push([
      { who: 'you', text: q },
      { who: 'golem', text: reply.text, actions: reply.actions },
    ])
    setInput('')
  }
  const askRef = useRef(ask)
  askRef.current = ask

  // A hover chip opened the bubble with a question already chosen.
  const askedId = useRef<number | null>(null)
  useEffect(() => {
    if (!open || !initialQuestion || askedId.current === initialQuestion.id) return
    askedId.current = initialQuestion.id
    askRef.current(initialQuestion.text)
  }, [open, initialQuestion])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 60)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight })
  }, [lines])

  if (!open) return null

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    ask(input)
  }

  const run = (action: GuideAction) => {
    switch (action.kind) {
      case 'filter-day':
        if (typeof action.arg === 'number') requestFilterDay(action.arg)
        push([{ who: 'golem', text: 'there — the list is narrowed to that day.' }])
        return
      case 'open-pile':
        onClose()
        document.getElementById('shortlist-pile')?.click()
        return
      case 'open-page': {
        const club = typeof action.arg === 'string' ? clubBySlug(action.arg) : null
        if (club) window.location.assign(club.href)
        return
      }
      case 'catch':
        if (typeof action.arg === 'string') {
          onClose()
          requestCatch(action.arg)
        }
        return
    }
  }

  const greeting = !canFollow
    ? 'I’ll sit here by your saved clubs. ask me something.'
    : waiting
      ? 'I’m over here if you need me. ask me something, or I can tag along.'
      : 'coming along. ask me something, or tell me to wait.'

  return (
    <div className="golem-bubble" role="dialog" aria-label="the golem">
      <div className="golem-bubble__head">
        <p className="golem-bubble__say">{greeting}</p>
        <button type="button" className="golem-bubble__close" aria-label="close" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="golem-bubble__body" ref={bodyRef}>
        {lines.map((line, index) => (
          <div key={index} className="golem-line" data-who={line.who}>
            <p>{line.text}</p>
            {line.actions?.length ? (
              <div className="golem-line__actions">
                {line.actions.map((action) => (
                  <button key={action.label} type="button" className="golem-chip" onClick={() => run(action)}>
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {lines.length === 0 ? (
        <div className="golem-bubble__suggest">
          {SUGGESTED_QUESTIONS.map((question) => (
            <button key={question} type="button" className="golem-chip" onClick={() => ask(question)}>
              {question}
            </button>
          ))}
        </div>
      ) : null}

      <form className="golem-bubble__ask" onSubmit={onSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          placeholder="ask me about the clubs…"
          aria-label="ask the golem"
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => setInput(event.target.value)}
        />
        <button type="submit" aria-label="ask">
          →
        </button>
      </form>

      {canFollow ? (
        <div className="golem-bubble__foot">
          <button
            type="button"
            className="golem-bubble__mode"
            aria-pressed={waiting}
            onClick={waiting ? onFollow : onWait}
          >
            {waiting ? 'follow me' : 'wait here'}
          </button>
        </div>
      ) : null}
      <span className="golem-bubble__tail" aria-hidden="true" />
    </div>
  )
}
