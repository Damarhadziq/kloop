import { useEffect, useState } from 'react'
import { LogoLoader, preloadImage, preloadImages } from '@/components/ui'
import { SCAN_ICONS } from '@/services/bill.service'
import type { ReceiptScanAnalysisResult } from '@/types'
import { ScanRoundButton } from './ScanScreen'

const MIN_PROCESSING_MS = 1800

export function LoadingScreen({
  image,
  onBack,
  onDone,
}: {
  image: string | null
  analysis?: ReceiptScanAnalysisResult | null
  onBack: () => void
  onDone: () => void
}) {
  const [ready, setReady] = useState(false)

  // Ready once the captured photo and icons are decoded and processing has had time to run.
  useEffect(() => {
    let alive = true
    Promise.all([
      image ? preloadImage(image) : null,
      preloadImages([SCAN_ICONS.back]),
      new Promise((r) => setTimeout(r, MIN_PROCESSING_MS)),
    ]).then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [image])

  return (
    <div className="flex min-h-dvh w-full flex-col bg-white" aria-busy={!ready}>
      <div className="mx-auto w-full max-w-[430px] px-[16px] pt-[24px]">
        <ScanRoundButton label="Batalkan" icon={SCAN_ICONS.back} onClick={onBack} />
      </div>
      <div className="flex flex-1 items-center justify-center pb-[64px]">
        <div role="status" className="flex w-[152px] flex-col items-center gap-[6px]">
          <LogoLoader ready={ready} onDone={onDone} width={88} />
          <p className="w-full text-center font-['Outfit:Regular'] text-[16px] leading-[normal] font-normal tracking-[-0.2px] whitespace-nowrap text-[#8e8e8e] [animation:fade-in_500ms_ease-out_300ms_both]">
            tunggu sebentar ya....
          </p>
        </div>
      </div>
    </div>
  )
}
