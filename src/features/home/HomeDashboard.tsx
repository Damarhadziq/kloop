import { useCallback, useEffect, useRef, useState } from 'react'
import { HomeDashboardSkeleton } from '@/components/skeletons'
import { ConfirmModal, Icon, preloadImages, screenClass, useSwitch } from '@/components/ui'
import { BillSummaryScreen } from '@/features/bill-summary'
import {
  JenisSheet,
  LoadingScreen,
  ManualInputSheet,
  ScanScreen,
  SplitBillScreen,
  jenisOptions,
  type Jenis,
} from '@/features/split-bill'
import {
  CIRCLE_AVATARS,
  HOME_ASSETS,
  HOME_IMAGES,
  INITIAL_BILLS,
  INITIAL_TALANGAN,
  SCAN_ASSETS,
  createBill,
  formatRupiah,
  getActiveBills,
  type CircleName,
  type CreateBillInput,
} from '@/services/bill.service'
import type { Bill, InputMode, PaymentStatus, ReceiptScanAnalysisResult, Session } from '@/types'
import { ActiveBillCard } from './ActiveBillCard'
import { AllBillsScreen } from './AllBillsScreen'
import { CircleSection } from './CircleSection'
import { HeroActionCard } from './HeroActionCard'
import { InstallAppSheet } from './InstallAppSheet'
import { ProfileMenu } from './ProfileMenu'
import { StatusTalanganCard } from './StatusTalanganCard'

type AppScreen = 'home' | 'all-bills' | 'scan' | 'loading' | 'split-bill' | 'bill-summary'

export function HomeDashboard({
  session,
  onLogout,
  notify,
}: {
  session: Session
  onLogout: () => void
  notify: (m: string) => void
}) {
  const setToast = notify
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true)
  const [tab, setTab] = useState<'masuk' | 'tagihan'>('masuk')
  const [bills, setBills] = useState<Bill[]>(INITIAL_BILLS)
  const [reminded, setReminded] = useState<Record<string, boolean>>({})
  const [circle, setCircle] = useState<CircleName[]>(Object.keys(CIRCLE_AVATARS) as CircleName[])
  const [managing, setManaging] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const billsRef = useRef<HTMLElement>(null)
  const [jenisOpen, setJenisOpen] = useState(false)
  const [jenisMode, setJenisMode] = useState<InputMode>('scan')
  const [jenis, setJenis] = useState<Jenis>(jenisOptions[0])
  const [screen, setScreen] = useState<AppScreen>('home')
  const [prevScreenBeforeSummary, setPrevScreenBeforeSummary] = useState<'home' | 'all-bills'>('home')
  const [profileOpen, setProfileOpen] = useState(false)
  const [installOpen, setInstallOpen] = useState(false)
  const [tagihanPaid, setTagihanPaid] = useState(false)

  const [selectedBillId, setSelectedBillId] = useState<string>(INITIAL_BILLS[0].id)
  const [splitDraft, setSplitDraft] = useState<{ title: string; total: number; fromScan: boolean }>({
    title: '',
    total: 0,
    fromScan: true,
  })

  // Global confirmation modal state for destructive / status-changing actions
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel: string
    variant: 'danger' | 'primary'
    onConfirm: () => void
  }>({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Ya, Lanjutkan',
    variant: 'danger',
    onConfirm: () => undefined,
  })

  const scanImage = useRef<string | null>(null)
  const [scanAnalysis, setScanAnalysis] = useState<ReceiptScanAnalysisResult | null>(null)
  const { shown: shownScreen, leaving } = useSwitch(screen)

  // Fetch initial dashboard data AND wait for 100% of home & bottom-sheet assets before hiding skeleton
  useEffect(() => {
    let alive = true
    setIsLoadingDashboard(true)
    Promise.all([getActiveBills(650), preloadImages([...HOME_ASSETS, ...SCAN_ASSETS])]).then(([data]) => {
      if (!alive) return
      setBills(data)
      setIsLoadingDashboard(false)
    })
    return () => {
      alive = false
    }
  }, [])

  const openJenis = (mode: InputMode) => {
    setJenisMode(mode)
    setJenisOpen(true)
  }

  const remindParticipant = (billId: string, name: string) => {
    setReminded((r) => ({ ...r, [`${billId}-${name}`]: true }))
    setToast(`Pengingat terkirim ke ${name}`)
  }

  const togglePaid = (billId: string, name: string) => {
    const targetBill = bills.find((b) => b.id === billId)
    const targetPart = targetBill?.participants.find((p) => p.name === name)
    const currentlyPaid = Boolean(targetPart?.paid)

    setConfirmState({
      open: true,
      title: currentlyPaid ? `Batalkan Status Lunas ${name}?` : `Tandai ${name} Sudah Lunas?`,
      description: currentlyPaid
        ? `Status pembayaran ${name} pada tagihan "${targetBill?.title ?? ''}" akan dikembalikan menjadi Belum Lunas.`
        : `Pastikan kamu sudah menerima pembayaran dari ${name} untuk tagihan "${targetBill?.title ?? ''}".`,
      confirmLabel: currentlyPaid ? 'Ya, Batalkan Lunas' : 'Ya, Tandai Lunas',
      variant: currentlyPaid ? 'danger' : 'primary',
      onConfirm: () => {
        setBills((bs) =>
          bs.map((b) =>
            b.id !== billId
              ? b
              : {
                  ...b,
                  participants: b.participants.map((p) =>
                    p.name === name
                      ? {
                          ...p,
                          paid: !p.paid,
                          paymentStatus: !p.paid ? 'settled' : 'unpaid',
                        }
                      : p,
                  ),
                },
          ),
        )
        setToast(currentlyPaid ? `Status ${name} diubah ke belum lunas` : `${name} ditandai sudah lunas`)
      },
    })
  }

  const requestRemoveFriend = (name: CircleName) => {
    setConfirmState({
      open: true,
      title: `Hapus ${name} dari Circle?`,
      description: `${name} akan dihapus dari daftar Circle Kamu dan tidak muncul otomatis di patungan berikutnya.`,
      confirmLabel: 'Ya, Hapus',
      variant: 'danger',
      onConfirm: () => {
        setCircle((c) => c.filter((n) => n !== name))
        setToast(`${name} dihapus dari Circle`)
      },
    })
  }

  const requestLogout = () => {
    setProfileOpen(false)
    setConfirmState({
      open: true,
      title: 'Keluar dari Akun Kloop?',
      description: 'Kamu perlu masuk kembali menggunakan nomor telepon dan kata sandi untuk mengakses tagihanmu.',
      confirmLabel: 'Ya, Keluar',
      variant: 'danger',
      onConfirm: onLogout,
    })
  }

  const confirmParticipantPayment = (
    billId: string,
    name: string,
    status: PaymentStatus,
    proofImageUrl?: string,
  ) => {
    setBills((bs) =>
      bs.map((b) =>
        b.id !== billId
          ? b
          : {
              ...b,
              participants: b.participants.map((p) =>
                p.name === name
                  ? {
                      ...p,
                      paid: status === 'settled',
                      paymentStatus: status,
                      proofImageUrl: proofImageUrl ?? p.proofImageUrl,
                    }
                  : p,
              ),
            },
      ),
    )
  }

  const handleQuickManualSave = async (title: string, total: number) => {
    const newBill = await createBill(
      {
        title,
        category: jenis.title,
        totalAmount: total,
        splitMethod: 'equal',
        participants: circle.slice(0, 3).map((n) => ({
          name: n,
          avatarUrl: CIRCLE_AVATARS[n],
          paid: false,
        })),
      },
      100,
    )
    setBills((bs) => [newBill, ...bs])
    setSheetOpen(false)
    setToast('Bill baru ditambahkan')
  }

  const handleOpenDetailedManual = (title: string, total: number) => {
    setSheetOpen(false)
    setSplitDraft({ title, total, fromScan: false })
    setTimeout(() => setScreen('split-bill'), 240)
  }

  const selectJenis = (j: Jenis) => {
    setJenis(j)
    setJenisOpen(false)
    setTimeout(() => (jenisMode === 'scan' ? setScreen('scan') : setSheetOpen(true)), 240)
  }

  const finishScan = useCallback(() => {
    if (scanImage.current?.startsWith('blob:')) URL.revokeObjectURL(scanImage.current)
    scanImage.current = null
    const draft = scanAnalysis?.draft
    const draftSubtotal = draft ? draft.items.reduce((sum, it) => sum + it.price, 0) : 113000
    const draftTotal = draft ? draftSubtotal + draft.taxAmount + draft.serviceAmount - draft.discountAmount : 128500
    setSplitDraft({
      title: draft?.title || 'Kopi Nako Tembalang',
      total: draftTotal,
      fromScan: true,
    })
    setScreen('split-bill')
    setToast('Struk berhasil dipindai & diekstrak')
  }, [scanAnalysis, setToast])

  const handleSaveSplitBill = async (input: CreateBillInput) => {
    const created = await createBill(input, 200)
    setBills((bs) => [created, ...bs])
    setSelectedBillId(created.id)
    setPrevScreenBeforeSummary('home')
    setScreen('bill-summary')
    setToast('Tagihan berhasil dibuat')
  }

  let screenContent
  if (shownScreen === 'all-bills') {
    screenContent = (
      <div key="all-bills" className={screenClass(leaving)}>
        <AllBillsScreen
          bills={bills}
          reminded={reminded}
          onBack={() => setScreen('home')}
          onRemind={remindParticipant}
          onTogglePaid={togglePaid}
          onOpenDetail={(b) => {
            setSelectedBillId(b.id)
            setPrevScreenBeforeSummary('all-bills')
            setScreen('bill-summary')
          }}
        />
      </div>
    )
  } else if (shownScreen === 'scan') {
    screenContent = (
      <div key="scan" className={screenClass(leaving)}>
        <ScanScreen
          categoryTitle={jenis.title}
          participantIds={circle.slice(0, 3)}
          onBack={() => setScreen('home')}
          onManual={() => {
            setScreen('home')
            setTimeout(() => setSheetOpen(true), 360)
          }}
          onCaptured={(src, analysis) => {
            scanImage.current = src
            setScanAnalysis(analysis ?? null)
            setScreen('loading')
          }}
          notify={setToast}
        />
      </div>
    )
  } else if (shownScreen === 'loading') {
    screenContent = (
      <div key="loading" className={screenClass(leaving)}>
        <LoadingScreen
          image={scanImage.current}
          analysis={scanAnalysis}
          onBack={() => setScreen('scan')}
          onDone={finishScan}
        />
      </div>
    )
  } else if (shownScreen === 'split-bill') {
    screenContent = (
      <div key="split-bill" className={screenClass(leaving)}>
        <SplitBillScreen
          jenis={jenis}
          circle={circle}
          initialTitle={splitDraft.title}
          initialTotal={splitDraft.total}
          fromScan={splitDraft.fromScan}
          onBack={() => setScreen('home')}
          onSaveBill={handleSaveSplitBill}
          notify={setToast}
        />
      </div>
    )
  } else if (shownScreen === 'bill-summary') {
    const activeBill = bills.find((b) => b.id === selectedBillId) ?? bills[0]
    if (activeBill) {
      screenContent = (
        <div key="bill-summary" className={screenClass(leaving)}>
          <BillSummaryScreen
            bill={activeBill}
            reminded={reminded}
            onBack={() => setScreen(prevScreenBeforeSummary)}
            onRemind={remindParticipant}
            onTogglePaid={togglePaid}
            onConfirmPayment={confirmParticipantPayment}
            notify={setToast}
          />
        </div>
      )
    }
  }

  const featured = bills[0]

  return (
    <>
      {screenContent ?? (
        <div key="home" className={`min-h-dvh w-full bg-white text-[#054131] ${screenClass(leaving)}`}>
          <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-[24px] pb-[48px]">
            {/* Header */}
            <header className="relative z-30 flex items-center justify-between px-[16px] pt-[24px] pb-[14px] md:pt-[32px] [animation:fade-down_420ms_cubic-bezier(0.2,0.8,0.2,1)_both]">
              <ProfileMenu
                open={profileOpen}
                onToggle={() => setProfileOpen((o) => !o)}
                onClose={() => setProfileOpen(false)}
                session={session}
                onOpenInstall={() => setInstallOpen(true)}
                onLogout={requestLogout}
              />
              <p className="font-['Courgette:Regular'] text-[26px] leading-[normal] tracking-[-0.3px] whitespace-nowrap text-[#054131]">
                Kloop
              </p>
              <button
                aria-label="Lihat semua tagihan"
                onClick={() => setScreen('all-bills')}
                className="flex items-center rounded-[999px] bg-[#f8f8ec] p-[8px] transition hover:bg-[#eef0d6]"
              >
                <Icon src={HOME_IMAGES.billList} size={24} />
              </button>
            </header>

            {isLoadingDashboard ? (
              <HomeDashboardSkeleton />
            ) : (
              <main className="grid grid-cols-1 gap-[40px] md:grid-cols-2 md:gap-x-[32px] md:px-[16px]">
                <div className="stagger flex flex-col gap-[40px]">
                  {/* Status Talangan */}
                  <StatusTalanganCard
                    tab={tab}
                    onTabChange={setTab}
                    tagihanPaid={tagihanPaid}
                    reminded={!!reminded.bulk}
                    onRemind={() => {
                      setReminded((r) => ({ ...r, bulk: true }))
                      setToast(`Pengingat terkirim ke ${INITIAL_TALANGAN.masuk.count} teman`)
                    }}
                    onPay={() => {
                      setTagihanPaid(true)
                      setToast(`Pembayaran ${formatRupiah(INITIAL_TALANGAN.tagihan.amount)} berhasil`)
                    }}
                  />

                  {/* New expense CTA */}
                  <HeroActionCard onOpenJenis={openJenis} />
                </div>

                <div className="stagger flex flex-col gap-[40px]">
                  {/* Tagihan Berjalan */}
                  <section ref={billsRef} className="flex scroll-mt-4 flex-col gap-[14px] px-[16px] md:px-0">
                    <div className="flex items-center justify-between font-['Outfit:Medium'] leading-[normal] font-medium tracking-[-0.2px] whitespace-nowrap">
                      <h2 className="text-[18px]">Tagihan Berjalan</h2>
                      <button
                        type="button"
                        onClick={() => setScreen('all-bills')}
                        className="text-[14px] text-[#a6bb18] hover:underline"
                      >
                        {`Lihat Semua (${bills.length})`}
                      </button>
                    </div>

                    {featured && (
                      <ActiveBillCard
                        bill={featured}
                        reminded={reminded}
                        onRemind={remindParticipant}
                        onTogglePaid={togglePaid}
                        onOpenDetail={(b) => {
                          setSelectedBillId(b.id)
                          setPrevScreenBeforeSummary('home')
                          setScreen('bill-summary')
                        }}
                      />
                    )}
                  </section>

                  {/* Circle Kamu */}
                  <CircleSection
                    circle={circle}
                    managing={managing}
                    onToggleManage={() => setManaging((m) => !m)}
                    onRemoveFriend={requestRemoveFriend}
                  />
                </div>
              </main>
            )}
          </div>

          <ManualInputSheet
            open={sheetOpen}
            jenis={jenis}
            onClose={() => setSheetOpen(false)}
            onQuickSave={handleQuickManualSave}
            onOpenDetailedSplit={handleOpenDetailedManual}
          />

          <JenisSheet open={jenisOpen} mode={jenisMode} onClose={() => setJenisOpen(false)} onSelect={selectJenis} />

          <InstallAppSheet open={installOpen} onClose={() => setInstallOpen(false)} notify={setToast} />
        </div>
      )}

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.confirmLabel}
        variant={confirmState.variant}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
      />
    </>
  )
}
