import { Icon, Img } from '@/components/ui'
import { HOME_IMAGES } from '@/services/bill.service'
import type { InputMode } from '@/types'

export function HeroActionCard({ onOpenJenis }: { onOpenJenis: (mode: InputMode) => void }) {
  return (
    <section className="flex items-center gap-[20px] px-[16px]">
      <div className="relative h-[110px] w-[96px] shrink-0">
        <Img src={HOME_IMAGES.illustration} skeleton="rounded-[14px]" />
      </div>
      <div className="flex min-w-px flex-1 flex-col gap-[16px]">
        <div className="flex flex-col gap-[6px]">
          <p className="font-['Outfit:Medium'] text-[16px] leading-[normal] font-medium">
            Ada pengeluaran bareng baru?
          </p>
          <p className="max-w-[254px] font-['Outfit:Regular'] text-[12px] leading-[18px] font-normal text-[#8e8e8e]">
            Foto struk belanja, resto, atau tiket biar sistem yang bagiin nominalnya secara adil.
          </p>
        </div>
        <div className="flex w-full items-center gap-[10px]">
          <button
            type="button"
            onClick={() => onOpenJenis('manual')}
            className="flex shrink-0 items-center justify-center gap-[6px] rounded-[8px] border border-[#ececec] bg-[#fefef8] px-[12px] py-[8px] transition hover:border-[#a6bb18] hover:bg-[#f2f3e6] active:scale-[0.98]"
          >
            <Icon src={HOME_IMAGES.docAdd} size={16} />
            <span className="font-['Outfit:Medium'] text-[13px] leading-[normal] font-medium whitespace-nowrap text-[#a6bb18]">
              Input manual
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenJenis('scan')}
            className="flex min-w-px flex-1 items-center justify-center gap-[6px] rounded-[8px] bg-[#a6bb18] px-[14px] py-[8px] transition hover:bg-[#97ab12] active:scale-[0.98]"
          >
            <Icon src={HOME_IMAGES.scan} size={16} />
            <span className="font-['Outfit:Medium'] text-[13px] leading-[normal] font-medium whitespace-nowrap text-white">
              Foto Bill
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}
