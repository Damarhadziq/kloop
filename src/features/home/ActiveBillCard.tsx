import { Icon, Img } from '@/components/ui'
import { HOME_IMAGES, formatRupiah } from '@/services/bill.service'
import type { Bill } from '@/types'

export function ActiveBillCard({
  bill,
  reminded,
  onRemind,
  onTogglePaid,
  onOpenDetail,
}: {
  bill: Bill
  reminded: Record<string, boolean>
  onRemind: (billId: string, name: string) => void
  onTogglePaid: (billId: string, name: string) => void
  onOpenDetail?: (bill: Bill) => void
}) {
  const paidCount = bill.participants.filter((p) => p.paid).length
  return (
    <div className="flex w-full flex-col gap-[12px] rounded-[10px] border border-[#ececec] bg-white p-[12px] [animation:fade-up_360ms_cubic-bezier(0.2,0.8,0.2,1)_both]">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-center gap-[4px]">
          <Icon src={HOME_IMAGES.chefHat} size={18} />
          <p className="font-['Outfit:Medium'] text-[14px] leading-[normal] font-medium tracking-[-0.2px] whitespace-nowrap text-[#2233f5]">
            {bill.category}
          </p>
        </div>
        <p className="font-['Outfit:Regular'] text-[12px] leading-[normal] font-normal tracking-[-0.2px] whitespace-nowrap text-[#8e8e8e]">
          {bill.time}
        </p>
      </div>
      <div
        onClick={() => onOpenDetail?.(bill)}
        role={onOpenDetail ? 'button' : undefined}
        tabIndex={onOpenDetail ? 0 : undefined}
        onKeyDown={(e) => {
          if (onOpenDetail && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onOpenDetail(bill)
          }
        }}
        className={`flex items-center justify-between gap-2 font-['Outfit:Medium'] leading-[normal] font-medium tracking-[-0.2px] ${
          onOpenDetail ? 'cursor-pointer rounded-[6px] transition hover:opacity-80' : ''
        }`}
      >
        <p className="truncate text-[16px]">{bill.title}</p>
        <p className="shrink-0 text-[20px]">{formatRupiah(bill.total)}</p>
      </div>
      <div className="relative h-0 w-full">
        <div className="absolute inset-[-2px_0_0_0]">
          <img alt="" className="block size-full max-w-none" src={HOME_IMAGES.dashedLine} />
        </div>
      </div>
      <div className="flex flex-col gap-[8px]">
        <div className="flex items-center justify-between">
          <p className="font-['Outfit:Regular'] text-[12px] leading-[normal] font-normal tracking-[-0.2px] text-[#a6bb18]">
            {paidCount === bill.participants.length
              ? 'Semua sudah lunas'
              : `${paidCount} dari ${bill.participants.length} sudah lunas`}
          </p>
          {onOpenDetail && (
            <button
              type="button"
              onClick={() => onOpenDetail(bill)}
              className="font-['Outfit:Regular'] text-[12px] leading-[normal] font-normal text-[#8e8e8e] transition hover:text-[#a6bb18]"
            >
              Rincian →
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-[12px]">
          {bill.participants.map((p) => {
            const key = `${bill.id}-${p.name}`
            return (
              <div key={p.name} className="flex min-w-0 items-center gap-[6px]">
                <button
                  onClick={() => onTogglePaid(bill.id, p.name)}
                  title={p.paid ? 'Tandai belum lunas' : 'Tandai lunas'}
                  className="flex min-w-0 items-center gap-[6px] rounded-[4px] hover:opacity-80"
                >
                  <Icon src={p.avatarUrl} size={24} round />
                  <span
                    className={`truncate font-['Outfit:Regular'] text-[14px] leading-[normal] font-normal tracking-[-0.2px] whitespace-nowrap ${
                      p.paid ? 'text-[#2acb70]' : 'text-[#054131]'
                    }`}
                  >
                    {p.name}
                  </span>
                </button>
                {p.paid ? (
                  <span className="relative size-[20px] shrink-0 overflow-clip">
                    <span className="absolute inset-[8.33%]">
                      <Img src={HOME_IMAGES.verified} alt="Lunas" skeleton="rounded-full" />
                    </span>
                  </span>
                ) : (
                  <button
                    aria-label={`Ingatkan ${p.name}`}
                    onClick={() => onRemind(bill.id, p.name)}
                    className={`flex shrink-0 items-center rounded-[6px] p-[4px] transition ${
                      reminded[key] ? 'bg-[#a6bb18]/25' : 'bg-[#f2f3e6] hover:bg-[#e8ead2]'
                    }`}
                  >
                    <Icon src={HOME_IMAGES.bellSmall} size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

