import { useEffect, useState } from 'react'
import { LogoLoader, preloadImage } from '@/components/ui'
import { SCAN_ICONS } from '@/services/bill.service'
import type { ReceiptScanAnalysisResult } from '@/types'
import { ScanRoundButton } from './ScanScreen'

const MIN_PROCESSING_MS = 1800

const OCR_EXTRACT_STAGES = [
  'Mengekstrak baris menu & harga satuan...',
  'Menghitung pajak (PPN) & service charge...',
  'Menyiapkan pembagian tagihan otomatis...',
] as const

export function LoadingScreen({
  image,
  analysis,
  onBack,
  onDone,
}: {
  image: string | null
  analysis?: ReceiptScanAnalysisResult | null
  onBack: () => void
  onDone: () => void
}) {
  const [ready, setReady] = useState(false)
  const [stageIdx, setStageIdx] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setStageIdx(1), 600)
    const t2 = setTimeout(() => setStageIdx(2), 1200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  // Ready once the captured photo is decoded and processing has had time to run.
  useEffect(() => {
    let alive = true
    Promise.all([image ? preloadImage(image) : null, new Promise((r) => setTimeout(r, MIN_PROCESSING_MS))]).then(
      () => alive && setReady(true),
    )
    return () => {
      alive = false
    }
  }, [image])

  const detectedLines = analysis?.detectedLines?.length
    ? analysis.detectedLines
    : [
        'KOPI NAKO TEMBALANG',
        '1x Iced Caramel Macchiato  Rp 38.000',
        '1x Nasi Goreng Kampung     Rp 45.000',
        '1x French Fries Truffle    Rp 30.000',
        'TOTAL BAYAR                Rp 128.500',
      ]

  return (
    <div className="flex min-h-dvh w-full flex-col bg-white" aria-busy={!ready}>
      <div className="mx-auto w-full max-w-[560px] px-[16px] pt-[24px] md:pt-[32px]">
        <ScanRoundButton label="Batalkan" icon={SCAN_ICONS.back} onClick={onBack} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-[28px] px-[16px] pb-[64px]">
        {/* Animated Mini Receipt Scanner Card */}
        <div className="relative flex w-full max-w-[280px] flex-col gap-[8px] overflow-hidden rounded-[16px] border border-[#ececec] bg-[#fefef8] p-[14px] shadow-[0_8px_28px_rgba(5,65,49,0.08)]">
          <div className="flex items-center justify-between border-b border-dashed border-[#dedede] pb-[8px]">
            <div className="flex items-center gap-[8px]">
              {image && (
                <img
                  src={image}
                  alt=""
                  className="size-[28px] shrink-0 rounded-[6px] border border-[#ececec] object-cover"
                />
              )}
              <span className="font-['Outfit:Medium'] text-[12px] font-medium text-[#054131]">
                Memindai Struk OCR
              </span>
            </div>
            <span className="rounded-[6px] bg-[#f2f3e6] px-[6px] py-[2px] font-['Outfit:Medium'] text-[11px] text-[#a6bb18]">
              {analysis?.metrics.confidence ?? 96}% Akurat
            </span>
          </div>

          <div className="flex flex-col gap-[5px] py-[4px]">
            {detectedLines.slice(0, 5).map((line, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-[5px] bg-[#f2f3e6]/70 px-[8px] py-[4px] font-mono text-[10px] text-[#054131]"
              >
                <span className="truncate">{line}</span>
                <span className="ml-[6px] size-[5px] shrink-0 rounded-full bg-[#2acb70]" />
              </div>
            ))}
          </div>

          {/* Sweeping laser line over the mini receipt */}
          <div className="pointer-events-none absolute inset-x-0 h-[28px] [animation:receipt-laser_1.3s_ease-in-out_infinite]">
            <div className="h-[25px] w-full bg-gradient-to-b from-transparent to-[#a6bb18]/25" />
            <div className="h-[2px] w-full bg-[#a6bb18] shadow-[0_0_10px_#a6bb18]" />
          </div>
        </div>

        {/* Kloop Logo Loader & Status Text */}
        <div role="status" className="flex flex-col items-center gap-[8px]">
          <LogoLoader ready={ready} onDone={onDone} width={88} />
          <p className="text-center font-['Outfit:Medium'] text-[14px] leading-[normal] font-medium tracking-[-0.2px] text-[#054131]">
            {OCR_EXTRACT_STAGES[stageIdx]}
          </p>
          <p className="text-center font-['Outfit:Regular'] text-[14px] leading-[normal] font-normal tracking-[-0.2px] whitespace-nowrap text-[#8e8e8e]">
            tunggu sebentar ya....
          </p>
        </div>
      </div>
    </div>
  )
}
