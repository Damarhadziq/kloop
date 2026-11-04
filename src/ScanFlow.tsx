import { useEffect, useRef, useState } from 'react'
import { Img, LogoLoader, Sheet, preloadImage } from './ui'

const a = (f: string) => `/assets/${f}`

const icons = {
  close: a('8423a.svg'),
  back: a('5ceb4.svg'),
  flashlight: a('72e1b.svg'),
  gallery: a('140e3.svg'),
}

export type InputMode = 'manual' | 'scan'

export const jenisOptions = [
  { id: 'resto', title: 'Resto & Kafe', desc: 'Hitung per menu pesanan dan pajak/service.', icon: a('18af0.svg') },
  { id: 'jajan', title: 'Jajanan & Kaki Lima', desc: 'Catat cepat pengeluaran jajan tanpa rincian menu.', icon: a('687d1.svg') },
  { id: 'flat', title: 'Bagi Rata (Flat)', desc: 'Satu total langsung dibagi rata ke teman terpilih.', icon: a('c0e45.svg') },
] as const

export type Jenis = (typeof jenisOptions)[number]

/** Every image the scan flow can show, for warming the cache ahead of time. */
export const SCAN_ASSETS = [...Object.values(icons), ...jenisOptions.map((j) => j.icon)]

function Glyph({ src, size = 24 }: { src: string; size?: number }) {
  return (
    <span className="relative block shrink-0" style={{ width: size, height: size }}>
      <Img src={src} skeleton="rounded-[5px]" />
    </span>
  )
}

function RoundButton({
  label,
  icon,
  onClick,
  active,
}: {
  label: string
  icon: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`flex items-center rounded-[999px] p-[8px] transition active:scale-95 ${
        active ? 'bg-[#a6bb18]/30 ring-2 ring-[#a6bb18]' : 'bg-[#f8f8ec] hover:bg-[#eef0d6]'
      }`}
    >
      <Glyph src={icon} />
    </button>
  )
}

/* ---------------- BOTTOM_SHEET_JENIS ---------------- */

export function JenisSheet({
  open,
  mode,
  onClose,
  onSelect,
}: {
  open: boolean
  mode: InputMode
  onClose: () => void
  onSelect: (j: Jenis) => void
}) {
  return (
    <Sheet open={open} onClose={onClose} labelledBy="jenis-title" className="flex flex-col items-center gap-[16px] px-[16px] pt-[8px] pb-[40px]">
        <div className="h-[4px] w-[64px] shrink-0 rounded-[12px] bg-[#dedede]" />
        <div className="flex w-full flex-col gap-[24px]">
          <div className="flex w-full items-center justify-center gap-[10px]">
            <div className="flex min-w-px flex-1 items-center gap-[6px]">
              <p id="jenis-title" className="font-['Outfit:Medium'] text-[18px] leading-[normal] font-medium text-[#054131]">
                Mau bagi tagihan jenis apa?
              </p>
              <div className="flex shrink-0 items-center justify-center rounded-[6px] border border-[#ececec] bg-[#f9f9f9] px-[8px] pb-px">
                <p className="font-['Outfit:Regular'] text-[14px] leading-[18px] font-normal whitespace-nowrap text-[#054131]">
                  {mode === 'scan' ? 'Scan' : 'Manual'}
                </p>
              </div>
            </div>
            <button aria-label="Tutup" onClick={onClose} className="shrink-0 rounded-full transition hover:opacity-80">
              <Glyph src={icons.close} />
            </button>
          </div>
          <div className="stagger flex w-full flex-col gap-[12px]">
            {jenisOptions.map((j) => (
              <button
                key={j.id}
                onClick={() => onSelect(j)}
                className="flex w-full items-center gap-[10px] rounded-[14px] border border-[#ececec] bg-[#fefef8] p-[12px] text-left transition duration-200 hover:border-[#a6bb18] hover:bg-[#f8f8ec] active:scale-[0.99]"
              >
                <Glyph src={j.icon} />
                <span className="flex min-w-px flex-1 flex-col gap-[4px] leading-[normal]">
                  <span className="font-['Outfit:Medium'] text-[14px] font-medium text-[#a6bb18]">{j.title}</span>
                  <span className="font-['Outfit:Regular'] text-[12px] font-normal text-[#8e8e8e]">{j.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
    </Sheet>
  )
}

/* ---------------- SCAN STRUK (camera) ---------------- */

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean }

export function ScanScreen({
  onBack,
  onManual,
  onCaptured,
  notify,
}: {
  onBack: () => void
  onManual: () => void
  onCaptured: (image: string) => void
  notify: (msg: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [camera, setCamera] = useState<'loading' | 'ready' | 'unavailable'>('loading')
  const [torch, setTorch] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera('unavailable')
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((t) => t.stop())
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setCamera('ready')
      })
      .catch(() => !cancelled && setCamera('unavailable'))
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    const caps = track?.getCapabilities?.() as TorchCapabilities | undefined
    if (!track || !caps?.torch) {
      notify('Senter tidak didukung di perangkat ini')
      return
    }
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] })
      setTorch((t) => !t)
    } catch {
      notify('Gagal menyalakan senter')
    }
  }

  const capture = () => {
    const video = videoRef.current
    if (!video || camera !== 'ready') return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    onCaptured(canvas.toDataURL('image/jpeg', 0.85))
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-white text-[#054131]">
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-[16px] pt-[24px] pb-[24px] md:pt-[32px]">
        <div className="flex w-full items-center justify-between">
          <RoundButton label="Kembali" icon={icons.back} onClick={onBack} />
          <div className="flex items-center gap-[14px]">
            <RoundButton label={torch ? 'Matikan senter' : 'Nyalakan senter'} icon={icons.flashlight} onClick={toggleTorch} active={torch} />
            <RoundButton label="Pilih dari galeri" icon={icons.gallery} onClick={() => fileRef.current?.click()} />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) onCaptured(URL.createObjectURL(f))
              }}
            />
          </div>
        </div>

        <div className="mt-[54px] flex w-full flex-col items-center gap-[6px] text-center leading-[normal] tracking-[-0.2px]">
          <p className="font-['Outfit:Medium'] text-[18px] font-medium text-[#054131]">Posisikan struk belanja di dalam kotak</p>
          <p className="font-['Outfit:Regular'] text-[14px] font-normal text-[#8e8e8e]">Pastikan nama menu, harga, dan total terlihat jelas</p>
        </div>

        <div className="relative mt-[24px] min-h-[360px] w-full flex-1 overflow-clip rounded-[24px] bg-[#d9d9d9] md:max-h-[620px]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${camera === 'ready' ? 'opacity-100' : 'opacity-0'}`}
          />
          {camera === 'ready' && (
            <>
              <span className="pointer-events-none absolute inset-x-[24px] top-[24px] h-[2px] rounded-full bg-[#a6bb18] shadow-[0_0_12px_#a6bb18] [animation:scan-line_2.4s_ease-in-out_infinite]" />
              <button
                aria-label="Ambil foto struk"
                onClick={capture}
                className="absolute bottom-[20px] left-1/2 flex size-[64px] -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-white/90 transition active:scale-95"
              >
                <span className="size-[50px] rounded-full bg-white transition hover:bg-[#f8f8ec]" />
              </button>
            </>
          )}
          {camera === 'unavailable' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-[12px] p-[24px] text-center">
              <p className="font-['Outfit:Regular'] text-[14px] text-[#054131]">Kamera tidak bisa diakses.</p>
              <button
                onClick={() => fileRef.current?.click()}
                className="rounded-[8px] bg-[#a6bb18] px-[14px] py-[8px] font-['Outfit:Medium'] text-[14px] font-medium text-white transition hover:bg-[#97ab12]"
              >
                Pilih foto dari galeri
              </button>
            </div>
          )}
        </div>

        <div className="mt-[24px] flex items-center justify-center gap-[6px] text-center text-[16px] leading-[normal] tracking-[-0.2px] whitespace-nowrap">
          <p className="font-['Outfit:Regular'] font-normal text-[#054131]">Struk rusak?</p>
          <button onClick={onManual} className="font-['Outfit:Medium'] font-medium text-[#a6bb18] hover:underline">
            Input manual aja
          </button>
        </div>

        <p className="mt-auto pt-[48px] text-center font-['Courgette:Regular'] text-[26px] leading-[normal] tracking-[-0.3px] text-[#054131]">
          Kloop
        </p>
      </div>
    </div>
  )
}

/* ---------------- SCAN STRUK (loading) ---------------- */

const MIN_PROCESSING_MS = 1800

export function LoadingScreen({ image, onBack, onDone }: { image: string | null; onBack: () => void; onDone: () => void }) {
  const [ready, setReady] = useState(false)

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

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-white" aria-busy={!ready}>
      <div className="mx-auto w-full max-w-[560px] px-[16px] pt-[24px] md:pt-[32px]">
        <RoundButton label="Batalkan" icon={icons.back} onClick={onBack} />
      </div>
      <div role="status" className="absolute top-[calc(50%-39.5px)] left-1/2 flex w-[152px] -translate-1/2 flex-col items-center gap-[6px]">
        <LogoLoader ready={ready} onDone={onDone} width={88} />
        <p className="w-full text-center font-['Outfit:Regular'] text-[16px] leading-[normal] font-normal tracking-[-0.2px] whitespace-nowrap text-[#8e8e8e] [animation:fade-in_500ms_ease-out_300ms_both]">
          tunggu sebentar ya....
        </p>
      </div>
    </div>
  )
}
