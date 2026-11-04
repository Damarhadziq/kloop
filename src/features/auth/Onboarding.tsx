import { Img, LogoLoader } from '@/components/ui'
import { authIcons } from './AuthShared'

export function Splash({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-white">
      <LogoLoader ready={ready} onDone={onDone} />
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
            <Img src={authIcons.heroBill} className="pointer-events-none object-cover" skeleton="rounded-[8px]" />
          </div>
        </div>
      </div>
      <div
        className={`${card} top-[-46.02px] left-[130.7px] h-[212.577px] w-[417.209px] [animation:card-in_700ms_cubic-bezier(0.2,0.8,0.2,1)_240ms_both]`}
      >
        <div className="flex-none rotate-[11.18deg]">
          <div className="relative h-[138px] w-[398px] shadow-[0px_6px_24px_0px_rgba(0,0,0,0.12)]">
            <Img src={authIcons.heroMasuk} className="pointer-events-none object-cover" skeleton="rounded-[8px]" />
          </div>
        </div>
      </div>
      <div
        className={`${card} top-[100px] left-[-11px] h-[159.124px] w-[404.821px] [animation:card-in_700ms_cubic-bezier(0.2,0.8,0.2,1)_360ms_both]`}
      >
        <div className="flex-none rotate-[3.07deg]">
          <div className="relative h-[138px] w-[398px]">
            <Img src={authIcons.heroTagihan} className="pointer-events-none object-cover" skeleton="rounded-[8px]" />
          </div>
        </div>
      </div>
    </div>
  )
}

