import { useEffect, useRef } from 'react'
import type { ClubDesktopContent } from '../content/types'
import { MacWindow } from './MacWindow'
import { ClubChat } from './ClubChat'
import { ClubCalendar } from './ClubCalendar'
import { conversationProgress, messageOpen, calendarHeight, revealStart, followProgress } from './chat-scroll'

export function ClubConversation({ club }: { club: ClubDesktopContent }) {
  const pairRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const pair = pairRef.current
    if (!pair) return
    const chat = pair.querySelector<HTMLElement>('#members')!
    const calendar = pair.querySelector<HTMLElement>('#coming-up')!
    const body = chat.querySelector<HTMLElement>('.mac-window__body')!
    const bar = chat.querySelector<HTMLElement>('.mac-window__bar')!
    const calendarBody = calendar.querySelector<HTMLElement>('.mac-window__body')!
    const calendarBar = calendar.querySelector<HTMLElement>('.mac-window__bar')!
    const rows = Array.from(chat.querySelectorAll<HTMLElement>('.chat-reveal'))
    const figures = Array.from(chat.querySelectorAll<HTMLElement>('.chat-message'))
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const desktop = window.matchMedia('(min-width: 901px)')
    let frame = 0
    let travel = 0
    let stickyTop = 80
    let enhanced = false
    let disposed = false
    let calendarFullHeight = 0
    let calendarPreview = 0
    let progress = 0
    let lastTime = 0
    let initialized = false

    const update = (time: number) => {
      frame = 0
      const start = revealStart(window.innerHeight, stickyTop)
      const target = enhanced ? conversationProgress(pair.getBoundingClientRect().top, start, travel + start - stickyTop) : 1
      progress = !initialized || !enhanced ? target : followProgress(progress, target, Math.min(64, time - lastTime))
      initialized = true
      lastTime = time
      if (Math.abs(progress - target) < 0.0001) progress = target
      const chatProgress = enhanced ? Math.min(1, progress / 0.65) : 1
      rows.forEach((row, index) => {
        const open = messageOpen(chatProgress, index, rows.length)
        row.style.setProperty('--chat-open', String(open))
        row.style.setProperty('--chat-row', `${open}fr`)
      })
      if (enhanced) {
        const height = calendarHeight(progress, calendarPreview, calendarFullHeight)
        calendar.style.maxHeight = `${height}px`
        // Once the calendar grows beyond the screen, move its top upward so
        // the final events and source note can still be read without an inner scrollbar.
        const available = window.innerHeight - stickyTop - 24
        pair.style.setProperty('--calendar-sticky-top', `${stickyTop - Math.max(0, height - available) * progress}px`)
      } else {
        calendar.style.removeProperty('max-height')
      }
      if (progress !== target && !disposed) frame = requestAnimationFrame(update)
    }
    const schedule = () => {
      if (!frame && !disposed) {
        lastTime = performance.now()
        frame = requestAnimationFrame(update)
      }
    }
    const measure = () => {
      const header = document.querySelector<HTMLElement>('.desk-header')
      stickyTop = (header?.offsetHeight ?? 56) + 20
      pair.style.setProperty('--chat-sticky-top', `${stickyTop}px`)
      const padding = getComputedStyle(body)
      const fullHeight = bar.offsetHeight + parseFloat(padding.paddingTop) + parseFloat(padding.paddingBottom)
        + figures.reduce((sum, figure) => sum + figure.offsetHeight, 0) + Math.max(0, rows.length - 1) * 20
      calendarFullHeight = calendarBar.offsetHeight + calendarBody.scrollHeight
      const firstEvent = calendar.querySelector<HTMLElement>('.calendar-events > li')
      const calendarPadding = getComputedStyle(calendarBody)
      calendarPreview = firstEvent
        ? firstEvent.getBoundingClientRect().bottom - calendar.getBoundingClientRect().top + parseFloat(calendarPadding.paddingBottom)
        : calendarFullHeight
      travel = Math.max(320, (calendarFullHeight - calendarPreview) * 0.8)
      // Never pin a chat taller than the available screen, or hide its last quote.
      enhanced = desktop.matches && !reduced.matches && fullHeight + stickyTop + 24 <= window.innerHeight
        && calendarFullHeight - calendarPreview > 80
      pair.toggleAttribute('data-scroll-chat', enhanced)
      pair.style.minHeight = enhanced ? `${Math.max(calendarFullHeight, fullHeight) + travel}px` : ''
      schedule()
    }

    const resize = new ResizeObserver(measure)
    // Observe the content, not the clipped window: expansion must never change
    // the scroll range and feed back into its own progress calculation.
    resize.observe(calendarBody)
    figures.forEach((figure) => resize.observe(figure))
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', measure)
    reduced.addEventListener('change', measure)
    desktop.addEventListener('change', measure)
    void document.fonts.ready.then(() => { if (!disposed) measure() })
    measure()
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      resize.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', measure)
      reduced.removeEventListener('change', measure)
      desktop.removeEventListener('change', measure)
      pair.removeAttribute('data-scroll-chat')
      pair.style.removeProperty('min-height')
      calendar.style.removeProperty('max-height')
      rows.forEach((row) => {
        row.style.removeProperty('--chat-open')
        row.style.removeProperty('--chat-row')
      })
    }
  }, [club.slug])

  return (
    <div className="club-conversation" ref={pairRef}>
      <MacWindow id="members" title="in-their-words.chat" subtitle="members on why they go" className="desk-window--wall">
        <ClubChat club={club} />
      </MacWindow>
      <MacWindow id="coming-up" title="coming-up.ics" subtitle="when they meet" className="desk-window--events">
        <ClubCalendar club={club} />
      </MacWindow>
    </div>
  )
}
