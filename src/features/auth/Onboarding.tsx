import { Icon, Img, LogoLoader } from '@/components/ui'
import { HOME_IMAGES, INITIAL_BILLS, INITIAL_TALANGAN, formatRupiah } from '@/services/bill.service'

export function Splash({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-white">
      <LogoLoader ready={ready} onDone={onDone} />
    </div>
  )
}

function HeroBillPreview() {
  const bill = INITIAL_BILLS[0]
  return (
    <div className="pointer-events-none flex size-full flex-col justify-between rounded-[10px] border border-[#ececec] bg-white p-[10px] text-[#054131] select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[4px]">
          <Icon src={HOME_IMAGES.chefHat} size={15} />
          <p className="font-['Outfit:Medium'] text-[12px] leading-[normal] font-medium tracking-[-0.2px] whitespace-nowrap text-[#2233f5]">
            {bill.category}
          </p>
        </div>
        <p className="font-['Outfit:Regular'] text-[10px] leading-[normal] font-normal tracking-[-0.2px] whitespace-nowrap text-[#8e8e8e]">
          {bill.time}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 font-['Outfit:Medium'] leading-[normal] font-medium tracking-[-0.2px]">
        <p className="truncate text-[14px]">{bill.title}</p>
        <p className="shrink-0 text-[16px]">{formatRupiah(bill.total)}</p>
      </div>
      <div className="relative h-0 w-full">
        <div className="absolute inset-[-1px_0_0_0]">
          <img alt="" className="block size-full max-w-none" src={HOME_IMAGES.dashedLine} />
        </div>
      </div>
      <div className="flex flex-col gap-[6px]">
        <p className="font-['Outfit:Regular'] text-[10px] leading-[normal] font-normal tracking-[-0.2px] text-[#a6bb18]">
          3 dari 5 sudah lunas
        </p>
        <div className="grid grid-cols-3 gap-[8px]">
          {bill.participants.map((p) => (
            <div key={p.name} className="flex min-w-0 items-center gap-[4px]">
              <Icon src={p.avatarUrl} size={18} round />
              <span
                className={`truncate font-['Outfit:Regular'] text-[11px] leading-[normal] font-normal tracking-[-0.2px] ${
                  p.paid ? 'text-[#2acb70]' : 'text-[#054131]'
                }`}
              >
                {p.name}
              </span>
              {p.paid ? (
                <span className="relative size-[14px] shrink-0 overflow-clip">
                  <span className="absolute inset-[8.33%]">
                    <Img src={HOME_IMAGES.verified} skeleton="rounded-full" />
                  </span>
                </span>
              ) : (
                <span className="flex shrink-0 items-center rounded-[4px] bg-[#f2f3e6] p-[3px]">
                  <Icon src={HOME_IMAGES.bellSmall} size={10} />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HeroTalanganPreview({ mode }: { mode: 'masuk' | 'tagihan' }) {
  const isMasuk = mode === 'masuk'
  return (
    <div className="pointer-events-none flex size-full flex-col justify-between rounded-[12px] border border-[#ececec] bg-white p-[12px] text-[#054131] select-none">
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-[4px]">
          <Icon src={HOME_IMAGES.cashOut} size={18} />
          <p className="font-['Outfit:Regular'] text-[14px] leading-[normal] font-normal whitespace-nowrap text-[#054131]">
            {isMasuk ? 'Perlu Ditagih' : 'Kamu Ditagih'}
          </p>
        </div>
        <div className="flex items-center gap-[10px] rounded-[8px] bg-white">
          {(['masuk', 'tagihan'] as const).map((key) => {
            const active = mode === key
            return (
              <div
                key={key}
                className={`flex items-center justify-center gap-[6px] rounded-[6px] py-[4px] pr-[4px] pl-[8px] ${
                  active
                    ? `bg-[#a6bb18] ${key === 'tagihan' ? 'border-[0.5px] border-[#ececec]' : ''}`
                    : 'border-[0.5px] border-[#ececec] bg-white'
                }`}
              >
                <span
                  className={`font-['Outfit:Regular'] text-[12px] leading-[normal] font-normal whitespace-nowrap ${
                    active ? 'text-white' : 'text-[#8e8e8e]'
                  }`}
                >
                  {key === 'masuk' ? 'Uang Masuk' : 'Tagihan'}
                </span>
                <span
                  className={`flex size-[16px] items-center justify-center rounded-[4px] text-center font-['Outfit:Regular'] text-[12px] leading-[normal] font-normal ${
                    active ? 'bg-white text-[#a6bb18]' : 'bg-[#f2f3e6] text-[#8e8e8e]'
                  }`}
                >
                  {key === 'masuk' ? INITIAL_TALANGAN.masuk.count : INITIAL_TALANGAN.tagihan.count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-[10px]">
          <p className="font-['Outfit:SemiBold'] text-[32px] leading-[normal] font-semibold text-[#054131] tabular-nums">
            {formatRupiah(isMasuk ? INITIAL_TALANGAN.masuk.amount : INITIAL_TALANGAN.tagihan.amount)}
          </p>
          <div className="flex h-[24px] items-center gap-[6px]">
            {isMasuk && (
              <div className="flex items-center">
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
            <p className="font-['Outfit:Regular'] text-[14px] leading-[normal] font-normal whitespace-nowrap text-[#8e8e8e]">
              {isMasuk ? INITIAL_TALANGAN.masuk.note : INITIAL_TALANGAN.tagihan.note}
            </p>
          </div>
        </div>

        {isMasuk ? (
          <div className="flex shrink-0 items-center gap-[6px] rounded-[8px] bg-[#f2f3e6] px-[14px] py-[8px]">
            <Icon src={HOME_IMAGES.bell} size={18} />
            <span className="font-['Outfit:Medium'] text-[14px] leading-[normal] font-medium whitespace-nowrap text-[#a6bb18]">
              Ingatkan
            </span>
          </div>
        ) : (
          <div className="flex shrink-0 items-center rounded-[8px] bg-[#f2f3e6] px-[14px] py-[8px]">
            <span className="font-['Outfit:Medium'] text-[14px] leading-[normal] font-medium whitespace-nowrap text-[#a6bb18]">
              Bayar Sekarang
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export function HeroCollage() {
  const card = 'absolute flex items-center justify-center'
  return (
    <div aria-hidden className="relative h-[244px] w-full shrink-0 overflow-clip rounded-[12px] border border-[#ececec] bg-[#f4f4ec]">
      <div
        className={`${card} top-[-21px] left-[-81px] h-[181.492px] w-[337.085px] [animation:card-in_700ms_cubic-bezier(0.2,0.8,0.2,1)_120ms_both]`}
      >
        <div className="flex-none rotate-[-4.95deg]">
          <div className="relative h-[154px] w-[325px]">
            <HeroBillPreview />
          </div>
        </div>
      </div>
      <div
        className={`${card} top-[-46.02px] left-[130.7px] h-[212.577px] w-[417.209px] [animation:card-in_700ms_cubic-bezier(0.2,0.8,0.2,1)_240ms_both]`}
      >
        <div className="flex-none rotate-[11.18deg]">
          <div className="relative h-[138px] w-[398px] rounded-[12px] shadow-[0px_6px_24px_0px_rgba(0,0,0,0.12)]">
            <HeroTalanganPreview mode="masuk" />
          </div>
        </div>
      </div>
      <div
        className={`${card} top-[100px] left-[-11px] h-[159.124px] w-[404.821px] [animation:card-in_700ms_cubic-bezier(0.2,0.8,0.2,1)_360ms_both]`}
      >
        <div className="flex-none rotate-[3.07deg]">
          <div className="relative h-[138px] w-[398px]">
            <HeroTalanganPreview mode="tagihan" />
          </div>
        </div>
      </div>
    </div>
  )
}
