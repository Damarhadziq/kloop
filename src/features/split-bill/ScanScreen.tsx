import { useEffect, useRef, useState } from 'react'
import { Img } from '@/components/ui'
import { SCAN_ICONS } from '@/services/bill.service'

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean }

function Glyph({ src, size = 24 }: { src: string; size?: number }) {
  return (
    <span className="relative block shrink-0" style={{ width: size, height: size }}>
      <Img src={src} skeleton="rounded-[5px]" />
    </span>
  )
}

export function ScanRoundButton({
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
      type="button"
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
          <ScanRoundButton label="Kembali" icon={SCAN_ICONS.back} onClick={onBack} />
          <div className="flex items-center gap-[14px]">
            <ScanRoundButton
              label={torch ? 'Matikan senter' : 'Nyalakan senter'}
              icon={SCAN_ICONS.flashlight}
              onClick={toggleTorch}
              active={torch}
            />
            <ScanRoundButton label="Pilih dari galeri" icon={SCAN_ICONS.gallery} onClick={() => fileRef.current?.click()} />
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
          <p className="font-['Outfit:Regular'] text-[14px] font-normal text-[#8e8e8e]">
            Pastikan nama menu, harga, dan total terlihat jelas
          </p>
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

