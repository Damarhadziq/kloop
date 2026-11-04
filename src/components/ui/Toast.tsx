import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePresence } from './hooks'

export function Toast({ message }: { message: string | null }) {
  const [last, setLast] = useState(message)
  const { mounted, closing } = usePresence(!!message, 200)
  useEffect(() => {
    if (message) setLast(message)
  }, [message])
  if (!mounted || !last) return null
  // Portalled so animated (transformed) ancestors cannot re-anchor `fixed`.
  return createPortal(
    <div
      role="status"
      className={`fixed bottom-[24px] left-1/2 z-50 max-w-[calc(100vw-32px)] rounded-[10px] bg-[#054131] px-[16px] py-[10px] text-center font-['Outfit:Regular'] text-[14px] text-white shadow-lg ${
        closing ? '[animation:toast-out_200ms_ease-in_forwards]' : '[animation:toast-in_260ms_cubic-bezier(0.2,0.8,0.2,1)]'
      }`}
      style={{ transform: 'translateX(-50%)' }}
    >
      {last}
    </div>,
    document.body,
  )
}

