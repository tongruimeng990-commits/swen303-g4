import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { prefersReducedMotion } from '../lib/shortlist'

/** Dispatched on `window` with the window's id as `detail`; MacWindow answers by unfolding and flashing its bar once the page has arrived. */
export const OPEN_EVENT = 'vuwclubs:open-window'

/** Scroll to a window on the desk and ask it to open. Used by the Dock and by links between windows. */
export function openWindow(id: string) {
  const target = document.getElementById(id)
  target?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  // After the scroll call, so the window can tell whether it still has to travel.
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }))
}

export type DockKind = 'txt' | 'note' | 'mov' | 'chat' | 'ics' | 'mail'

export interface DockItem {
  /** id of the window section it opens */
  id: string
  /** the file name, shown as the tooltip's first line */
  file: string
  /** what it is, in plain words */
  hint: string
  kind: DockKind
}

/** How far (px) the magnification reaches either side of the pointer. */
const REACH = 110
const MAX_SCALE = 1.6

/**
 * The club page's Dock: one icon per window on the desk. Hover magnifies the
 * neighbourhood like macOS; click scrolls to that window (which opens it,
 * as any scroll does), unfolds it if it was folded, bounces the icon and
 * flashes the bar once it has arrived. A dot marks the window on screen.
 */
export function Dock({ items }: { items: DockItem[] }) {
  const barRef = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const [bouncing, setBouncing] = useState<string | null>(null)

  // Which window is most on screen right now.
  useEffect(() => {
    const ratios = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) ratios.set(entry.target.id, entry.intersectionRatio)
        let best: string | null = null
        let bestRatio = 0.08
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            best = id
            bestRatio = ratio
          }
        }
        setActive(best)
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1], rootMargin: '-72px 0px -20% 0px' },
    )
    for (const item of items) {
      const target = document.getElementById(item.id)
      if (target) observer.observe(target)
    }
    return () => observer.disconnect()
  }, [items])

  const magnify = (event: PointerEvent<HTMLDivElement>) => {
    const bar = barRef.current
    if (!bar || event.pointerType === 'touch' || prefersReducedMotion()) return
    for (const button of bar.querySelectorAll<HTMLElement>('.dock__item')) {
      const rect = button.getBoundingClientRect()
      const centre = rect.left + rect.width / 2
      const distance = Math.abs(event.clientX - centre)
      const t = Math.max(0, 1 - distance / REACH)
      const eased = t * t * (3 - 2 * t)
      button.style.setProperty('--m', (1 + (MAX_SCALE - 1) * eased).toFixed(3))
    }
  }

  const relax = () => {
    const bar = barRef.current
    if (!bar) return
    for (const button of bar.querySelectorAll<HTMLElement>('.dock__item')) button.style.removeProperty('--m')
  }

  const open = (item: DockItem) => {
    openWindow(item.id)
    setBouncing(item.id)
    window.setTimeout(() => setBouncing((current) => (current === item.id ? null : current)), 700)
  }

  return (
    <nav className="dock" aria-label="Windows on this desk">
      <div className="dock__bar" ref={barRef} onPointerMove={magnify} onPointerLeave={relax}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="dock__item"
            data-kind={item.kind}
            data-active={active === item.id || undefined}
            data-bounce={bouncing === item.id || undefined}
            aria-label={`${item.file}: ${item.hint}`}
            aria-current={active === item.id ? 'true' : undefined}
            onClick={() => open(item)}
            style={{ '--m': 1 } as CSSProperties}
          >
            <span className="dock__icon" aria-hidden="true">
              <DockGlyph kind={item.kind} />
            </span>
            <span className="dock__tip" aria-hidden="true">
              <b>{item.file}</b>
              <span>{item.hint}</span>
            </span>
            <span className="dock__dot" aria-hidden="true" />
          </button>
        ))}
      </div>
    </nav>
  )
}

function DockGlyph({ kind }: { kind: DockKind }) {
  switch (kind) {
    case 'txt':
      return (
        <svg viewBox="0 0 48 48">
          <path d="M12 6h17l9 9v27a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" fill="#fff" stroke="#c9c9c4" />
          <path d="M29 6v9h9" fill="#ececea" stroke="#c9c9c4" />
          <path d="M16 22h16M16 28h16M16 34h10" stroke="#8a8a86" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'note':
      return (
        <svg viewBox="0 0 48 48">
          <path d="M8 10a2 2 0 0 1 2-2h28a2 2 0 0 1 2 2v22l-8 8H10a2 2 0 0 1-2-2z" fill="#fde98a" />
          <path d="M40 32l-8 8v-6a2 2 0 0 1 2-2z" fill="#e8cd4e" />
          <path d="M14 18h20M14 24h20M14 30h12" stroke="#8a6f14" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'mov':
      return (
        <svg viewBox="0 0 48 48">
          <rect x="6" y="10" width="36" height="28" rx="4" fill="#1d1d21" />
          <path d="M6 16h36M6 32h36" stroke="#3a3a40" />
          <path d="M20 17v14l12-7z" fill="#fff" />
        </svg>
      )
    case 'chat':
      return (
        <svg viewBox="0 0 48 48">
          <path d="M8 12a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H20l-9 7v-7h-3V12z" fill="#34c759" />
          <circle cx="17" cy="19" r="2.2" fill="#fff" />
          <circle cx="24" cy="19" r="2.2" fill="#fff" />
          <circle cx="31" cy="19" r="2.2" fill="#fff" />
        </svg>
      )
    case 'ics':
      return (
        <svg viewBox="0 0 48 48">
          <rect x="8" y="8" width="32" height="32" rx="5" fill="#fff" stroke="#c9c9c4" />
          <path d="M8 13a5 5 0 0 1 5-5h22a5 5 0 0 1 5 5v5H8z" fill="#e8333a" />
          <text x="24" y="33" textAnchor="middle" fontSize="15" fontWeight="700" fill="#141414" fontFamily="inherit">
            {new Date().getDate()}
          </text>
        </svg>
      )
    case 'mail':
      return (
        <svg viewBox="0 0 48 48">
          <rect x="6" y="11" width="36" height="26" rx="4" fill="#dce9fb" stroke="#9fbce6" />
          <path d="M8 14l16 12 16-12" fill="none" stroke="#3b7dd8" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
  }
}
