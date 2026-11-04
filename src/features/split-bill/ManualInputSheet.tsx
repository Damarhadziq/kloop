import { useRef, type FormEvent } from 'react'
import { Sheet } from '@/components/ui'
import type { JenisOption } from '@/types'

export function ManualInputSheet({
  open,
  jenis,
  onClose,
  onQuickSave,
  onOpenDetailedSplit,
}: {
  open: boolean
  jenis: JenisOption
  onClose: () => void
  onQuickSave: (title: string, total: number) => void
  onOpenDetailedSplit: (title: string, total: number) => void
}) {
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const title = String(data.get('title') || '').trim()
    const total = Number(String(data.get('total') || '').replace(/\D/g, ''))
    if (!title || !total) return
    onQuickSave(title, total)
  }

  const handleOpenDetailed = () => {
    const form = formRef.current
    if (!form) return
    const data = new FormData(form)
    const title = String(data.get('title') || '').trim() || 'Pengeluaran Baru'
    const total = Number(String(data.get('total') || '').replace(/\D/g, '')) || 0
    onOpenDetailedSplit(title, total)
  }

  return (
    <Sheet open={open} onClose={onClose} labelledBy="manual-title">
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-[14px] p-[20px] pt-[8px] pb-[32px]">
        <div className="mx-auto h-[4px] w-[64px] shrink-0 rounded-[12px] bg-[#dedede]" />
        <div className="flex items-center justify-between gap-[6px] pt-[8px]">
          <div className="flex items-center gap-[6px]">
            <p id="manual-title" className="font-['Outfit:Medium'] text-[18px] font-medium tracking-[-0.2px]">
              Input manual
            </p>
            <span className="rounded-[6px] border border-[#ececec] bg-[#f9f9f9] px-[8px] pb-px font-['Outfit:Regular'] text-[14px] leading-[18px] text-[#054131]">
              {jenis.title}
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenDetailed}
            className="font-['Outfit:Medium'] text-[12px] font-medium text-[#a6bb18] transition hover:underline"
          >
            Atur Per Menu →
          </button>
        </div>
        <label className="flex flex-col gap-[6px] font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
          Nama tempat
          <input
            name="title"
            required
            autoFocus
            placeholder="cth. Kopi Nako Tembalang"
            className="rounded-[8px] border border-[#ececec] px-[12px] py-[10px] text-[14px] text-[#054131] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#a6bb18] focus:shadow-[0_0_0_3px_rgba(166,187,24,0.14)]"
          />
        </label>
        <label className="flex flex-col gap-[6px] font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
          Total (Rp)
          <input
            name="total"
            required
            inputMode="numeric"
            placeholder="185000"
            className="rounded-[8px] border border-[#ececec] px-[12px] py-[10px] text-[14px] text-[#054131] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#a6bb18] focus:shadow-[0_0_0_3px_rgba(166,187,24,0.14)]"
          />
        </label>
        <div className="flex gap-[10px] pt-[4px]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[8px] bg-[#f2f3e6] py-[10px] font-['Outfit:Medium'] text-[14px] font-medium text-[#a6bb18] transition duration-200 hover:bg-[#e8ead2] active:scale-[0.98]"
          >
            Batal
          </button>
          <button
            type="submit"
            className="flex-1 rounded-[8px] bg-[#a6bb18] py-[10px] font-['Outfit:Medium'] text-[14px] font-medium text-white transition duration-200 hover:bg-[#97ab12] active:scale-[0.98]"
          >
            Simpan
          </button>
        </div>
      </form>
    </Sheet>
  )
}

