import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { usePresence, useScrollLock } from './hooks'

/** Bottom sheet with backdrop, Escape-to-close and enter/exit animation. */
export function Sheet({
  open,
  onClose,
  labelledBy,
  className = '',
  children,
}: {
  open: boolean
  onClose: () => void
  labelledBy?: string
  className?: string
  children: ReactNode
}) {
  const { mounted, closing } = usePresence(open, 260)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useScrollLock(mounted)

  if (!mounted) return null
  // Rendered into <body>: screens animate with `transform`, which would otherwise
  // turn `fixed` into "fixed to the scrolling page" and push the sheet off-screen.
  return createPortal(
    <div
      className={`fixed inset-0 z-40 flex items-end justify-center overscroll-none bg-[#054131]/30 ${
        closing ? '[animation:fade-out_260ms_ease-in_forwards]' : '[animation:fade-in_220ms_ease-out]'
      }`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[calc(100dvh-24px)] w-full max-w-[560px] overflow-y-auto overscroll-contain rounded-t-[24px] bg-white ${className} ${
          closing
            ? '[animation:sheet-down_260ms_cubic-bezier(0.4,0,1,1)_forwards]'
            : '[animation:sheet-up_360ms_cubic-bezier(0.2,0.8,0.2,1)]'
        }`}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

