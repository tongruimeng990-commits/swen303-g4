import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { requestSearch, SEARCH_DOCK_ID, SEARCH_EVENT, type SearchRequest } from '../lib/search'
import { clubListUrl } from '../lib/routes'

/** Where the pill's centre wants to be, as a share of the screen's height. */
const CENTRE = 0.54
const GAP_BELOW_TITLE = 36
const LIVE_DELAY_MS = 300
/** The sheet may come this close to the pill's underside before it moves. */
const DOCK_SLACK = 8
/** Scrolling back up: the pill returns once the slot is this far below the fold. */
const UNDOCK_SLACK = 40
const FLIGHT_MS = 520
const FLIGHT_EASE = 'cubic-bezier(0.2, 0.7, 0.2, 1)'

/** The parts that change look between the hero pill and the docked box, and what changes. */
const LOOK: Record<string, string[]> = {
  '.hero-search__field': ['height', 'borderRadius', 'backgroundColor', 'borderColor', 'color'],
  '.hero-search__field input': ['fontSize', 'color', 'paddingLeft'],
  '.hero-search__glass': ['left', 'width', 'height', 'color'],
  '.hero-search__go': ['width', 'minWidth', 'height', 'paddingLeft', 'paddingRight', 'borderRadius', 'backgroundColor', 'color', 'fontSize'],
}
type Look = Record<string, Keyframe>

function lookOf(form: HTMLElement): Look {
  const look: Look = {}
  for (const [selector, props] of Object.entries(LOOK)) {
    const el = form.querySelector(selector)
    if (!el) continue
    const style = getComputedStyle(el)
    look[selector] = Object.fromEntries(props.map((prop) => [prop, style[prop as keyof CSSStyleDeclaration] as string]))
  }
  return look
}

/**
 * The one search box on the page. On the first screen it is the centre of the
 * picture, drawn above the poster trail so it is always clickable; the trail
 * itself is untouched and keeps running behind it. As the club list slides up
 * under it, the box flies down into the slot in the list's filter bar and
 * rides along with it; scroll back and it returns to the middle. Typing
 * filters the list live; Enter or the arrow scrolls down to the list.
 */
export function HeroSearch({ listOnly = false }: { listOnly?: boolean }) {
  const id = useId()
  const formRef = useRef<HTMLFormElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [top, setTop] = useState<number | null>(listOnly ? 0 : null)
  const [value, setValue] = useState(() => listOnly ? new URLSearchParams(window.location.search).get('q') ?? '' : '')
  const [docked, setDocked] = useState(listOnly)
  const dockedRef = useRef(listOnly)
  dockedRef.current = docked
  const timer = useRef<number | null>(null)
  /** The form's height while it sits in the hero, so the return trip is measured right. */
  const heroHeight = useRef(0)
  /** Where the form was just before it changed homes; drives the flight. */
  const flight = useRef<{ from: DOMRect; focused: boolean; look: Look } | null>(null)
  const [dockTarget, setDockTarget] = useState<HTMLElement | null>(null)

  // The separate list has no hero measurement to cause a second render.
  // Resolve its portal after all DOM nodes (including the filter slot) exist.
  useLayoutEffect(() => {
    setDockTarget(docked ? document.getElementById(SEARCH_DOCK_ID) : null)
  }, [docked])

  // Centre of the screen, unless the VUW mark (left of centre, above) reaches
  // down that far on a short window — then sit just under it. Layout boxes
  // (offset*, summed up to the screen), so the scroll-driven transforms on
  // the heading do not shift the measurement.
  useEffect(() => {
    if (listOnly) return
    const heading = document.querySelector<HTMLElement>('.hero-heading')
    const anchor = heading?.querySelector<HTMLElement>('[data-search-anchor]') ?? heading
    const screen = heading?.offsetParent as HTMLElement | null
    if (!heading || !anchor || !screen) return
    const topWithin = (el: HTMLElement) => {
      let top = 0
      for (let node: HTMLElement | null = el; node && node !== screen; node = node.offsetParent as HTMLElement | null) {
        top += node.offsetTop
      }
      return top
    }
    const measure = () => {
      const form = formRef.current
      if (form && !dockedRef.current) heroHeight.current = form.offsetHeight
      const centred = screen.offsetHeight * CENTRE - heroHeight.current / 2
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
  }, [listOnly])

  // Docking: the pill leaves the hero when the sheet reaches its underside, or
  // when the filter bar's slot comes into view — whichever is first. It comes
  // back when the slot has gone below the fold again.
  useEffect(() => {
    if (top === null || listOnly) return
    const sheet = document.querySelector<HTMLElement>('.clubs-sheet')
    const slot = document.getElementById(SEARCH_DOCK_ID)
    if (!sheet || !slot) return
    const update = () => {
      const fold = window.innerHeight
      const sheetTop = sheet.getBoundingClientRect().top
      const slotTop = slot.getBoundingClientRect().top
      const heroBottom = top + heroHeight.current
      const next = dockedRef.current
        ? !(slotTop > fold + UNDOCK_SLACK && sheetTop > heroBottom + UNDOCK_SLACK)
        : slotTop < fold - 16 || sheetTop < heroBottom - DOCK_SLACK
      if (next === dockedRef.current) return
      const form = formRef.current
      if (form) flight.current = { from: form.getBoundingClientRect(), focused: form.contains(document.activeElement), look: lookOf(form) }
      dockedRef.current = next
      setDocked(next)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [top, listOnly])

  // The flight between homes: the new element starts where the old one was
  // and settles into place (FLIP). Focus carries over if it had it.
  useLayoutEffect(() => {
    const form = formRef.current
    const trip = flight.current
    flight.current = null
    if (!form || !trip) return
    if (trip.focused) {
      const input = inputRef.current
      input?.focus({ preventScroll: true })
      const end = input?.value.length ?? 0
      input?.setSelectionRange?.(end, end)
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const to = form.getBoundingClientRect()
    if (to.width === 0 || trip.from.width === 0) return
    // One box travelling and reshaping, not two boxes swapping: the form moves
    // from where it was and resizes (no scaling, so the text never stretches),
    // while the field, button and text tween from the old look to the new one.
    // In the hero the form is centred with translateX(-50%) of its own width,
    // so a changing width there needs the offset corrected.
    const base = getComputedStyle(form).transform
    const rest = base === 'none' ? '' : `${base} `
    const centred = !docked
    const dx = trip.from.left - to.left - (centred ? (to.width - trip.from.width) / 2 : 0)
    const dy = trip.from.top - to.top
    const timing = { duration: FLIGHT_MS, easing: FLIGHT_EASE }
    // Hold the form's layout box at its final height so the bar under it does
    // not grow and shrink while the field animates.
    form.style.height = `${form.offsetHeight}px`
    const move = form.animate(
      [
        { transform: `${rest}translate(${dx}px, ${dy}px)`, width: `${trip.from.width}px` },
        { transform: base, width: `${to.width}px` },
      ],
      timing,
    )
    const settle = () => form.style.removeProperty('height')
    move.onfinish = settle
    move.oncancel = settle
    const look = lookOf(form)
    for (const [selector, before] of Object.entries(trip.look)) {
      const el = form.querySelector(selector)
      if (el && look[selector]) el.animate([before, look[selector]], timing)
    }
  }, [docked])

  // The list cleared its filters: empty the box too.
  useEffect(() => {
    const onSearch = (event: Event) => {
      const detail = (event as CustomEvent<SearchRequest>).detail
      if (detail?.origin === 'list') setValue(detail.query)
    }
    window.addEventListener(SEARCH_EVENT, onSearch)
    return () => window.removeEventListener(SEARCH_EVENT, onSearch)
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
    if (!listOnly) {
      window.location.assign(clubListUrl(query))
      return
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

  const form = (
    <form
      ref={formRef}
      className="hero-search"
      role={docked ? undefined : 'search'}
      aria-label={docked ? undefined : 'Search clubs'}
      style={{ '--hero-search-top': top === null ? undefined : `${top}px` } as CSSProperties}
      data-ready={top !== null || undefined}
      data-docked={docked || undefined}
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
          ref={inputRef}
          id={id}
          type="search"
          value={value}
          placeholder={docked ? 'Search by name, activity or day' : 'Search clubs, events, or interests…'}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="submit" className="hero-search__go" aria-label="Search and show the list">
          Search
        </button>
      </div>
      <p className="hero-search__hint">
        try <button type="button" onClick={() => pick('debate')}>“debate”</button>,{' '}
        <button type="button" onClick={() => pick('kayak')}>“kayak”</button> or{' '}
        <button type="button" onClick={() => pick('thursday')}>“thursday”</button>
      </p>
    </form>
  )

  if (!docked) return form
  // During a home-page docking flight the slot already exists: move into it
  // in this render so the FLIP/focus layout effect sees the final DOM node.
  // On a direct /clubs load, dockTarget supplies the post-mount retry.
  const slot = document.getElementById(SEARCH_DOCK_ID) ?? dockTarget
  return slot ? createPortal(form, slot) : form
}
