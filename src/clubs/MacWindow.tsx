import type { ReactNode, CSSProperties } from 'react'

interface MacWindowProps {
  title: string
  id?: string
  className?: string
  style?: CSSProperties
  children: ReactNode
}

export function MacWindow({ title, id, className, style, children }: MacWindowProps) {
  return (
    <section id={id} className={['mac-window', className].filter(Boolean).join(' ')} style={style}>
      <header className="mac-window__bar">
        <span className="mac-window__lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <h2 className="mac-window__title">{title}</h2>
      </header>
      <div className="mac-window__body">{children}</div>
    </section>
  )
}
