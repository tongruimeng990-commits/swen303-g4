import type { ButtonHTMLAttributes, CSSProperties } from 'react'

export type IconKind = 'mov' | 'jpg' | 'note' | 'sticker' | 'folder'

interface DesktopIconProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'style'> {
  kind: IconKind
  label: string
  /** Thumbnail for mov/jpg/sticker icons. */
  image?: string
  alt?: string
  style?: CSSProperties
  onOpen: () => void
}

export function DesktopIcon({ kind, label, image, alt = '', style, onOpen, ...rest }: DesktopIconProps) {
  return (
    <button
      type="button"
      className="desk-icon"
      data-kind={kind}
      {...rest}
      style={style}
      onClick={onOpen}
      aria-label={`Open ${label}`}
    >
      <span className="desk-icon__art" aria-hidden="true">
        {image ? <img src={image} alt={alt} loading="lazy" draggable={false} /> : null}
        {kind === 'mov' ? <i className="desk-icon__play" /> : null}
        {kind === 'folder' ? <i className="desk-icon__tab" /> : null}
      </span>
      <span className="desk-icon__label">{label}</span>
    </button>
  )
}
