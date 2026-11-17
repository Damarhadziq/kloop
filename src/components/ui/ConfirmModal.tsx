import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { usePresence, useScrollLock } from './hooks'

export interface ConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { mounted, closing } = usePresence(open, 200)
  useScrollLock(mounted)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!mounted) return null

  const isDanger = variant === 'danger'

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-[16px] bg-[#054131]/45 backdrop-blur-[2px] ${
        closing ? '[animation:fade-out_200ms_ease-in_forwards]' : '[animation:fade-in_200ms_ease-out]'
      }`}
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full max-w-[360px] flex-col gap-[16px] rounded-[20px] border border-[#ececec] bg-white p-[20px] text-[#054131] shadow-[0_20px_48px_rgba(5,65,49,0.22)] ${
          closing
            ? '[animation:modal-out_200ms_ease-in_forwards]'
            : '[animation:modal-in_260ms_cubic-bezier(0.2,0.8,0.2,1)]'
        }`}
      >
        <div className="flex items-start gap-[12px]">
          <div
            className={`flex size-[40px] shrink-0 items-center justify-center rounded-[12px] ${
              isDanger ? 'bg-[#e5484d]/12 text-[#e5484d]' : 'bg-[#f2f3e6] text-[#a6bb18]'
            }`}
          >
            {isDanger ? (
              /* Hugeicons Delete02 / Alert02 style icon */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path d="M9.5 16.5V10.5M14.5 16.5V10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 8V12.5M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <h3
              id="confirm-modal-title"
              className="font-['Outfit:SemiBold'] text-[16px] leading-[22px] font-semibold tracking-[-0.2px] text-[#054131]"
            >
              {title}
            </h3>
            <p id="confirm-modal-desc" className="font-['Outfit:Regular'] text-[13px] leading-[18px] text-[#8e8e8e]">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-[10px] pt-[4px]">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-[10px] bg-[#f2f3e6] py-[10px] px-[12px] font-['Outfit:Medium'] text-[13px] font-medium text-[#054131] transition hover:bg-[#e8ead2] active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onCancel()
            }}
            className={`flex-1 rounded-[10px] py-[10px] px-[12px] font-['Outfit:Medium'] text-[13px] font-medium text-white transition active:scale-[0.98] ${
              isDanger ? 'bg-[#e5484d] hover:bg-[#d14343]' : 'bg-[#a6bb18] hover:bg-[#97ab12]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
