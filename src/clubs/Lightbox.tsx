import { useEffect, useRef, type ReactNode } from 'react'

interface LightboxProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Lightbox({ title, onClose, children }: LightboxProps) {
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeButton.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [onClose])

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="lightbox__window">
        <header className="mac-window__bar">
          <button
            ref={closeButton}
            type="button"
            className="lightbox__close"
            onClick={onClose}
            aria-label="Close"
          >
            <i />
          </button>
          <span className="mac-window__lights mac-window__lights--rest" aria-hidden="true">
            <i />
            <i />
          </span>
          <span className="mac-window__title">{title}</span>
        </header>
        <div className="lightbox__body">{children}</div>
      </div>
    </div>
  )
}
