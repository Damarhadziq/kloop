import { Skeleton } from './Skeleton'

export function ScanResultSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memproses hasil baca struk"
      className="flex w-full flex-col gap-[20px]"
    >
      {/* Store / Category Header Skeleton */}
      <div className="flex w-full flex-col gap-[10px] rounded-[12px] border border-[#ECECEC] bg-white p-[12px]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-[20px] w-[112px] rounded-[6px]" />
          <Skeleton className="h-[20px] w-[84px] rounded-[6px]" tone="muted" />
        </div>
        <Skeleton className="h-[38px] w-full rounded-[8px]" tone="muted" />
      </div>

      {/* Mode Toggle Skeleton */}
      <div className="grid grid-cols-2 gap-[8px] rounded-[10px] border border-[#ECECEC] bg-white p-[6px]">
        <Skeleton className="h-[36px] w-full rounded-[8px]" />
        <Skeleton className="h-[36px] w-full rounded-[8px]" tone="muted" />
      </div>

      {/* Receipt Item Rows Skeleton */}
      <div className="flex flex-col gap-[12px]">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex w-full flex-col gap-[12px] rounded-[12px] border border-[#ECECEC] bg-white p-[12px]"
          >
            <div className="flex items-center justify-between gap-[10px]">
              <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
                <Skeleton className="h-[18px] w-[160px] max-w-full rounded-[6px]" tone="muted" />
                <Skeleton className="h-[14px] w-[72px] rounded-[5px]" />
              </div>
              <Skeleton className="h-[20px] w-[88px] shrink-0 rounded-[6px]" />
            </div>
            <div className="h-px w-full bg-[#ECECEC]" />
            <div className="flex items-center gap-[8px]">
              {[0, 1, 2, 3].map((a) => (
                <Skeleton key={a} className="size-[28px] shrink-0 rounded-full" tone={a % 2 === 0 ? 'soft' : 'muted'} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer Skeleton */}
      <div className="flex w-full flex-col gap-[10px] rounded-[12px] border border-[#ECECEC] bg-white p-[12px]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-[16px] w-[96px] rounded-[5px]" tone="muted" />
          <Skeleton className="h-[16px] w-[80px] rounded-[5px]" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-[20px] w-[112px] rounded-[6px]" tone="muted" />
          <Skeleton className="h-[24px] w-[118px] rounded-[6px]" />
        </div>
      </div>
    </div>
  )
}

