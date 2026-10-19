import { useEffect, useId, useRef, useState, type AnimationEvent, type ReactNode, type CSSProperties } from 'react'
import { OPEN_EVENT } from './Dock'
import { prefersReducedMotion } from '../lib/shortlist'
import { followProgress } from './chat-scroll'
import { openMetrics, openProgress } from './window-open'

interface MacWindowProps {
  title: string
  /** What the window is for, in plain words: "when they meet". Sits after the file name. */
  subtitle?: string
  id?: string
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/** Frames with no scroll movement after which a scroll counts as finished (~50ms). */
const STILL_FRAMES = 3
/** Frames to give a smooth scroll to begin before deciding none was needed (~130ms). */
const START_FRAMES = 8
/** Never wait longer than this for a smooth scroll, whatever the browser does. */
const SETTLE_LIMIT_MS = 2500

/**
 * Call `done` once the page has stopped scrolling: smooth scrolls take a
 * different time in every browser and `scrollend` isn't everywhere, so
 * watch scrollY frame by frame instead. Returns a cancel function.
 */
function afterScrollSettles(done: () => void) {
  let last = window.scrollY
  let moved = false
  let still = 0
  let frames = 0
  let frame = 0
  const started = performance.now()
  const tick = () => {
    const now = window.scrollY
    frames += 1
    if (now !== last) {
      moved = true
      still = 0
    } else {
      still += 1
    }
    last = now
    const settled = moved ? still >= STILL_FRAMES : frames >= START_FRAMES
    if (settled || performance.now() - started > SETTLE_LIMIT_MS) {
      done()
      return
    }
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(frame)
}

/**
 * A window on the club's desk. Of the three lights only the yellow one does
 * anything: it folds the window down to its title bar and back. Red and
 * green are decoration, and are marked as such.
 *
 * Windows open as you scroll to them: while the title bar rises through the
 * lower half of the screen the frame grows from just the bar to full height
 * (see `window-open.ts`), the same language as the calendar growing beside
 * the chat. The footprint in the grid never changes (a shrinking bottom
 * margin makes up the difference), so nothing below the window moves.
 * Asked for from the Dock, the window unfolds, the page scrolls to it (and
 * so opens it), and the bar catches the light once it has arrived.
 */
export function MacWindow({ title, subtitle, id, className, style, children }: MacWindowProps) {
  const [folded, setFolded] = useState(false)
  const [flash, setFlash] = useState(false)
  const sectionRef = useRef<HTMLElement | null>(null)
  const bodyId = useId()

  // Scroll-linked opening.
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const bar = section.querySelector<HTMLElement>('.mac-window__bar')
    const body = section.querySelector<HTMLElement>('.mac-window__body')
    if (!bar || !body) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let disposed = false
    let progress = 1
    let initialized = false
    let lastTime = 0

    const show = (value: number) => {
      if (value >= 1) {
        section.removeAttribute('data-scroll-open')
        section.style.removeProperty('--open-height')
        section.style.removeProperty('--open-gap')
        return
      }
      const { height, gap } = openMetrics(bar.offsetHeight, bar.offsetHeight + body.offsetHeight, value)
      section.setAttribute('data-scroll-open', '')
      section.style.setProperty('--open-height', `${height}px`)
      section.style.setProperty('--open-gap', `${gap}px`)
    }

    const update = (time: number) => {
      frame = 0
      if (disposed) return
      // The chat + calendar pair has its own scroll choreography (ClubConversation).
      if (folded || reduced.matches || section.closest('[data-scroll-chat]')) {
        progress = 1
        show(1)
        return
      }
      const top = section.getBoundingClientRect().top
      const remaining = document.documentElement.scrollHeight - window.innerHeight - window.scrollY
      const target = openProgress(top, window.innerHeight, top - remaining)
      progress = !initialized ? target : followProgress(progress, target, Math.min(64, time - lastTime))
      initialized = true
      lastTime = time
      if (Math.abs(progress - target) < 0.01) progress = target // within ~3px: snap
      show(progress)
      if (progress !== target) frame = requestAnimationFrame(update)
    }
    const schedule = () => {
      if (!frame && !disposed) {
        lastTime = performance.now()
        frame = requestAnimationFrame(update)
      }
    }

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    reduced.addEventListener('change', schedule)
    schedule()
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      reduced.removeEventListener('change', schedule)
      show(1)
    }
  }, [folded])

  // Opened from the Dock: unfold, and flash the bar once the page has arrived.
  useEffect(() => {
    if (!id) return
    let cancelWait: (() => void) | null = null
    const onOpen = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== id) return
      setFolded(false)
      if (prefersReducedMotion()) return // unfolding is the whole response
      cancelWait?.()
      cancelWait = afterScrollSettles(() => {
        cancelWait = null
        setFlash(false)
        requestAnimationFrame(() => setFlash(true))
      })
    }
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen)
      cancelWait?.()
    }
  }, [id])

  const onAnimationEnd = (event: AnimationEvent<HTMLElement>) => {
    if (event.animationName === 'window-bar-flash') setFlash(false)
  }

  return (
    <section
      ref={sectionRef}
      id={id}
      className={['mac-window', className].filter(Boolean).join(' ')}
      style={style}
      data-folded={folded || undefined}
      data-flash={flash || undefined}
      onAnimationEnd={onAnimationEnd}
    >
      <header className="mac-window__bar">
        <span className="mac-window__lights">
          <i aria-hidden="true" />
          <button
            type="button"
            className="mac-window__fold"
            aria-expanded={!folded}
            aria-controls={bodyId}
            aria-label={folded ? `Unfold ${title}` : `Fold ${title} away`}
            title={folded ? 'unfold' : 'fold away'}
            onClick={() => setFolded((value) => !value)}
          />
          <i aria-hidden="true" />
        </span>
        <h2 className="mac-window__title">
          {title}
          {subtitle ? <span className="mac-window__subtitle"> — {subtitle}</span> : null}
        </h2>
      </header>
      <div className="mac-window__body" id={bodyId} hidden={folded}>
        {children}
      </div>
    </section>
  )
}
