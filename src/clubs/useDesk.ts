import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'

/**
 * Drag-anywhere desk objects for the club hero. Each object gets a translate
 * offset (`--dx/--dy`) and a stacking order (`--z`), both saved per club in
 * localStorage so the desk looks the way you left it.
 *
 * Mouse and pen only: on phones the hero is a static flow layout.
 */

const DRAG_THRESHOLD = 4
const STORAGE_PREFIX = 'vuwclubs:desk:'

export interface DeskOffset {
  dx: number
  dy: number
}

interface DeskState {
  offsets: Record<string, DeskOffset>
  order: string[]
}

const empty = (): DeskState => ({ offsets: {}, order: [] })

function read(slug: string): DeskState {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + slug)
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as Partial<DeskState>
    return {
      offsets: parsed.offsets && typeof parsed.offsets === 'object' ? parsed.offsets : {},
      order: Array.isArray(parsed.order) ? parsed.order.filter((k) => typeof k === 'string') : [],
    }
  } catch {
    return empty()
  }
}

function write(slug: string, state: DeskState) {
  try {
    if (Object.keys(state.offsets).length === 0) localStorage.removeItem(STORAGE_PREFIX + slug)
    else localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(state))
  } catch {
    // storage unavailable; the desk still works for this visit
  }
}

export interface DeskObjectProps {
  style: CSSProperties
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
  onClickCapture: (event: ReactMouseEvent<HTMLElement>) => void
  'data-dragging'?: true
  'data-moved'?: true
}

export function useDesk(slug: string, containerRef: React.RefObject<HTMLElement | null>) {
  const [state, setState] = useState<DeskState>(() => read(slug))
  const [dragging, setDragging] = useState<string | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  // A click that follows a drag must not open the object.
  const suppressClickFor = useRef<string | null>(null)

  useEffect(() => {
    setState(read(slug))
  }, [slug])

  const commit = useCallback(
    (next: DeskState) => {
      stateRef.current = next
      setState(next)
      write(slug, next)
    },
    [slug],
  )

  const bringToFront = useCallback(
    (key: string) => {
      const current = stateRef.current
      if (current.order[current.order.length - 1] === key) return
      commit({ ...current, order: [...current.order.filter((k) => k !== key), key] })
    },
    [commit],
  )

  const reset = useCallback(() => commit(empty()), [commit])

  const startDrag = useCallback(
    (key: string, event: ReactPointerEvent<HTMLElement>, target: HTMLElement) => {
      if (event.pointerType === 'touch' || event.button !== 0) return
      const container = containerRef.current
      if (!container) return
      // Narrow layouts lay the objects out in a flow; nothing to drag there.
      if (getComputedStyle(container).position === 'static') return

      const startX = event.clientX
      const startY = event.clientY
      const startOffset = stateRef.current.offsets[key] ?? { dx: 0, dy: 0 }
      const rect = target.getBoundingClientRect()
      const bounds = container.getBoundingClientRect()
      // Where the object sits with no offset at all, so we can clamp against the desk.
      const baseLeft = rect.left - startOffset.dx
      const baseTop = rect.top - startOffset.dy
      const minDx = bounds.left - baseLeft
      const maxDx = bounds.right - rect.width - baseLeft
      const minDy = bounds.top - baseTop
      const maxDy = bounds.bottom - rect.height - baseTop

      let moved = false
      let latest = startOffset
      const pointerId = event.pointerId

      const onMove = (move: PointerEvent) => {
        if (move.pointerId !== pointerId) return
        const dx = move.clientX - startX
        const dy = move.clientY - startY
        if (!moved) {
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
          moved = true
          setDragging(key)
          bringToFront(key)
        }
        latest = {
          dx: Math.round(Math.min(maxDx, Math.max(minDx, startOffset.dx + dx))),
          dy: Math.round(Math.min(maxDy, Math.max(minDy, startOffset.dy + dy))),
        }
        setState((s) => ({ ...s, offsets: { ...s.offsets, [key]: latest } }))
      }

      const finish = (up: PointerEvent) => {
        if (up.pointerId !== pointerId) return
        target.removeEventListener('pointermove', onMove)
        target.removeEventListener('pointerup', finish)
        target.removeEventListener('pointercancel', finish)
        try {
          target.releasePointerCapture(pointerId)
        } catch {
          // already released
        }
        if (!moved) return
        setDragging(null)
        // The click that follows this pointerup must not open the object.
        // Cleared by that click, or by the next pointerdown if no click arrives.
        suppressClickFor.current = key
        const current = stateRef.current
        const offsets = { ...current.offsets }
        if (latest.dx === 0 && latest.dy === 0) delete offsets[key]
        else offsets[key] = latest
        commit({ ...current, offsets })
      }

      try {
        target.setPointerCapture(pointerId)
      } catch {
        // capture unsupported; listeners below still work while the pointer stays over the element
      }
      target.addEventListener('pointermove', onMove)
      target.addEventListener('pointerup', finish)
      target.addEventListener('pointercancel', finish)
    },
    [bringToFront, commit, containerRef],
  )

  /**
   * Props for one desk object. `handle` restricts where a drag may start
   * (e.g. a window's title bar); clicks anywhere else pass straight through.
   */
  const objectProps = useCallback(
    (key: string, options: { handle?: string; style?: CSSProperties } = {}): DeskObjectProps => {
      const offset = state.offsets[key]
      const z = state.order.indexOf(key)
      const style = {
        ...options.style,
        '--dx': offset ? `${offset.dx}px` : undefined,
        '--dy': offset ? `${offset.dy}px` : undefined,
        '--z': z >= 0 ? z + 2 : undefined,
      } as CSSProperties
      return {
        style,
        onPointerDown: (event) => {
          const element = event.currentTarget
          suppressClickFor.current = null
          if (options.handle) {
            const from = event.target as HTMLElement | null
            if (!from?.closest(options.handle)) return
          }
          startDrag(key, event, element)
        },
        onClickCapture: (event) => {
          if (suppressClickFor.current !== key) return
          suppressClickFor.current = null
          event.preventDefault()
          event.stopPropagation()
        },
        'data-dragging': dragging === key || undefined,
        'data-moved': offset ? true : undefined,
      }
    },
    [state, dragging, startDrag],
  )

  return {
    objectProps,
    reset,
    moved: Object.keys(state.offsets).length > 0,
    dragging: dragging !== null,
  }
}
