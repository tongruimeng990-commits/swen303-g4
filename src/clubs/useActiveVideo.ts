import { useCallback, useEffect, useRef, useState } from 'react'

const RELEASE_DELAY_MS = 150

/**
 * One video window is "active" (focused and enlarged) at a time.
 * Leaving a window schedules a collapse; entering another cancels it and
 * switches immediately, so moving between cards never flickers.
 */
export function useActiveVideo() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  const clearTimer = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }

  const focus = useCallback((id: string) => {
    clearTimer()
    setActiveId(id)
  }, [])

  const release = useCallback((id: string) => {
    clearTimer()
    timer.current = window.setTimeout(() => {
      timer.current = null
      setActiveId((current) => (current === id ? null : current))
    }, RELEASE_DELAY_MS)
  }, [])

  const dismiss = useCallback(() => {
    clearTimer()
    setActiveId(null)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      clearTimer()
    }
  }, [dismiss])

  return { activeId, focus, release, dismiss }
}
