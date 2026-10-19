import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { requestSearch } from '../lib/search'

/** Where the pill's centre wants to be, as a share of the screen's height. */
const CENTRE = 0.54
const GAP_BELOW_TITLE = 36
const LIVE_DELAY_MS = 300

/**
 * The search box on the first screen: the centre of the picture, drawn above
 * the poster trail so it is always clickable; the trail itself is untouched
 * and keeps running behind it. Typing filters the list live; Enter or the
 * arrow scrolls down and hands focus to the list's own search.
 */
export function HeroSearch() {
  const id = useId()
  const formRef = useRef<HTMLFormElement | null>(null)
  const [top, setTop] = useState<number | null>(null)
  const [value, setValue] = useState('')
  const timer = useRef<number | null>(null)

  // Centre of the screen, unless the VUW mark (left of centre, above) reaches
  // down that far on a short window — then sit just under it. Layout boxes
  // (offset*, summed up to the screen), so the scroll-driven transforms on
  // the heading do not shift the measurement.
  useEffect(() => {
    const heading = document.querySelector<HTMLElement>('.hero-heading')
    const anchor = heading?.querySelector<HTMLElement>('[data-search-anchor]') ?? heading
    const form = formRef.current
    const screen = heading?.offsetParent as HTMLElement | null
    if (!heading || !anchor || !form || !screen) return
    const topWithin = (el: HTMLElement) => {
      let top = 0
      for (let node: HTMLElement | null = el; node && node !== screen; node = node.offsetParent as HTMLElement | null) {
        top += node.offsetTop
      }
      return top
    }
    const measure = () => {
      const centred = screen.offsetHeight * CENTRE - form.offsetHeight / 2
      const underTitle = topWithin(anchor) + anchor.offsetHeight + GAP_BELOW_TITLE
      setTop(Math.round(Math.max(centred, underTitle)))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(anchor)
    observer.observe(screen)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
  }, [])

  const onChange = (next: string) => {
    setValue(next)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      timer.current = null
      requestSearch(next, false)
    }, LIVE_DELAY_MS)
  }

  const commit = (query: string) => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    requestSearch(query, true)
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    commit(value)
  }

  const pick = (query: string) => {
    setValue(query)
    commit(query)
  }

  return (
    <form
      ref={formRef}
      className="hero-search"
      role="search"
      aria-label="Search clubs"
      style={{ '--hero-search-top': top === null ? undefined : `${top}px` } as CSSProperties}
      data-ready={top !== null || undefined}
      onSubmit={onSubmit}
    >
      <label className="visually-hidden" htmlFor={id}>
        search clubs by name, activity or day
      </label>
      <div className="hero-search__field">
        <svg className="hero-search__glass" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          id={id}
          type="search"
          value={value}
          placeholder="a club, an activity, or a day"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="submit" className="hero-search__go" aria-label="Search and show the list">
          →
        </button>
      </div>
      <p className="hero-search__hint">
        try <button type="button" onClick={() => pick('debate')}>“debate”</button>,{' '}
        <button type="button" onClick={() => pick('kayak')}>“kayak”</button> or{' '}
        <button type="button" onClick={() => pick('thursday')}>“thursday”</button>
      </p>
    </form>
  )
}
