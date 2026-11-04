import { Icon, Img, useCountUp } from '@/components/ui'
import { HOME_IMAGES, INITIAL_TALANGAN, formatRupiah } from '@/services/bill.service'
import type { TalanganSummary } from '@/types'

export function StatusTalanganCard({
  tab,
  onTabChange,
  tagihanPaid,
  reminded,
  onRemind,
  onPay,
  talangan = INITIAL_TALANGAN,
}: {
  tab: 'masuk' | 'tagihan'
  onTabChange: (t: 'masuk' | 'tagihan') => void
  tagihanPaid: boolean
  reminded: boolean
  onRemind: () => void
  onPay: () => void
  talangan?: TalanganSummary
}) {
  const isMasuk = tab === 'masuk'
  const tagihanAmount = tagihanPaid ? 0 : talangan.tagihan.amount
  const amount = useCountUp(isMasuk ? talangan.masuk.amount : tagihanAmount)
  const counts = { masuk: talangan.masuk.count, tagihan: talangan.tagihan.count }

  return (
    <section className="flex flex-col gap-[12px] px-[16px] md:px-0">
      <h2 className="font-['Outfit:Medium'] text-[18px] leading-[normal] font-medium tracking-[-0.2px]">
        Status Talangan
      </h2>
      <div className="flex w-full flex-col rounded-[12px] border border-[#ececec] bg-white p-[12px]">
        <div className="flex w-full flex-col gap-[14px]">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-[4px]">
              <Icon src={HOME_IMAGES.cashOut} size={18} />
              <p
                key={tab}
                className="font-['Outfit:Regular'] text-[14px] leading-[normal] font-normal whitespace-nowrap text-[#054131] [animation:fade-up_260ms_ease-out]"
              >
                {isMasuk ? 'Perlu Ditagih' : 'Kamu Ditagih'}
              </p>
            </div>
            <div role="tablist" className="flex items-center gap-[10px] rounded-[8px] bg-white">
              {(['masuk', 'tagihan'] as const).map((key) => {
                const active = tab === key
                return (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => onTabChange(key)}
                    className={`flex items-center justify-center gap-[6px] rounded-[6px] py-[4px] pr-[4px] pl-[8px] transition-colors duration-200 ${
                      active
                        ? `bg-[#a6bb18] ${key === 'tagihan' ? 'border-[0.5px] border-[#ececec]' : ''}`
                        : 'border-[0.5px] border-[#ececec] bg-white hover:bg-[#fafaf3]'
                    }`}
                  >
                    <span
                      className={`font-['Outfit:Regular'] text-[12px] leading-[normal] font-normal whitespace-nowrap transition-colors duration-200 ${
                        active ? 'text-white' : 'text-[#8e8e8e]'
                      }`}
                    >
                      {key === 'masuk' ? 'Uang Masuk' : 'Tagihan'}
                    </span>
                    <span
                      className={`flex size-[16px] items-center justify-center rounded-[4px] text-center font-['Outfit:Regular'] text-[12px] leading-[normal] font-normal transition-colors duration-200 ${
                        active ? 'bg-white text-[#a6bb18]' : 'bg-[#f2f3e6] text-[#8e8e8e]'
                      }`}
                    >
                      {counts[key]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-[10px]">
              <p
                aria-live="polite"
                className="truncate font-['Outfit:SemiBold'] text-[32px] leading-[normal] font-semibold text-[#054131] tabular-nums"
              >
                {formatRupiah(amount)}
              </p>
              <div
                key={`${tab}-${tagihanPaid}`}
                className="flex h-[24px] min-w-0 items-center gap-[6px] [animation:fade-up_260ms_ease-out]"
              >
                {isMasuk && (
                  <div className="flex shrink-0 items-center">
                    {HOME_IMAGES.stack.map((s, i, arr) => (
                      <span
                        key={s}
                        className={`relative block size-[24px] shrink-0 ${i < arr.length - 1 ? 'mr-[-12px]' : ''}`}
                      >
                        <Img src={s} skeleton="rounded-full ring-2 ring-white" />
                      </span>
                    ))}
                  </div>
                )}
                <p className="truncate font-['Outfit:Regular'] text-[14px] leading-[normal] font-normal text-[#8e8e8e]">
                  {isMasuk ? talangan.masuk.note : tagihanPaid ? 'Semua tagihan sudah lunas' : talangan.tagihan.note}
                </p>
              </div>
            </div>

            {isMasuk ? (
              <button
                key="remind"
                onClick={onRemind}
                className="flex shrink-0 items-center gap-[6px] rounded-[8px] bg-[#f2f3e6] px-[14px] py-[8px] transition hover:bg-[#e8ead2] active:scale-[0.98] [animation:fade-up_260ms_ease-out]"
              >
                <Icon src={HOME_IMAGES.bell} size={18} />
                <span className="font-['Outfit:Medium'] text-[14px] leading-[normal] font-medium whitespace-nowrap text-[#a6bb18]">
                  {reminded ? 'Terkirim' : 'Ingatkan'}
                </span>
              </button>
            ) : (
              <button
                key="pay"
                onClick={onPay}
                disabled={tagihanPaid}
                className="flex shrink-0 items-center rounded-[8px] bg-[#f2f3e6] px-[14px] py-[8px] transition hover:bg-[#e8ead2] active:scale-[0.98] disabled:cursor-default disabled:opacity-60 disabled:hover:bg-[#f2f3e6] [animation:fade-up_260ms_ease-out]"
              >
                <span className="font-['Outfit:Medium'] text-[14px] leading-[normal] font-medium whitespace-nowrap text-[#a6bb18]">
                  {tagihanPaid ? 'Lunas' : 'Bayar Sekarang'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

