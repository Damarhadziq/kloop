import { Img, Sheet } from '@/components/ui'
import { JENIS_OPTIONS, SCAN_ICONS } from '@/services/bill.service'
import type { InputMode, JenisOption } from '@/types'

export const jenisOptions = JENIS_OPTIONS
export type Jenis = JenisOption

function Glyph({ src, size = 24 }: { src: string; size?: number }) {
  return (
    <span className="relative block shrink-0" style={{ width: size, height: size }}>
      <Img src={src} skeleton="rounded-[5px]" />
    </span>
  )
}

export function JenisSheet({
  open,
  mode,
  onClose,
  onSelect,
}: {
  open: boolean
  mode: InputMode
  onClose: () => void
  onSelect: (j: JenisOption) => void
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      labelledBy="jenis-title"
      className="flex flex-col items-center gap-[16px] px-[16px] pt-[8px] pb-[40px]"
    >
      <div className="h-[4px] w-[64px] shrink-0 rounded-[12px] bg-[#dedede]" />
      <div className="flex w-full flex-col gap-[24px]">
        <div className="flex w-full items-center justify-center gap-[10px]">
          <div className="flex min-w-px flex-1 items-center gap-[6px]">
            <p id="jenis-title" className="font-['Outfit:Medium'] text-[18px] leading-[normal] font-medium text-[#054131]">
              Mau bagi tagihan jenis apa?
            </p>
            <div className="flex shrink-0 items-center justify-center rounded-[6px] border border-[#ececec] bg-[#f9f9f9] px-[8px] pb-px">
              <p className="font-['Outfit:Regular'] text-[14px] leading-[18px] font-normal whitespace-nowrap text-[#054131]">
                {mode === 'scan' ? 'Scan' : 'Manual'}
              </p>
            </div>
          </div>
          <button aria-label="Tutup" onClick={onClose} className="shrink-0 rounded-full transition hover:opacity-80">
            <Glyph src={SCAN_ICONS.close} />
          </button>
        </div>
        <div className="stagger flex w-full flex-col gap-[12px]">
          {JENIS_OPTIONS.map((j) => (
            <button
              key={j.id}
              onClick={() => onSelect(j)}
              className="flex w-full items-center gap-[10px] rounded-[14px] border border-[#ececec] bg-[#fefef8] p-[12px] text-left transition duration-200 hover:border-[#a6bb18] hover:bg-[#f8f8ec] active:scale-[0.99]"
            >
              <Glyph src={j.icon} />
              <span className="flex min-w-px flex-1 flex-col gap-[4px] leading-[normal]">
                <span className="font-['Outfit:Medium'] text-[14px] font-medium text-[#a6bb18]">{j.title}</span>
                <span className="font-['Outfit:Regular'] text-[12px] font-normal text-[#8e8e8e]">{j.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  )
}

