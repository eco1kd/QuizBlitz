import { useEffect, useRef, type ReactNode } from 'react'
import { X, Zap, ArrowUpRight } from 'lucide-react'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <span className="brand-icon">
        <Zap fill="currentColor" size={24} strokeWidth={1.5} />
      </span>
      {!compact && (
        <span>
          quiz<span className="brand-light">blitz</span>
          <span className="brand-dot">.</span>
        </span>
      )}
    </span>
  )
}
export function Dialog({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      className="qb-dialog"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      aria-labelledby="dialog-heading"
    >
      <div className="dialog-body">
        <button
          className="icon-button dialog-close"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X size={22} />
        </button>
        <div className="eyebrow">ИГРАЕМ ВМЕСТЕ</div>
        <h2 id="dialog-heading">{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
        {children}
      </div>
    </dialog>
  )
}
export function Flower({
  className = '',
  children,
}: {
  className?: string
  children?: ReactNode
}) {
  return (
    <span className={`flower ${className}`} aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <path
          d="M50 7C62-7 70 10 73 17C90 10 99 27 88 38C108 47 99 65 85 67C91 85 75 95 63 86C53 105 36 98 33 85C15 93 6 76 15 64C-4 55 3 37 17 34C9 17 26 7 38 16C41 9 45 7 50 7Z"
          fill="currentColor"
        />
      </svg>
      <span>{children}</span>
    </span>
  )
}
export function TopicArt({
  kind,
}: {
  kind: 'space' | 'culture' | 'science' | 'random'
}) {
  if (kind === 'space')
    return (
      <svg viewBox="0 0 160 100" aria-hidden="true">
        <circle cx="85" cy="50" r="31" fill="#a990e9" />
        <ellipse
          cx="85"
          cy="50"
          rx="58"
          ry="14"
          transform="rotate(-25 85 50)"
          fill="none"
          stroke="#4e347d"
          strokeWidth="6"
        />
        <path
          d="m31 18 3 7 7 3-7 3-3 7-3-7-7-3 7-3ZM127 7l2 5 6 2-6 3-2 5-3-5-5-3 5-2Z"
          fill="#4e347d"
        />
      </svg>
    )
  if (kind === 'culture')
    return (
      <svg viewBox="0 0 160 100" aria-hidden="true">
        <path d="M44 25 112 17 122 84 54 92Z" fill="#f19369" />
        <path d="m51 20 61-9-3 20-61 9 3-20Z" fill="#783b22" />
        <path
          d="m60 19 8-1-3 19-8 1m23-22 8-1-3 19-8 1m22-22 8-1-3 19-8 1"
          stroke="#ffd9bd"
          strokeWidth="7"
        />
        <path d="m77 48 22 10-19 15Z" fill="#fff1df" />
      </svg>
    )
  if (kind === 'science')
    return (
      <svg viewBox="0 0 160 100" aria-hidden="true">
        <g
          transform="translate(80 50)"
          fill="none"
          stroke="#326153"
          strokeWidth="3.5"
        >
          <ellipse rx="51" ry="18" />
          <ellipse rx="51" ry="18" transform="rotate(60)" />
          <ellipse rx="51" ry="18" transform="rotate(120)" />
        </g>
        <circle cx="80" cy="50" r="10" fill="#326153" />
        <circle cx="124" cy="59" r="6" fill="#82bba1" />
      </svg>
    )
  return (
    <svg viewBox="0 0 160 100" aria-hidden="true">
      <rect
        x="48"
        y="20"
        width="65"
        height="65"
        rx="18"
        fill="#b49631"
        transform="rotate(-14 80 50)"
      />
      <g fill="#fff6ce">
        <circle cx="61" cy="39" r="5" />
        <circle cx="93" cy="31" r="5" />
        <circle cx="77" cy="51" r="5" />
        <circle cx="66" cy="71" r="5" />
        <circle cx="99" cy="63" r="5" />
      </g>
    </svg>
  )
}
export function ArrowCircle() {
  return (
    <span className="arrow-circle">
      <ArrowUpRight size={19} />
    </span>
  )
}
