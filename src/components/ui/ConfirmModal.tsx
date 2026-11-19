import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { usePresence, useScrollLock } from './hooks'

export const MODAL_BG_PATTERN = '/assets/bg-pembagian-menu.svg'
export const MODAL_DELETE_ICON = '/assets/delete-icon-circle.svg'

export interface ConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  iconSrc?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  variant = 'danger',
  iconSrc = MODAL_DELETE_ICON,
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
        className={`relative flex w-full max-w-[366px] flex-col gap-[20px] overflow-hidden rounded-[24px] border border-[#ececec] bg-white p-[20px] text-[#054131] shadow-[0_20px_48px_rgba(5,65,49,0.22)] ${
          closing
            ? '[animation:modal-out_200ms_ease-in_forwards]'
            : '[animation:modal-in_260ms_cubic-bezier(0.2,0.8,0.2,1)]'
        }`}
      >
        {/* Subtle Kloop diagonal watermark pattern background */}
        <img
          src={MODAL_BG_PATTERN}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full object-cover select-none"
        />

        {/* Content layer */}
        <div className="relative z-10 flex flex-col gap-[12px]">
          <div className="flex items-center gap-[12px]">
            <img
              src={iconSrc}
              alt=""
              aria-hidden
              className="size-[42px] shrink-0 rounded-full"
            />
            <h3
              id="confirm-modal-title"
              className="font-['Outfit:Medium'] text-[18px] leading-[23px] font-medium tracking-[-0.2px] text-[#054131]"
            >
              {title}
            </h3>
          </div>
          <p
            id="confirm-modal-desc"
            className="font-['Outfit:Regular'] text-[14px] leading-[21px] font-normal tracking-[-0.1px] text-[#8e8e8e]"
          >
            {description}
          </p>
        </div>

        {/* Bottom Action Buttons */}
        <div className="relative z-10 grid grid-cols-2 gap-[10px]">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-[46px] items-center justify-center rounded-[12px] bg-[#f2f3e6] px-[14px] font-['Outfit:Medium'] text-[15px] font-medium text-[#a6bb18] transition hover:bg-[#e8ead2] active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onCancel()
            }}
            className={`flex h-[46px] items-center justify-center rounded-[12px] px-[14px] font-['Outfit:Medium'] text-[15px] font-medium text-white transition active:scale-[0.98] ${
              isDanger ? 'bg-[#ff0000] hover:bg-[#e00000]' : 'bg-[#a6bb18] hover:bg-[#97ab12]'
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
