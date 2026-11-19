import { useCallback, useEffect, useState } from 'react'
import { preloadImages } from '@/components/ui'

export function Skeleton({
  className = '',
  tone = 'soft',
}: {
  className?: string
  tone?: 'soft' | 'muted'
}) {
  const bg = tone === 'soft' ? 'bg-[#F2F3E6]' : 'bg-[#ECECEC]'
  return <div aria-hidden className={`animate-pulse rounded-[8px] ${bg} ${className}`} />
}

/**
 * Waits until BOTH the minimum transition skeleton time AND 100% of required `assets`
 * (icons, avatars, illustrations) have finished downloading before setting `isLoading = false`.
 */
export function useSimulatedLoading(
  initialLoading = true,
  delayMs = 550,
  requiredAssets: readonly string[] = [],
) {
  const [isLoading, setIsLoading] = useState(initialLoading)

  useEffect(() => {
    if (!initialLoading) return
    let alive = true
    setIsLoading(true)
    Promise.all([
      requiredAssets.length > 0 ? preloadImages(requiredAssets) : Promise.resolve(),
      new Promise<void>((r) => setTimeout(r, delayMs)),
    ]).then(() => {
      if (alive) setIsLoading(false)
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoading, delayMs, requiredAssets.join('|')])

  const triggerLoading = useCallback(
    (customDelayMs = delayMs) => {
      setIsLoading(true)
      const timer = setTimeout(() => setIsLoading(false), customDelayMs)
      return () => clearTimeout(timer)
    },
    [delayMs],
  )

  return { isLoading, setIsLoading, triggerLoading }
}

/** Skeleton for JenisSheet bottom sheet while icons & options prepare */
export function JenisSheetSkeleton() {
  return (
    <div role="status" aria-label="Memuat pilihan jenis tagihan" className="flex w-full flex-col gap-[24px]">
      <div className="flex w-full items-center justify-between gap-[10px]">
        <div className="flex items-center gap-[8px]">
          <Skeleton className="h-[22px] w-[210px] rounded-[6px]" tone="muted" />
          <Skeleton className="h-[20px] w-[52px] rounded-[6px]" />
        </div>
        <Skeleton className="size-[24px] shrink-0 rounded-full" tone="muted" />
      </div>
      <div className="flex w-full flex-col gap-[12px]">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex w-full items-center gap-[10px] rounded-[14px] border border-[#ECECEC] bg-[#FEFEF8] p-[12px]"
          >
            <Skeleton className="size-[24px] shrink-0 rounded-[6px]" />
            <div className="flex flex-1 flex-col gap-[6px]">
              <Skeleton className="h-[16px] w-[128px] rounded-[5px]" tone="muted" />
              <Skeleton className="h-[13px] w-[220px] max-w-full rounded-[5px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Skeleton for bottom sheet forms (ManualInputSheet, PaymentConfirmSheet, InstallAppSheet) */
export function SheetFormSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Memuat formulir" className="flex w-full flex-col gap-[14px] pt-[8px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[8px]">
          <Skeleton className="h-[22px] w-[140px] rounded-[6px]" tone="muted" />
          <Skeleton className="h-[20px] w-[84px] rounded-[6px]" />
        </div>
        <Skeleton className="h-[16px] w-[96px] rounded-[5px]" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex flex-col gap-[6px]">
          <Skeleton className="h-[14px] w-[88px] rounded-[4px]" />
          <Skeleton className="h-[42px] w-full rounded-[8px]" tone="muted" />
        </div>
      ))}
      <div className="flex gap-[10px] pt-[4px]">
        <Skeleton className="h-[40px] flex-1 rounded-[8px]" />
        <Skeleton className="h-[40px] flex-1 rounded-[8px]" tone="muted" />
      </div>
    </div>
  )
}

/** Skeleton for ScanScreen while icons & camera initialize */
export function ScanScreenSkeleton() {
  return (
    <div
      role="status"
      aria-label="Menyiapkan kamera"
      className="mx-auto flex w-full max-w-[430px] flex-1 flex-col px-[16px] pt-[24px] pb-[24px]"
    >
      <div className="flex w-full items-center justify-between">
        <Skeleton className="size-[40px] rounded-full" />
        <div className="flex items-center gap-[14px]">
          <Skeleton className="size-[40px] rounded-full" />
          <Skeleton className="size-[40px] rounded-full" />
        </div>
      </div>
      <div className="mt-[54px] flex w-full flex-col items-center gap-[8px]">
        <Skeleton className="h-[22px] w-[260px] max-w-full rounded-[6px]" tone="muted" />
        <Skeleton className="h-[16px] w-[290px] max-w-full rounded-[6px]" />
      </div>
      <Skeleton className="mt-[24px] min-h-[360px] w-full flex-1 rounded-[24px]" tone="muted" />
      <div className="mt-[24px] flex items-center justify-center gap-[6px]">
        <Skeleton className="h-[18px] w-[190px] rounded-[6px]" />
      </div>
      <div className="mt-auto flex justify-center pt-[48px]">
        <Skeleton className="h-[28px] w-[72px] rounded-[6px]" tone="muted" />
      </div>
    </div>
  )
}

/** Skeleton for Auth screens during screen transitions & asset loading */
export function AuthScreenSkeleton({ showHero = false }: { showHero?: boolean }) {
  return (
    <div role="status" aria-label="Memuat halaman" className="flex flex-col gap-[32px]">
      {showHero && <Skeleton className="h-[244px] w-full rounded-[12px]" />}
      <div className="flex flex-col gap-[8px]">
        <Skeleton className="h-[28px] w-[240px] max-w-full rounded-[6px]" tone="muted" />
        <Skeleton className="h-[18px] w-[280px] max-w-full rounded-[6px]" />
      </div>
      <div className="flex flex-col gap-[16px]">
        <div className="flex flex-col gap-[10px]">
          <Skeleton className="h-[18px] w-[120px] rounded-[5px]" tone="muted" />
          <Skeleton className="h-[48px] w-full rounded-[12px]" />
        </div>
        <div className="flex flex-col gap-[10px]">
          <Skeleton className="h-[18px] w-[100px] rounded-[5px]" tone="muted" />
          <Skeleton className="h-[48px] w-full rounded-[12px]" />
        </div>
      </div>
      <Skeleton className="h-[48px] w-full rounded-[12px]" tone="muted" />
    </div>
  )
}
