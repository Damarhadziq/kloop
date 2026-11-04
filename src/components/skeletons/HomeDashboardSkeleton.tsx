import { Skeleton } from './Skeleton'

export function HomeDashboardSkeleton() {
  return (
    <main
      role="status"
      aria-label="Memuat beranda"
      className="grid grid-cols-1 gap-[40px] md:grid-cols-2 md:gap-x-[32px] md:px-[16px]"
    >
      <div className="flex flex-col gap-[40px]">
        {/* Status Talangan Skeleton */}
        <section className="flex flex-col gap-[12px] px-[16px] md:px-0">
          <Skeleton className="h-[22px] w-[132px] rounded-[6px]" tone="muted" />
          <div className="flex w-full flex-col gap-[14px] rounded-[12px] border border-[#ECECEC] bg-white p-[12px]">
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex items-center gap-[6px]">
                <Skeleton className="size-[18px] rounded-[5px]" tone="muted" />
                <Skeleton className="h-[18px] w-[90px] rounded-[6px]" />
              </div>
              <div className="flex items-center gap-[10px]">
                <Skeleton className="h-[24px] w-[96px] rounded-[6px]" />
                <Skeleton className="h-[24px] w-[76px] rounded-[6px]" tone="muted" />
              </div>
            </div>
            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex flex-col gap-[10px]">
                <Skeleton className="h-[38px] w-[178px] rounded-[8px]" tone="muted" />
                <div className="flex h-[24px] items-center gap-[8px]">
                  <div className="flex items-center">
                    {[0, 1, 2, 3].map((i) => (
                      <Skeleton
                        key={i}
                        className={`size-[24px] rounded-full ring-2 ring-white ${i < 3 ? 'mr-[-10px]' : ''}`}
                      />
                    ))}
                  </div>
                  <Skeleton className="h-[16px] w-[140px] rounded-[6px]" />
                </div>
              </div>
              <Skeleton className="h-[36px] w-[104px] shrink-0 rounded-[8px]" />
            </div>
          </div>
        </section>

        {/* Hero Action CTA Skeleton */}
        <section className="flex items-center gap-[24px] px-[16px] md:px-0">
          <Skeleton className="h-[110px] w-[96px] shrink-0 rounded-[14px]" />
          <div className="flex min-w-px flex-1 flex-col gap-[18px]">
            <div className="flex flex-col gap-[8px]">
              <Skeleton className="h-[20px] w-[210px] max-w-full rounded-[6px]" tone="muted" />
              <Skeleton className="h-[14px] w-[240px] max-w-full rounded-[6px]" />
              <Skeleton className="h-[14px] w-[180px] max-w-full rounded-[6px]" />
            </div>
            <div className="flex items-center gap-[10px]">
              <Skeleton className="h-[36px] flex-1 rounded-[8px]" tone="muted" />
              <Skeleton className="h-[36px] flex-1 rounded-[8px]" />
            </div>
          </div>
        </section>
      </div>

      <div className="flex flex-col gap-[40px]">
        {/* Tagihan Berjalan Skeleton */}
        <section className="flex flex-col gap-[14px] px-[16px] md:px-0">
          <div className="flex items-center justify-between">
            <Skeleton className="h-[22px] w-[142px] rounded-[6px]" tone="muted" />
            <Skeleton className="h-[18px] w-[102px] rounded-[6px]" />
          </div>
          <div className="flex w-full flex-col gap-[12px] rounded-[10px] border border-[#ECECEC] bg-white p-[12px]">
            <div className="flex items-center justify-between">
              <Skeleton className="h-[18px] w-[104px] rounded-[6px]" />
              <Skeleton className="h-[16px] w-[88px] rounded-[6px]" tone="muted" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-[22px] w-[164px] rounded-[6px]" tone="muted" />
              <Skeleton className="h-[24px] w-[106px] rounded-[6px]" />
            </div>
            <div className="h-[2px] w-full border-t border-dashed border-[#DEDEDE]" />
            <div className="flex flex-col gap-[8px]">
              <Skeleton className="h-[16px] w-[136px] rounded-[6px]" />
              <div className="grid grid-cols-3 gap-[12px]">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex items-center gap-[6px]">
                    <Skeleton className="size-[24px] shrink-0 rounded-full" tone="muted" />
                    <Skeleton className="h-[16px] flex-1 rounded-[5px]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Circle Kamu Skeleton */}
        <section className="flex flex-col gap-[16px] px-[16px] md:px-0">
          <div className="flex items-center justify-between">
            <Skeleton className="h-[22px] w-[110px] rounded-[6px]" tone="muted" />
            <Skeleton className="h-[20px] w-[78px] rounded-[6px]" />
          </div>
          <div className="grid grid-cols-3 gap-[14px]">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="flex items-center gap-[6px]">
                <Skeleton className="size-[24px] shrink-0 rounded-full" />
                <Skeleton className="h-[16px] w-[52px] rounded-[5px]" tone="muted" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

