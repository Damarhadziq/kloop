import { useMemo, useState, type ReactNode } from 'react'
import { Skeleton, useSimulatedLoading } from '@/components/skeletons'
import { Badge, PullToRefresh, RoundIconButton, useScrollBarOnScroll } from '@/components/ui'
import { HOME_IMAGES, SCAN_ICONS, formatRupiah } from '@/services/bill.service'
import type { Bill } from '@/types'
import { ActiveBillCard } from './ActiveBillCard'

type BillFilterKey = 'all' | 'unpaid' | 'settled' | 'resto' | 'jajan' | 'equal'

/** Hugeicons-style stroke-rounded 16x16 icons tailored to each filter chip context */
const HUGEICONS: Record<BillFilterKey | 'search' | 'clear' | 'empty', ReactNode> = {
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17.5 17.5L22 22"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C15.9706 20 20 15.9706 20 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  clear: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  all: (
    /* Hugeicons Invoice01Icon */
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M19.5 3.5V20.5L17 19L14.5 20.5L12 19L9.5 20.5L7 19L4.5 20.5V3.5C4.5 2.67157 5.17157 2 6 2H18C18.8284 2 19.5 2.67157 19.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 7.5H15.5M8.5 11.5H15.5M8.5 15.5H12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  unpaid: (
    /* Hugeicons TimeQuarterPass / Clock01Icon */
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  settled: (
    /* Hugeicons CheckmarkBadge01Icon */
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 12.5L11 14.5L15.5 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  resto: (
    /* Hugeicons Restaurant01Icon */
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 3V10C6 11.6569 7.34315 13 9 13V21M9 3V13M12 3V10C12 11.6569 10.6569 13 9 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 3C16.1193 3 15 4.567 15 6.5C15 8.433 16.1193 10 17.5 10V21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  jajan: (
    /* Hugeicons Store01Icon */
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3.5 9.5L4.8 4.2C5.02 3.35 5.78 2.75 6.66 2.75H17.34C18.22 2.75 18.98 3.35 19.2 4.2L20.5 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M3.5 9.5C3.5 11.15 4.85 12.5 6.5 12.5C8.15 12.5 9.5 11.15 9.5 9.5C9.5 11.15 10.85 12.5 12.5 12.5C14.15 12.5 15.5 11.15 15.5 9.5C15.5 11.15 16.85 12.5 18.5 12.5C19.6 12.5 20.5 11.6 20.5 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M5 12.5V20.5H19V12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  equal: (
    /* Hugeicons UserGroupIcon */
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.5" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3.5 19.5C3.5 16.4624 5.96243 14 9 14C12.0376 14 14.5 16.4624 14.5 19.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14.5 14.5C15.1 14.18 15.78 14 16.5 14C18.9853 14 21 16.0147 21 18.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  empty: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M19.5 3.5V20.5L17 19L14.5 20.5L12 19L9.5 20.5L7 19L4.5 20.5V3.5C4.5 2.67157 5.17157 2 6 2H18C18.8284 2 19.5 2.67157 19.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 10H15M9 14H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
}

const FILTER_CHIPS: readonly { key: BillFilterKey; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'unpaid', label: 'Belum Lunas' },
  { key: 'settled', label: 'Sudah Lunas' },
  { key: 'resto', label: 'Resto & Kafe' },
  { key: 'jajan', label: 'Jajanan' },
  { key: 'equal', label: 'Bagi Rata' },
] as const

function AllBillsSkeleton() {
  return (
    <div role="status" aria-label="Memuat daftar tagihan" className="flex flex-col gap-[16px]">
      <Skeleton className="h-[46px] w-full rounded-[12px]" tone="muted" />
      <div className="flex items-center gap-[8px] overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[34px] w-[108px] shrink-0 rounded-full" tone={i === 0 ? 'muted' : 'soft'} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-[10px]">
        <Skeleton className="h-[64px] w-full rounded-[12px]" />
        <Skeleton className="h-[64px] w-full rounded-[12px]" tone="muted" />
      </div>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex w-full flex-col gap-[12px] rounded-[12px] border border-[#ECECEC] bg-white p-[12px]"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-[18px] w-[104px] rounded-[6px]" />
            <Skeleton className="h-[16px] w-[88px] rounded-[6px]" tone="muted" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-[22px] w-[164px] rounded-[6px]" tone="muted" />
            <Skeleton className="h-[24px] w-[106px] rounded-[6px]" />
          </div>
          <div className="h-[2px] w-full border-t border-dashed border-[#DEDEDE]" />
          <div className="grid grid-cols-3 gap-[12px]">
            {[0, 1, 2].map((a) => (
              <div key={a} className="flex items-center gap-[6px]">
                <Skeleton className="size-[24px] shrink-0 rounded-full" tone="muted" />
                <Skeleton className="h-[16px] flex-1 rounded-[5px]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function AllBillsScreen({
  bills,
  reminded,
  onBack,
  onRemind,
  onTogglePaid,
  onOpenDetail,
}: {
  bills: Bill[]
  reminded: Record<string, boolean>
  onBack: () => void
  onRemind: (billId: string, name: string) => void
  onTogglePaid: (billId: string, name: string) => void
  onOpenDetail: (bill: Bill) => void
}) {
  const requiredAssets = useMemo(
    () => [
      SCAN_ICONS.back,
      HOME_IMAGES.chefHat,
      HOME_IMAGES.dashedLine,
      HOME_IMAGES.verified,
      HOME_IMAGES.bellSmall,
      ...bills.flatMap((b) => b.participants.map((p) => p.avatarUrl)),
    ],
    [bills],
  )
  const { isLoading, triggerLoading } = useSimulatedLoading(true, 550, requiredAssets)

  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<BillFilterKey>('all')
  const { onScroll: onChipScroll, scrollClassName: chipScrollClass } = useScrollBarOnScroll()

  const isBillSettled = (b: Bill) => b.participants.every((p) => p.paid)

  const filteredBills = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bills.filter((b) => {
      const settled = isBillSettled(b)
      if (activeFilter === 'unpaid' && settled) return false
      if (activeFilter === 'settled' && !settled) return false
      if (activeFilter === 'resto' && !b.category.toLowerCase().includes('resto')) return false
      if (activeFilter === 'jajan' && !b.category.toLowerCase().includes('jajan')) return false
      if (activeFilter === 'equal' && b.splitMethod !== 'equal') return false

      if (!q) return true
      const matchTitle = b.title.toLowerCase().includes(q)
      const matchCategory = b.category.toLowerCase().includes(q)
      const matchParticipant = b.participants.some((p) => p.name.toLowerCase().includes(q))
      return matchTitle || matchCategory || matchParticipant
    })
  }, [bills, query, activeFilter])

  const activeCount = useMemo(() => bills.filter((b) => !isBillSettled(b)).length, [bills])
  const totalUnpaidAmount = useMemo(
    () =>
      bills.reduce(
        (acc, b) =>
          acc +
          b.participants
            .filter((p) => !p.paid)
            .reduce((s, p) => s + (p.totalOwed || Math.round(b.total / Math.max(1, b.participants.length))), 0),
        0,
      ),
    [bills],
  )

  return (
    <PullToRefresh onRefresh={() => void triggerLoading(550)}>
      <div className="min-h-dvh w-full bg-white text-[#054131]">
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-[18px] px-[16px] pt-[24px] pb-[48px]">
        {/* Header */}
        <header className="flex items-center justify-between gap-[10px]">
          <RoundIconButton label="Kembali ke beranda" src={SCAN_ICONS.back} onClick={onBack} skeleton="rounded-[5px]" />
          <div className="flex min-w-0 flex-1 items-center justify-center gap-[6px]">
            <h1 className="truncate font-['Outfit:Medium'] text-[18px] leading-[normal] font-medium tracking-[-0.2px] text-[#054131]">
              Tagihan Berjalan
            </h1>
            <Badge>{bills.length} Bill</Badge>
          </div>
          <span className="size-[40px] shrink-0" aria-hidden />
        </header>

        {isLoading ? (
          <AllBillsSkeleton />
        ) : (
          <div className="stagger flex flex-col gap-[16px]">
            {/* Search Bar with Hugeicons Search Icon */}
            <div className="flex w-full items-center gap-[10px] rounded-[12px] border border-[#ececec] bg-[#fefef8] px-[12px] py-[10px] transition-[border-color,box-shadow] duration-200 focus-within:border-[#a6bb18] focus-within:shadow-[0_0_0_3px_rgba(166,187,24,0.14)]">
              <span className="shrink-0 text-[#8e8e8e]">{HUGEICONS.search}</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama tempat, kategori, atau nama teman..."
                className="min-w-0 flex-1 bg-transparent font-['Outfit:Regular'] text-[14px] text-[#054131] outline-none placeholder:text-[#8e8e8e]"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Hapus pencarian"
                  onClick={() => setQuery('')}
                  className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#f2f3e6] text-[#054131] transition hover:bg-[#e8ead2]"
                >
                  {HUGEICONS.clear}
                </button>
              )}
            </div>

            {/* Filter Chips with Contextual Hugeicons (scrollbar hidden initially, appears only while scrolling) */}
            <div
              role="tablist"
              aria-label="Filter tagihan"
              onScroll={onChipScroll}
              className={`flex items-center gap-[8px] overflow-x-auto pb-[4px] ${chipScrollClass}`}
            >
              {FILTER_CHIPS.map((chip) => {
                const active = activeFilter === chip.key
                return (
                  <button
                    key={chip.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveFilter(chip.key)}
                    className={`flex shrink-0 items-center gap-[6px] rounded-full border px-[12px] py-[7px] font-['Outfit:Medium'] text-[13px] font-medium transition duration-200 active:scale-95 ${
                      active
                        ? 'border-[#a6bb18] bg-[#a6bb18] text-white shadow-[0_4px_12px_rgba(166,187,24,0.24)]'
                        : 'border-[#ececec] bg-white text-[#054131] hover:border-[#a6bb18] hover:bg-[#fefef8]'
                    }`}
                  >
                    <span className={active ? 'text-white' : 'text-[#a6bb18]'}>{HUGEICONS[chip.key]}</span>
                    <span>{chip.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Summary Stats Cards */}
            <div className="grid grid-cols-2 gap-[10px]">
              <div className="flex flex-col gap-[4px] rounded-[12px] border border-[#ececec] bg-[#fefef8] p-[12px]">
                <span className="font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">Belum Lunas</span>
                <span className="font-['Outfit:SemiBold'] text-[18px] font-semibold tabular-nums text-[#054131]">
                  {activeCount} Sesi Bill
                </span>
              </div>
              <div className="flex flex-col gap-[4px] rounded-[12px] border border-[#ececec] bg-[#f2f3e6]/65 p-[12px]">
                <span className="font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">Sisa Piutang Teman</span>
                <span className="truncate font-['Outfit:SemiBold'] text-[18px] font-semibold tabular-nums text-[#a6bb18]">
                  {formatRupiah(totalUnpaidAmount)}
                </span>
              </div>
            </div>

            {/* Bills List */}
            <div className="flex flex-col gap-[14px]">
              <div className="flex items-center justify-between">
                <p className="font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
                  Menampilkan {filteredBills.length} dari {bills.length} tagihan • Ketuk kartu untuk rincian
                </p>
                {(query || activeFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setActiveFilter('all')
                    }}
                    className="font-['Outfit:Medium'] text-[12px] font-medium text-[#a6bb18] hover:underline"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {filteredBills.length > 0 ? (
                filteredBills.map((b) => (
                  <ActiveBillCard
                    key={b.id}
                    bill={b}
                    reminded={reminded}
                    onRemind={onRemind}
                    onTogglePaid={onTogglePaid}
                    onOpenDetail={onOpenDetail}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center gap-[10px] rounded-[14px] border border-dashed border-[#dedede] bg-[#fefef8] px-[20px] py-[36px] text-center">
                  <div className="flex size-[48px] items-center justify-center rounded-full bg-[#f2f3e6] text-[#a6bb18]">
                    {HUGEICONS.empty}
                  </div>
                  <p className="font-['Outfit:Medium'] text-[15px] font-medium text-[#054131]">
                    Tagihan tidak ditemukan
                  </p>
                  <p className="max-w-[260px] font-['Outfit:Regular'] text-[13px] text-[#8e8e8e]">
                    Tidak ada tagihan yang cocok dengan pencarian atau filter yang kamu pilih.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </PullToRefresh>
  )
}
