import { Skeleton } from './Skeleton'

export function BillSummarySkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat rincian tagihan"
      className="flex w-full flex-col gap-[20px]"
    >
      {/* Main Bill Info Card Skeleton */}
      <div className="flex w-full flex-col gap-[14px] rounded-[12px] border border-[#ECECEC] bg-white p-[12px]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-[18px] w-[108px] rounded-[6px]" />
          <Skeleton className="h-[16px] w-[92px] rounded-[6px]" tone="muted" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-[24px] w-[180px] max-w-full rounded-[6px]" tone="muted" />
          <Skeleton className="h-[28px] w-[114px] shrink-0 rounded-[6px]" />
        </div>
        <div className="h-[2px] w-full border-t border-dashed border-[#DEDEDE]" />
        <div className="flex flex-col gap-[8px]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-[16px] w-[144px] rounded-[5px]" />
              <Skeleton className="h-[16px] w-[76px] rounded-[5px]" tone="muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Payment Destination Card Skeleton */}
      <div className="flex w-full items-center justify-between gap-[12px] rounded-[12px] border border-[#ECECEC] bg-white p-[12px]">
        <div className="flex flex-col gap-[6px]">
          <Skeleton className="h-[14px] w-[124px] rounded-[5px]" tone="muted" />
          <Skeleton className="h-[18px] w-[168px] rounded-[6px]" />
        </div>
        <Skeleton className="h-[34px] w-[84px] rounded-[8px]" />
      </div>

      {/* Participants Status List Skeleton */}
      <div className="flex flex-col gap-[12px]">
        <Skeleton className="h-[20px] w-[140px] rounded-[6px]" tone="muted" />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex w-full items-center justify-between gap-[10px] rounded-[10px] border border-[#ECECEC] bg-white p-[12px]"
          >
            <div className="flex items-center gap-[10px]">
              <Skeleton className="size-[32px] shrink-0 rounded-full" />
              <div className="flex flex-col gap-[6px]">
                <Skeleton className="h-[16px] w-[86px] rounded-[5px]" tone="muted" />
                <Skeleton className="h-[14px] w-[104px] rounded-[5px]" />
              </div>
            </div>
            <Skeleton className="h-[30px] w-[88px] shrink-0 rounded-[8px]" />
          </div>
        ))}
      </div>
    </div>
  )
}

