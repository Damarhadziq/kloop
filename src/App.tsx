import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { AUTH_ASSETS, AuthFlow, Splash, type Session } from './Auth'
import { JenisSheet, LoadingScreen, SCAN_ASSETS, ScanScreen, jenisOptions, type InputMode, type Jenis } from './ScanFlow'
import { Img, Sheet, Toast, preloadImage, preloadWhenIdle, screenClass, usePresence, useSwitch, useToast } from './ui'

const a = (f: string) => `/assets/${f}`

const img = {
  profile: a('99968.svg'),
  billList: a('fabc8.svg'),
  cashOut: a('3c9ae.svg'),
  bell: a('5b4e9.svg'),
  illustration: a('470ea.svg'),
  docAdd: a('cd915.svg'),
  scan: a('5bfbd.svg'),
  chefHat: a('6400b.svg'),
  dashedLine: a('968ba.svg'),
  verified: a('41abe.svg'),
  bellSmall: a('5a751.svg'),
  usersGroup: a('a81da.svg'),
  stack: [a('42990.png'), a('e083e.png'), a('016c5.png'), a('f1afc.png')],
}

const circleAvatars = {
  Anya: a('5828b.svg'),
  Jules: a('050f8.svg'),
  Mira: a('2172f.svg'),
  Nico: a('79c9b.svg'),
  Sven: a('03948.svg'),
  Lars: a('f4918.svg'),
  Ines: a('df415.svg'),
  Rolf: a('e48f9.svg'),
  Greta: a('4be25.svg'),
}

type Participant = { name: string; avatar: string; paid: boolean }
type Bill = {
  id: string
  category: string
  time: string
  title: string
  total: number
  participants: Participant[]
}

const rupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

const initialBills: Bill[] = [
  {
    id: 'b1',
    category: 'Resto & Kafe',
    time: 'Hari ini, 13:40',
    title: 'Kopi Nako Tembalang',
    total: 185000,
    participants: [
      { name: 'Sofia', avatar: a('e75cb.svg'), paid: true },
      { name: 'Luca', avatar: a('f0377.svg'), paid: true },
      { name: 'Elena', avatar: a('b0c11.svg'), paid: true },
      { name: 'Mateo', avatar: a('e85ce.svg'), paid: false },
      { name: 'Isolde', avatar: a('0b9a3.svg'), paid: false },
    ],
  },
  {
    id: 'b2',
    category: 'Resto & Kafe',
    time: 'Kemarin, 19:12',
    title: 'Mie Gacoan Banyumanik',
    total: 152000,
    participants: [
      { name: 'Anya', avatar: circleAvatars.Anya, paid: true },
      { name: 'Jules', avatar: circleAvatars.Jules, paid: false },
      { name: 'Mira', avatar: circleAvatars.Mira, paid: false },
    ],
  },
  {
    id: 'b3',
    category: 'Resto & Kafe',
    time: 'Sab, 12:05',
    title: 'Sate Pak Kumis',
    total: 96000,
    participants: [
      { name: 'Nico', avatar: circleAvatars.Nico, paid: true },
      { name: 'Sven', avatar: circleAvatars.Sven, paid: false },
    ],
  },
  {
    id: 'b4',
    category: 'Resto & Kafe',
    time: 'Jum, 20:30',
    title: 'Warung Bu Rini',
    total: 74000,
    participants: [
      { name: 'Lars', avatar: circleAvatars.Lars, paid: true },
      { name: 'Ines', avatar: circleAvatars.Ines, paid: true },
    ],
  },
]

const talangan = {
  masuk: { count: 4, amount: 345000, note: 'Dari 4 teman di 2 sesi bill' },
  tagihan: { count: 3, amount: 65000, note: '1 tagihan belum kamu bayar' },
}

/** Every image the home screen can show. */
const HOME_ASSETS = [
  ...Object.values(img).flat(),
  ...Object.values(circleAvatars),
  ...initialBills.flatMap((b) => b.participants.map((p) => p.avatar)),
]

/** Faces that are only requested once text using them renders; loading them up front avoids a late swap. */
const FONT_FACES = ["400 16px 'Outfit:Regular'", "500 16px 'Outfit:Medium'", "600 16px 'Outfit:SemiBold'", "16px 'Courgette:Regular'"]
const loadFonts = () =>
  document.fonts ? Promise.all(FONT_FACES.map((f) => document.fonts.load(f).catch(() => undefined))) : Promise.resolve()

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Animates from the currently displayed value to `target` (ease-out cubic). */
function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(target)
  const valueRef = useRef(target)

  useEffect(() => {
    const from = valueRef.current
    if (from === target || prefersReducedMotion()) {
      valueRef.current = target
      setValue(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = Math.round(from + (target - from) * eased)
      valueRef.current = next
      setValue(next)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

function TalanganCard({
  tab,
  onTabChange,
  tagihanPaid,
  reminded,
  onRemind,
  onPay,
}: {
  tab: 'masuk' | 'tagihan'
  onTabChange: (t: 'masuk' | 'tagihan') => void
  tagihanPaid: boolean
  reminded: boolean
  onRemind: () => void
  onPay: () => void
}) {
  const isMasuk = tab === 'masuk'
  const tagihanAmount = tagihanPaid ? 0 : talangan.tagihan.amount
  const amount = useCountUp(isMasuk ? talangan.masuk.amount : tagihanAmount)
  const counts = { masuk: talangan.masuk.count, tagihan: talangan.tagihan.count }

  return (
    <div className="flex w-full flex-col rounded-[12px] border border-[#ececec] bg-white p-[12px]">
      <div className="flex w-full flex-col gap-[14px]">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-[4px]">
            <Icon src={img.cashOut} size={18} />
            <p
              key={tab}
              className="font-['Outfit:Regular'] text-[14px] leading-[normal] font-normal whitespace-nowrap text-[#054131] [animation:fade-up_260ms_ease-out]"
            >
              {isMasuk ? 'Perlu Ditagih' : 'Kamu Ditagih'}
            </p>
          </div>
          <div role="tablist" className="flex items-center gap-[10px] rounded-[8px] bg-white">
            {(['masuk', 'tagihan'] as const).map((key) => {
              const active = tab === key
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => onTabChange(key)}
                  className={`flex items-center justify-center gap-[6px] rounded-[6px] py-[4px] pr-[4px] pl-[8px] transition-colors duration-200 ${
                    active
                      ? `bg-[#a6bb18] ${key === 'tagihan' ? 'border-[0.5px] border-[#ececec]' : ''}`
                      : 'border-[0.5px] border-[#ececec] bg-white hover:bg-[#fafaf3]'
                  }`}
                >
                  <span
                    className={`font-['Outfit:Regular'] text-[12px] leading-[normal] font-normal whitespace-nowrap transition-colors duration-200 ${
                      active ? 'text-white' : 'text-[#8e8e8e]'
                    }`}
                  >
                    {key === 'masuk' ? 'Uang Masuk' : 'Tagihan'}
                  </span>
                  <span
                    className={`flex size-[16px] items-center justify-center rounded-[4px] text-center font-['Outfit:Regular'] text-[12px] leading-[normal] font-normal transition-colors duration-200 ${
                      active ? 'bg-white text-[#a6bb18]' : 'bg-[#f2f3e6] text-[#8e8e8e]'
                    }`}
                  >
                    {counts[key]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-[10px]">
            <p
              aria-live="polite"
              className="font-['Outfit:SemiBold'] text-[32px] leading-[normal] font-semibold text-[#054131] tabular-nums"
            >
              {rupiah(amount)}
            </p>
            <div key={`${tab}-${tagihanPaid}`} className="flex h-[24px] items-center gap-[6px] [animation:fade-up_260ms_ease-out]">
              {isMasuk && (
                <div className="flex items-center">
                  {img.stack.map((s, i, arr) => (
                    <span
                      key={s}
                      className={`relative block size-[24px] shrink-0 ${i < arr.length - 1 ? 'mr-[-12px]' : ''}`}
                    >
                      <Img src={s} skeleton="rounded-full ring-2 ring-white" />
                    </span>
                  ))}
                </div>
              )}
              <p className="font-['Outfit:Regular'] text-[14px] leading-[normal] font-normal text-[#8e8e8e]">
                {isMasuk ? talangan.masuk.note : tagihanPaid ? 'Semua tagihan sudah lunas' : talangan.tagihan.note}
              </p>
            </div>
          </div>

          {isMasuk ? (
            <button
              key="remind"
              onClick={onRemind}
              className="flex shrink-0 items-center gap-[6px] rounded-[8px] bg-[#f2f3e6] px-[14px] py-[8px] transition hover:bg-[#e8ead2] active:scale-[0.98] [animation:fade-up_260ms_ease-out]"
            >
              <Icon src={img.bell} size={18} />
              <span className="font-['Outfit:Medium'] text-[14px] leading-[normal] font-medium whitespace-nowrap text-[#a6bb18]">
                {reminded ? 'Terkirim' : 'Ingatkan'}
              </span>
            </button>
          ) : (
            <button
              key="pay"
              onClick={onPay}
              disabled={tagihanPaid}
              className="flex shrink-0 items-center rounded-[8px] bg-[#f2f3e6] px-[14px] py-[8px] transition hover:bg-[#e8ead2] active:scale-[0.98] disabled:cursor-default disabled:opacity-60 disabled:hover:bg-[#f2f3e6] [animation:fade-up_260ms_ease-out]"
            >
              <span className="font-['Outfit:Medium'] text-[14px] leading-[normal] font-medium whitespace-nowrap text-[#a6bb18]">
                {tagihanPaid ? 'Lunas' : 'Bayar Sekarang'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Icon({ src, size, round }: { src: string; size: number; round?: boolean }) {
  return (
    <span className="relative block shrink-0" style={{ width: size, height: size }}>
      <Img src={src} skeleton={round ? 'rounded-full' : 'rounded-[5px]'} />
    </span>
  )
}

const SESSION_KEY = 'kloop.session'

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export default function App() {
  const [session, setSession] = useState<Session | null>(readSession)
  const [splashDone, setSplashDone] = useState(false)
  const [contentReady, setContentReady] = useState(false)
  const [toast, notify] = useToast()

  // The splash stays up until fonts and the first screen's images are ready.
  useEffect(() => {
    let alive = true
    const assets = session ? [img.profile, img.illustration, ...img.stack] : AUTH_ASSETS
    Promise.race([
      Promise.all([loadFonts(), ...assets.map(preloadImage)]),
      new Promise((r) => setTimeout(r, 6000)),
    ]).then(() => {
      if (!alive) return
      setContentReady(true)
      // Warm the screens that come next so they open without placeholders.
      preloadWhenIdle([...HOME_ASSETS, ...SCAN_ASSETS, ...AUTH_ASSETS])
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stage = !splashDone ? 'splash' : session ? 'app' : 'auth'
  const { shown, leaving } = useSwitch(stage, 320)
  const finishSplash = useCallback(() => setSplashDone(true), [])

  const signIn = (s: Session, message: string) => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    } catch {
      /* storage unavailable: session lasts for this tab only */
    }
    setSession(s)
    setTimeout(() => notify(message), 500)
  }

  const signOut = () => {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    setSession(null)
  }

  return (
    <>
      <div
        key={shown}
        className={
          leaving
            ? '[animation:stage-out_320ms_cubic-bezier(0.4,0,1,1)_forwards]'
            : '[animation:stage-in_520ms_cubic-bezier(0.2,0.8,0.2,1)_both]'
        }
      >
        {shown === 'splash' && <Splash ready={contentReady} onDone={finishSplash} />}
        {shown === 'auth' && <AuthFlow onAuthed={signIn} />}
        {shown === 'app' && session && <Home session={session} onLogout={signOut} notify={notify} />}
      </div>
      <Toast message={toast} />
    </>
  )
}

function Home({ session, onLogout, notify }: { session: Session; onLogout: () => void; notify: (m: string) => void }) {
  const setToast = notify
  const [tab, setTab] = useState<'masuk' | 'tagihan'>('masuk')
  const [bills, setBills] = useState(initialBills)
  const [showAll, setShowAll] = useState(false)
  const [reminded, setReminded] = useState<Record<string, boolean>>({})
  const [circle, setCircle] = useState(Object.keys(circleAvatars) as (keyof typeof circleAvatars)[])
  const [managing, setManaging] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const billsRef = useRef<HTMLElement>(null)
  const [jenisOpen, setJenisOpen] = useState(false)
  const [jenisMode, setJenisMode] = useState<InputMode>('scan')
  const [jenis, setJenis] = useState<Jenis>(jenisOptions[0])
  const [screen, setScreen] = useState<'home' | 'scan' | 'loading'>('home')
  const [profileOpen, setProfileOpen] = useState(false)
  const scanImage = useRef<string | null>(null)
  const { shown: shownScreen, leaving } = useSwitch(screen)

  const openJenis = (mode: InputMode) => {
    setJenisMode(mode)
    setJenisOpen(true)
  }

  const [tagihanPaid, setTagihanPaid] = useState(false)

  const remindParticipant = (billId: string, name: string) => {
    setReminded((r) => ({ ...r, [`${billId}-${name}`]: true }))
    setToast(`Pengingat terkirim ke ${name}`)
  }

  const togglePaid = (billId: string, name: string) =>
    setBills((bs) =>
      bs.map((b) =>
        b.id !== billId
          ? b
          : { ...b, participants: b.participants.map((p) => (p.name === name ? { ...p, paid: !p.paid } : p)) },
      ),
    )

  const addManualBill = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const title = String(data.get('title') || '').trim()
    const total = Number(String(data.get('total') || '').replace(/\D/g, ''))
    if (!title || !total) return
    const now = new Date()
    setBills((bs) => [
      {
        id: `m${now.getTime()}`,
        category: jenis.title,
        time: `Hari ini, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')}`,
        title,
        total,
        participants: circle.slice(0, 3).map((n) => ({ name: n, avatar: circleAvatars[n], paid: false })),
      },
      ...bs,
    ])
    setSheetOpen(false)
    setToast('Bill baru ditambahkan')
  }

  const selectJenis = (j: Jenis) => {
    setJenis(j)
    setJenisOpen(false)
    // let the sheet finish sliding away before the next view appears
    setTimeout(() => (jenisMode === 'scan' ? setScreen('scan') : setSheetOpen(true)), 240)
  }

  const finishScan = useCallback(() => {
    if (scanImage.current?.startsWith('blob:')) URL.revokeObjectURL(scanImage.current)
    scanImage.current = null
    const now = new Date()
    setBills((bs) => [
      {
        id: `s${now.getTime()}`,
        category: jenis.title,
        time: `Hari ini, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')}`,
        title: 'Struk hasil scan',
        total: 128500,
        participants: circle.slice(0, 3).map((n) => ({ name: n, avatar: circleAvatars[n], paid: false })),
      },
      ...bs,
    ])
    setScreen('home')
    setToast('Struk berhasil dipindai')
  }, [jenis, circle])

  if (shownScreen === 'scan')
    return (
      <div key="scan" className={screenClass(leaving)}>
        <ScanScreen
          onBack={() => setScreen('home')}
          onManual={() => {
            setScreen('home')
            setTimeout(() => setSheetOpen(true), 360)
          }}
          onCaptured={(src) => {
            scanImage.current = src
            setScreen('loading')
          }}
          notify={setToast}
        />
      </div>
    )

  if (shownScreen === 'loading')
    return (
      <div key="loading" className={screenClass(leaving)}>
        <LoadingScreen image={scanImage.current} onBack={() => setScreen('scan')} onDone={finishScan} />
      </div>
    )

  const [featured, ...others] = bills

  return (
    <div key="home" className={`min-h-dvh w-full bg-white text-[#054131] ${screenClass(leaving)}`}>
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-[24px] pb-[48px]">
        {/* Header */}
        <header className="relative z-30 flex items-center justify-between px-[16px] pt-[24px] pb-[14px] md:pt-[32px] [animation:fade-down_420ms_cubic-bezier(0.2,0.8,0.2,1)_both]">
          <ProfileMenu
            open={profileOpen}
            onToggle={() => setProfileOpen((o) => !o)}
            onClose={() => setProfileOpen(false)}
            session={session}
            onLogout={onLogout}
          />
          <p className="font-['Courgette:Regular'] text-[26px] leading-[normal] tracking-[-0.3px] whitespace-nowrap text-[#054131]">
            Kloop
          </p>
          <button
            aria-label="Lihat tagihan"
            onClick={() => billsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="flex items-center rounded-[999px] bg-[#f8f8ec] p-[8px] transition hover:bg-[#eef0d6]"
          >
            <Icon src={img.billList} size={24} />
          </button>
        </header>

        <main className="grid grid-cols-1 gap-[40px] md:grid-cols-2 md:gap-x-[32px] md:px-[16px]">
          <div className="stagger flex flex-col gap-[40px]">
            {/* Status Talangan */}
            <section className="flex flex-col gap-[12px] px-[16px] md:px-0">
              <h2 className="font-['Outfit:Medium'] text-[18px] leading-[normal] font-medium tracking-[-0.2px]">
                Status Talangan
              </h2>
              <TalanganCard
                tab={tab}
                onTabChange={setTab}
                tagihanPaid={tagihanPaid}
                reminded={!!reminded.bulk}
                onRemind={() => {
                  setReminded((r) => ({ ...r, bulk: true }))
                  setToast(`Pengingat terkirim ke ${talangan.masuk.count} teman`)
                }}
                onPay={() => {
                  setTagihanPaid(true)
                  setToast(`Pembayaran ${rupiah(talangan.tagihan.amount)} berhasil`)
                }}
              />
            </section>

            {/* New expense CTA */}
            <section className="flex items-center gap-[24px] px-[16px] md:px-0">
              <div className="relative h-[110px] w-[96px] shrink-0">
                <Img src={img.illustration} skeleton="rounded-[14px]" />
              </div>
              <div className="flex min-w-px flex-1 flex-col gap-[18px]">
                <div className="flex flex-col gap-[8px]">
                  <p className="font-['Outfit:Medium'] text-[16px] leading-[normal] font-medium">
                    Ada pengeluaran bareng baru?
                  </p>
                  <p className="max-w-[254px] font-['Outfit:Regular'] text-[12px] leading-[18px] font-normal text-[#8e8e8e]">
                    Foto struk belanja, resto, atau tiket biar sistem yang bagiin nominalnya secara adil.
                  </p>
                </div>
                <div className="flex items-center gap-[10px]">
                  <button
                    onClick={() => openJenis('manual')}
                    className="flex min-w-px flex-1 items-center gap-[6px] rounded-[8px] bg-white px-[12px] py-[8px] transition hover:bg-[#f8f8ec]"
                  >
                    <Icon src={img.docAdd} size={18} />
                    <span className="font-['Outfit:Medium'] text-[14px] leading-[normal] font-medium whitespace-nowrap text-[#a6bb18]">
                      Input manual
                    </span>
                  </button>
                  <button
                    onClick={() => openJenis('scan')}
                    className="flex min-w-px flex-1 items-center justify-center gap-[6px] rounded-[8px] bg-[#a6bb18] px-[12px] py-[8px] transition hover:bg-[#97ab12] active:scale-[0.98]"
                  >
                    <Icon src={img.scan} size={18} />
                    <span className="font-['Outfit:Medium'] text-[14px] leading-[normal] font-medium whitespace-nowrap text-white">
                      Foto Bill
                    </span>
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div className="stagger flex flex-col gap-[40px]">
            {/* Tagihan Berjalan */}
            <section ref={billsRef} className="flex scroll-mt-4 flex-col gap-[14px] px-[16px] md:px-0">
              <div className="flex items-center justify-between font-['Outfit:Medium'] leading-[normal] font-medium tracking-[-0.2px] whitespace-nowrap">
                <h2 className="text-[18px]">Tagihan Berjalan</h2>
                <button
                  onClick={() => setShowAll((s) => !s)}
                  className="text-[14px] text-[#a6bb18] hover:underline"
                >
                  {showAll ? 'Tutup' : `Lihat Semua (${bills.length})`}
                </button>
              </div>

              {featured && (
                <BillCard
                  bill={featured}
                  reminded={reminded}
                  onRemind={remindParticipant}
                  onTogglePaid={togglePaid}
                />
              )}

              {showAll &&
                others.map((b) => (
                  <BillCard
                    key={b.id}
                    bill={b}
                    reminded={reminded}
                    onRemind={remindParticipant}
                    onTogglePaid={togglePaid}
                  />
                ))}
            </section>

            {/* Circle Kamu */}
            <section className="flex flex-col gap-[16px] px-[16px] md:px-0">
              <div className="flex items-center justify-between">
                <h2 className="font-['Outfit:Medium'] text-[18px] leading-[normal] font-medium tracking-[-0.2px]">
                  Circle Kamu
                </h2>
                <button
                  onClick={() => setManaging((m) => !m)}
                  className="flex items-center justify-center gap-[4px] rounded-[6px] bg-white transition hover:opacity-80"
                >
                  <Icon src={img.usersGroup} size={18} />
                  <span className="font-['Outfit:Regular'] text-[14px] leading-[normal] font-normal whitespace-nowrap text-[#a6bb18]">
                    {managing ? 'Selesai' : 'Manage'}
                  </span>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-[14px]">
                {circle.map((name) => (
                  <div key={name} className="flex items-center gap-[6px]">
                    <Icon src={circleAvatars[name]} size={24} round />
                    <p className="font-['Outfit:Regular'] text-[14px] leading-[normal] font-normal tracking-[-0.2px] whitespace-nowrap">
                      {name}
                    </p>
                    {managing && (
                      <button
                        aria-label={`Hapus ${name}`}
                        onClick={() => setCircle((c) => c.filter((n) => n !== name))}
                        className="ml-auto flex size-[18px] items-center justify-center rounded-full bg-[#f2f3e6] text-[#8e8e8e] hover:bg-[#fde4e4] hover:text-[#d14343]"
                      >
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
                          <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                {circle.length === 0 && (
                  <p className="col-span-3 font-['Outfit:Regular'] text-[14px] text-[#8e8e8e]">Circle kamu masih kosong.</p>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} labelledBy="manual-title">
          <form onSubmit={addManualBill} className="flex flex-col gap-[14px] p-[20px] pt-[8px] pb-[32px]">
            <div className="mx-auto h-[4px] w-[64px] shrink-0 rounded-[12px] bg-[#dedede]" />
            <div className="flex items-center gap-[6px] pt-[8px]">
              <p id="manual-title" className="font-['Outfit:Medium'] text-[18px] font-medium tracking-[-0.2px]">Input manual</p>
              <span className="rounded-[6px] border border-[#ececec] bg-[#f9f9f9] px-[8px] pb-px font-['Outfit:Regular'] text-[14px] leading-[18px] text-[#054131]">
                {jenis.title}
              </span>
            </div>
            <label className="flex flex-col gap-[6px] font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
              Nama tempat
              <input
                name="title"
                required
                autoFocus
                placeholder="cth. Kopi Nako Tembalang"
                className="rounded-[8px] border border-[#ececec] px-[12px] py-[10px] text-[14px] text-[#054131] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#a6bb18] focus:shadow-[0_0_0_3px_rgba(166,187,24,0.14)]"
              />
            </label>
            <label className="flex flex-col gap-[6px] font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
              Total (Rp)
              <input
                name="total"
                required
                inputMode="numeric"
                placeholder="185000"
                className="rounded-[8px] border border-[#ececec] px-[12px] py-[10px] text-[14px] text-[#054131] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[#a6bb18] focus:shadow-[0_0_0_3px_rgba(166,187,24,0.14)]"
              />
            </label>
            <div className="flex gap-[10px] pt-[4px]">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex-1 rounded-[8px] bg-[#f2f3e6] py-[10px] font-['Outfit:Medium'] text-[14px] font-medium text-[#a6bb18] transition duration-200 hover:bg-[#e8ead2] active:scale-[0.98]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 rounded-[8px] bg-[#a6bb18] py-[10px] font-['Outfit:Medium'] text-[14px] font-medium text-white transition duration-200 hover:bg-[#97ab12] active:scale-[0.98]"
              >
                Simpan
              </button>
            </div>
          </form>
      </Sheet>

      <JenisSheet open={jenisOpen} mode={jenisMode} onClose={() => setJenisOpen(false)} onSelect={selectJenis} />
    </div>
  )
}

function BillCard({
  bill,
  reminded,
  onRemind,
  onTogglePaid,
}: {
  bill: Bill
  reminded: Record<string, boolean>
  onRemind: (billId: string, name: string) => void
  onTogglePaid: (billId: string, name: string) => void
}) {
  const paidCount = bill.participants.filter((p) => p.paid).length
  return (
    <div className="flex w-full flex-col gap-[12px] rounded-[10px] border border-[#ececec] bg-white p-[12px] [animation:fade-up_360ms_cubic-bezier(0.2,0.8,0.2,1)_both]">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-center gap-[4px]">
          <Icon src={img.chefHat} size={18} />
          <p className="font-['Outfit:Medium'] text-[14px] leading-[normal] font-medium tracking-[-0.2px] whitespace-nowrap text-[#2233f5]">
            {bill.category}
          </p>
        </div>
        <p className="font-['Outfit:Regular'] text-[12px] leading-[normal] font-normal tracking-[-0.2px] whitespace-nowrap text-[#8e8e8e]">
          {bill.time}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 font-['Outfit:Medium'] leading-[normal] font-medium tracking-[-0.2px]">
        <p className="truncate text-[16px]">{bill.title}</p>
        <p className="shrink-0 text-[20px]">{rupiah(bill.total)}</p>
      </div>
      <div className="relative h-0 w-full">
        <div className="absolute inset-[-2px_0_0_0]">
          <img alt="" className="block size-full max-w-none" src={img.dashedLine} />
        </div>
      </div>
      <div className="flex flex-col gap-[8px]">
        <p className="font-['Outfit:Regular'] text-[12px] leading-[normal] font-normal tracking-[-0.2px] text-[#a6bb18]">
          {paidCount === bill.participants.length
            ? 'Semua sudah lunas'
            : `${paidCount} dari ${bill.participants.length} sudah lunas`}
        </p>
        <div className="grid grid-cols-3 gap-[12px]">
          {bill.participants.map((p) => {
            const key = `${bill.id}-${p.name}`
            return (
              <div key={p.name} className="flex items-center gap-[6px]">
                <button
                  onClick={() => onTogglePaid(bill.id, p.name)}
                  title={p.paid ? 'Tandai belum lunas' : 'Tandai lunas'}
                  className="flex items-center gap-[6px] rounded-[4px] hover:opacity-80"
                >
                  <Icon src={p.avatar} size={24} round />
                  <span
                    className={`font-['Outfit:Regular'] text-[14px] leading-[normal] font-normal tracking-[-0.2px] whitespace-nowrap ${
                      p.paid ? 'text-[#2acb70]' : 'text-[#054131]'
                    }`}
                  >
                    {p.name}
                  </span>
                </button>
                {p.paid ? (
                  <span className="relative size-[20px] shrink-0 overflow-clip">
                    <span className="absolute inset-[8.33%]">
                      <Img src={img.verified} alt="Lunas" skeleton="rounded-full" />
                    </span>
                  </span>
                ) : (
                  <button
                    aria-label={`Ingatkan ${p.name}`}
                    onClick={() => onRemind(bill.id, p.name)}
                    className={`flex items-center rounded-[6px] p-[4px] transition ${
                      reminded[key] ? 'bg-[#a6bb18]/25' : 'bg-[#f2f3e6] hover:bg-[#e8ead2]'
                    }`}
                  >
                    <Icon src={img.bellSmall} size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ProfileMenu({
  open,
  onToggle,
  onClose,
  session,
  onLogout,
}: {
  open: boolean
  onToggle: () => void
  onClose: () => void
  session: Session
  onLogout: () => void
}) {
  const { mounted, closing } = usePresence(open, 180)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && onClose()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Profil"
        aria-expanded={open}
        onClick={onToggle}
        className="relative block size-[40px] shrink-0 rounded-full transition duration-200 hover:opacity-80 active:scale-95"
      >
        <Img src={img.profile} skeleton="rounded-full" />
      </button>
      {mounted && (
        <div
          role="menu"
          className={`absolute top-[48px] left-0 w-[220px] origin-top-left rounded-[12px] border border-[#ececec] bg-white p-[6px] shadow-[0_12px_32px_rgba(5,65,49,0.12)] ${
            closing ? '[animation:menu-out_180ms_ease-in_forwards]' : '[animation:menu-in_220ms_cubic-bezier(0.2,0.8,0.2,1)]'
          }`}
        >
          <div className="px-[10px] pt-[8px] pb-[10px]">
            <p className="font-['Outfit:Medium'] text-[14px] leading-[normal] font-medium text-[#054131]">{session.name}</p>
            {session.phone && (
              <p className="mt-[2px] font-['Outfit:Regular'] text-[12px] leading-[normal] text-[#8e8e8e]">{session.phone}</p>
            )}
          </div>
          <div className="h-px bg-[#ececec]" />
          <button
            role="menuitem"
            onClick={onLogout}
            className="mt-[6px] w-full rounded-[8px] px-[10px] py-[8px] text-left font-['Outfit:Regular'] text-[14px] text-[#d14343] transition-colors duration-200 hover:bg-[#fdf1f1]"
          >
            Keluar
          </button>
        </div>
      )}
    </div>
  )
}
