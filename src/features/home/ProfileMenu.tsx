import { useEffect, useRef } from 'react'
import { Img, usePresence } from '@/components/ui'
import { HOME_IMAGES } from '@/services/bill.service'
import type { Session } from '@/types'

export function ProfileMenu({
  open,
  onToggle,
  onClose,
  session,
  onLogout,
}: {
  open: boolean
  onToggle: () => void
  onClose: () => void
  session: Session
  onLogout: () => void
}) {
  const { mounted, closing } = usePresence(open, 180)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && onClose()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Profil"
        aria-expanded={open}
        onClick={onToggle}
        className="relative block size-[40px] shrink-0 rounded-full transition duration-200 hover:opacity-80 active:scale-95"
      >
        <Img src={HOME_IMAGES.profile} skeleton="rounded-full" />
      </button>
      {mounted && (
        <div
          role="menu"
          className={`absolute top-[48px] left-0 w-[220px] origin-top-left rounded-[12px] border border-[#ececec] bg-white p-[6px] shadow-[0_12px_32px_rgba(5,65,49,0.12)] ${
            closing ? '[animation:menu-out_180ms_ease-in_forwards]' : '[animation:menu-in_220ms_cubic-bezier(0.2,0.8,0.2,1)]'
          }`}
        >
          <div className="px-[10px] pt-[8px] pb-[10px]">
            <p className="truncate font-['Outfit:Medium'] text-[14px] leading-[normal] font-medium text-[#054131]">
              {session.name}
            </p>
            {session.phone && (
              <p className="mt-[2px] truncate font-['Outfit:Regular'] text-[12px] leading-[normal] text-[#8e8e8e]">
                {session.phone}
              </p>
            )}
          </div>
          <div className="h-px bg-[#ececec]" />
          <button
            role="menuitem"
            onClick={onLogout}
            className="mt-[6px] w-full rounded-[8px] px-[10px] py-[8px] text-left font-['Outfit:Regular'] text-[14px] text-[#d14343] transition-colors duration-200 hover:bg-[#fdf1f1]"
          >
            Keluar
          </button>
        </div>
      )}
    </div>
  )
}

