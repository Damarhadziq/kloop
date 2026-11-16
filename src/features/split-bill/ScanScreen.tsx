import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RoundIconButton } from '@/components/ui'
import { SCAN_ICONS } from '@/services/bill.service'
import {
  SCAN_SIMULATION_PRESETS,
  analyzeReceiptImage,
  analyzeVideoFrame,
  generateSimulatedReceiptImage,
  type ScanSimulationPreset,
} from '@/services/scanner.service'
import type { ReceiptQualityMetrics, ReceiptScanAnalysisResult, ReceiptValidationIssue } from '@/types'
import { ReceiptValidationModal } from './ReceiptValidationModal'

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean }

export const ScanRoundButton = ({
  label,
  icon,
  onClick,
  active,
}: {
  label: string
  icon: string
  onClick: () => void
  active?: boolean
}) => <RoundIconButton label={label} src={icon} onClick={onClick} active={active} skeleton="rounded-[5px]" />

const SCAN_STEPS = [
  'Mendeteksi tepi kertas & pencahayaan struk...',
  'Memindai baris menu & nominal harga (OCR)...',
  'Memvalidasi kelengkapan total & pajak...',
] as const

export function ScanScreen({
  categoryTitle = 'Resto & Kafe',
  participantIds = ['Anya', 'Jules', 'Mira'],
  onBack,
  onManual,
  onCaptured,
  notify,
}: {
  categoryTitle?: string
  participantIds?: string[]
  onBack: () => void
  onManual: () => void
  onCaptured: (image: string, analysis?: ReceiptScanAnalysisResult) => void
  notify: (msg: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [camera, setCamera] = useState<'loading' | 'ready' | 'simulated'>('loading')
  const [torch, setTorch] = useState(false)
  const [preset, setPreset] = useState<ScanSimulationPreset>('auto')

  // Live telemetry from camera stream
  const [liveStatus, setLiveStatus] = useState<{
    label: string
    tone: 'good' | 'warn' | 'bad'
    metrics: ReceiptQualityMetrics | null
  }>({
    label: 'Sensor OCR siap • Posisikan struk di dalam kotak',
    tone: 'good',
    metrics: null,
  })

  // Active scanning animation state after pressing shutter or picking photo
  const [scanningState, setScanningState] = useState<{
    active: boolean
    previewUrl: string | null
    stepIndex: number
  }>({
    active: false,
    previewUrl: null,
    stepIndex: 0,
  })

  // Validation pop-up state when receipt is unreadable/invalid
  const [validationPopup, setValidationPopup] = useState<{
    open: boolean
    issue: ReceiptValidationIssue | null
    metrics: ReceiptQualityMetrics | null
    image: string | null
    lastResult: ReceiptScanAnalysisResult | null
  }>({
    open: false,
    issue: null,
    metrics: null,
    image: null,
    lastResult: null,
  })

  // Preview image for simulated mode or when testing a preset
  const simulatedPreviewUrl = useMemo(() => {
    const targetPreset = preset === 'auto' ? 'valid_clear' : preset
    return generateSimulatedReceiptImage(targetPreset)
  }, [preset])

  // Start camera stream
  useEffect(() => {
    let cancelled = false
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera('simulated')
      return
    }
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 1700 },
        },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setCamera('ready')
      })
      .catch(() => {
        if (!cancelled) {
          setCamera('simulated')
        }
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  // Periodic live frame analyzer when physical camera is active
  useEffect(() => {
    if (camera !== 'ready' || scanningState.active || validationPopup.open) return
    const interval = setInterval(() => {
      const video = videoRef.current
      if (!video || video.readyState < 2) return
      const res = analyzeVideoFrame(video)
      setLiveStatus({
        label: res.statusLabel,
        tone: res.tone,
        metrics: res.metrics,
      })
    }, 950)
    return () => clearInterval(interval)
  }, [camera, scanningState.active, validationPopup.open])

  const toggleTorch = useCallback(
    async (forceOn?: boolean) => {
      const nextTorch = typeof forceOn === 'boolean' ? forceOn : !torch
      const track = streamRef.current?.getVideoTracks()[0]
      const caps = track?.getCapabilities?.() as TorchCapabilities | undefined

      if (!track || !caps?.torch) {
        setTorch(nextTorch)
        if (nextTorch && preset === 'too_dark') {
          setPreset('valid_clear')
        }
        notify(
          nextTorch
            ? 'Mode pencahayaan tambahan (Senter) diaktifkan'
            : 'Mode pencahayaan tambahan (Senter) dimatikan',
        )
        return
      }
      try {
        await track.applyConstraints({ advanced: [{ torch: nextTorch } as MediaTrackConstraintSet] })
        setTorch(nextTorch)
        notify(nextTorch ? 'Senter dinyalakan' : 'Senter dimatikan')
      } catch {
        notify('Gagal mengubah status senter')
      }
    },
    [notify, preset, torch],
  )

  const runReceiptScanProcess = useCallback(
    async (imageSrc: string, activePreset: ScanSimulationPreset) => {
      setValidationPopup((prev) => ({ ...prev, open: false }))
      setScanningState({
        active: true,
        previewUrl: imageSrc,
        stepIndex: 0,
      })

      const step1Timer = setTimeout(() => {
        setScanningState((s) => (s.active ? { ...s, stepIndex: 1 } : s))
      }, 450)
      const step2Timer = setTimeout(() => {
        setScanningState((s) => (s.active ? { ...s, stepIndex: 2 } : s))
      }, 920)

      const [analysis] = await Promise.all([
        analyzeReceiptImage(imageSrc, {
          category: categoryTitle,
          participantIds,
          preset: activePreset,
        }),
        new Promise((r) => setTimeout(r, 1400)),
      ])

      clearTimeout(step1Timer)
      clearTimeout(step2Timer)
      setScanningState({
        active: false,
        previewUrl: null,
        stepIndex: 0,
      })

      if (!analysis.valid && analysis.issue) {
        setValidationPopup({
          open: true,
          issue: analysis.issue,
          metrics: analysis.metrics,
          image: imageSrc,
          lastResult: analysis,
        })
        return
      }

      onCaptured(imageSrc, analysis)
    },
    [categoryTitle, onCaptured, participantIds],
  )

  const captureFromViewfinder = () => {
    if (scanningState.active) return

    // If user selected a specific simulation preset or camera is in virtual mode
    if (preset !== 'auto' || camera === 'simulated') {
      const targetPreset = preset === 'auto' ? 'valid_clear' : preset
      const dataUrl = generateSimulatedReceiptImage(targetPreset)
      void runReceiptScanProcess(dataUrl, targetPreset)
      return
    }

    const video = videoRef.current
    if (!video || camera !== 'ready') return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 720
    canvas.height = video.videoHeight || 960
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    const capturedDataUrl = canvas.toDataURL('image/jpeg', 0.88)
    void runReceiptScanProcess(capturedDataUrl, 'auto')
  }

  const statusBadgeTone = useMemo(() => {
    if (preset !== 'auto' && preset !== 'valid_clear') {
      return 'bg-[#e5484d]/90 text-white'
    }
    if (preset === 'valid_clear') {
      return 'bg-[#054131]/85 text-[#f2f3e6]'
    }
    if (liveStatus.tone === 'bad') return 'bg-[#e5484d]/90 text-white'
    if (liveStatus.tone === 'warn') return 'bg-[#f59e0b]/90 text-white'
    return 'bg-[#054131]/85 text-white'
  }, [liveStatus.tone, preset])

  const statusText = useMemo(() => {
    if (preset !== 'auto') {
      const found = SCAN_SIMULATION_PRESETS.find((p) => p.id === preset)
      return `Mode Uji: ${found?.label ?? preset}`
    }
    if (camera === 'simulated') {
      return 'Pratinjau Struk Aktif • Tekan tombol bulat untuk scan'
    }
    return liveStatus.label
  }, [camera, liveStatus.label, preset])

  return (
    <div className="flex min-h-dvh w-full flex-col bg-white text-[#054131]">
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-[16px] pt-[24px] pb-[24px] md:pt-[32px]">
        {/* Top Navigation & Controls */}
        <div className="flex w-full items-center justify-between">
          <ScanRoundButton label="Kembali" icon={SCAN_ICONS.back} onClick={onBack} />
          <div className="flex items-center gap-[14px]">
            <ScanRoundButton
              label={torch ? 'Matikan senter' : 'Nyalakan senter'}
              icon={SCAN_ICONS.flashlight}
              onClick={() => void toggleTorch()}
              active={torch}
            />
            <ScanRoundButton
              label="Pilih dari galeri"
              icon={SCAN_ICONS.gallery}
              onClick={() => fileRef.current?.click()}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) {
                  const objectUrl = URL.createObjectURL(f)
                  void runReceiptScanProcess(objectUrl, preset)
                }
              }}
            />
          </div>
        </div>

        {/* Title & Instructions */}
        <div className="mt-[28px] flex w-full flex-col items-center gap-[6px] text-center leading-[normal] tracking-[-0.2px]">
          <p className="font-['Outfit:Medium'] text-[18px] font-medium text-[#054131]">
            Posisikan struk belanja di dalam kotak
          </p>
          <p className="font-['Outfit:Regular'] text-[14px] font-normal text-[#8e8e8e]">
            Pastikan nama menu, harga, dan total terlihat jelas
          </p>
        </div>

        {/* Interactive Condition Simulator Selector (for testing valid & invalid receipt scenarios) */}
        <div className="mt-[14px] flex flex-col gap-[6px]">
          <div className="flex items-center justify-between px-[2px]">
            <span className="font-['Outfit:Regular'] text-[11px] text-[#8e8e8e]">
              Mode Sensor & Simulasi Kondisi Struk:
            </span>
            <span className="font-['Outfit:Medium'] text-[11px] text-[#a6bb18]">{categoryTitle}</span>
          </div>
          <div
            role="group"
            aria-label="Simulasi kondisi struk"
            className="flex w-full items-center gap-[6px] overflow-x-auto pb-[4px]"
          >
            {SCAN_SIMULATION_PRESETS.map((item) => {
              const active = preset === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPreset(item.id)}
                  className={`shrink-0 rounded-[999px] border px-[10px] py-[4px] font-['Outfit:Medium'] text-[11px] font-medium transition active:scale-95 ${
                    active
                      ? item.badge === 'invalid'
                        ? 'border-[#e5484d] bg-[#e5484d] text-white'
                        : 'border-[#a6bb18] bg-[#a6bb18] text-white'
                      : 'border-[#ececec] bg-[#fefef8] text-[#054131] hover:border-[#a6bb18]'
                  }`}
                >
                  {item.shortLabel}
                </button>
              )
            })}
          </div>
        </div>

        {/* Camera Viewfinder with Receipt Scanner Overlay */}
        <div className="relative mt-[12px] min-h-[380px] w-full flex-1 overflow-clip rounded-[24px] bg-[#14221d] md:max-h-[600px]">
          {/* Live Camera Video */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${
              camera === 'ready' && preset === 'auto' && !scanningState.active ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Virtual / Simulated Receipt Feed when camera is unavailable or preset is chosen */}
          {(camera === 'simulated' || preset !== 'auto') && !scanningState.active && (
            <img
              src={simulatedPreviewUrl}
              alt="Simulasi pratinjau struk"
              className={`absolute inset-0 size-full object-cover transition duration-300 ${
                preset === 'blurry' ? 'scale-105 blur-[3.5px]' : ''
              } ${torch && preset === 'too_dark' ? 'brightness-150' : ''}`}
            />
          )}

          {/* Frozen Frame during Active Laser OCR Scanning */}
          {scanningState.active && scanningState.previewUrl && (
            <img
              src={scanningState.previewUrl}
              alt="Memindai struk"
              className={`absolute inset-0 size-full object-cover ${
                preset === 'blurry' ? 'scale-105 blur-[3px]' : ''
              }`}
            />
          )}

          {/* Torch / Flashlight Warm Illumination Overlay */}
          {torch && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,250,210,0.22)_0%,transparent_72%)]"
            />
          )}

          {/* Top Live Sensor Status Pill */}
          <div className="pointer-events-none absolute inset-x-[16px] top-[14px] z-20 flex justify-center">
            <div
              className={`flex max-w-full items-center gap-[6px] rounded-full px-[12px] py-[5px] text-[12px] shadow-md backdrop-blur-md transition-colors duration-300 ${statusBadgeTone}`}
            >
              <span
                className={`size-[7px] shrink-0 rounded-full ${
                  scanningState.active
                    ? 'animate-ping bg-[#a6bb18]'
                    : preset !== 'auto' && preset !== 'valid_clear'
                      ? 'bg-white'
                      : 'bg-[#a6bb18]'
                }`}
              />
              <span className="truncate font-['Outfit:Medium'] font-medium">
                {scanningState.active ? SCAN_STEPS[scanningState.stepIndex] : statusText}
              </span>
            </div>
          </div>

          {/* Receipt Alignment Frame & Corner Brackets */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[28px] top-[52px] bottom-[92px] z-10 flex flex-col justify-between rounded-[16px] border border-white/25"
          >
            {/* 4 Glowing Corner Brackets */}
            <span className="absolute -top-[2px] -left-[2px] size-[24px] rounded-tl-[14px] border-t-[3.5px] border-l-[3.5px] border-[#a6bb18] [animation:corner-pulse_2s_ease-in-out_infinite]" />
            <span className="absolute -top-[2px] -right-[2px] size-[24px] rounded-tr-[14px] border-t-[3.5px] border-r-[3.5px] border-[#a6bb18] [animation:corner-pulse_2s_ease-in-out_infinite]" />
            <span className="absolute -bottom-[2px] -left-[2px] size-[24px] rounded-bl-[14px] border-b-[3.5px] border-l-[3.5px] border-[#a6bb18] [animation:corner-pulse_2s_ease-in-out_infinite]" />
            <span className="absolute -bottom-[2px] -right-[2px] size-[24px] rounded-br-[14px] border-b-[3.5px] border-r-[3.5px] border-[#a6bb18] [animation:corner-pulse_2s_ease-in-out_infinite]" />

            {/* Subtle Section Guides inside Receipt Box */}
            <div className="mx-[14px] mt-[12px] flex items-center justify-between border-b border-dashed border-white/25 pb-[6px] text-[10px] text-white/75">
              <span className="font-['Outfit:Regular'] tracking-wider uppercase">Header / Nama Tempat</span>
              <span className="font-['Outfit:Regular']">OCR Zona 1</span>
            </div>

            {/* Active OCR Line Detection Boxes when scanning */}
            {scanningState.active ? (
              <div className="my-auto flex flex-col gap-[8px] px-[16px]">
                {[
                  { w: 'w-3/5', label: 'Nama Resto / Toko', delay: '0ms' },
                  { w: 'w-full', label: 'Item Menu #1 • Rp 38.000', delay: '120ms' },
                  { w: 'w-11/12', label: 'Item Menu #2 • Rp 45.000', delay: '240ms' },
                  { w: 'w-4/5', label: 'Item Menu #3 • Rp 30.000', delay: '360ms' },
                  { w: 'w-full', label: 'Pajak & Total Tagihan', delay: '480ms' },
                ].map((box, i) => (
                  <div
                    key={i}
                    style={{ animationDelay: box.delay }}
                    className={`${box.w} flex items-center justify-between rounded-[6px] border border-[#a6bb18] bg-[#a6bb18]/20 px-[8px] py-[4px] backdrop-blur-[1px] [animation:ocr-box-pulse_900ms_ease-in-out_infinite]`}
                  >
                    <span className="truncate font-['Outfit:Medium'] text-[10px] text-white">{box.label}</span>
                    <span className="ml-[6px] size-[6px] shrink-0 rounded-full bg-[#a6bb18]" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="my-auto flex flex-col items-center gap-[4px] px-[16px] text-center">
                <span className="rounded-[6px] bg-black/35 px-[10px] py-[3px] font-['Outfit:Regular'] text-[11px] text-white/85 backdrop-blur-xs">
                  Daftar Menu & Nominal Harga
                </span>
              </div>
            )}

            <div className="mx-[14px] mb-[12px] flex items-center justify-between border-t border-dashed border-white/25 pt-[6px] text-[10px] text-white/75">
              <span className="font-['Outfit:Regular'] tracking-wider uppercase">Subtotal • Pajak • Total</span>
              <span className="font-['Outfit:Regular']">OCR Zona 2</span>
            </div>

            {/* Laser Beam + Glowing Trail Animation */}
            <div
              className={`pointer-events-none absolute inset-x-[6px] h-[44px] -translate-y-1/2 ${
                scanningState.active
                  ? '[animation:receipt-laser_1.1s_ease-in-out_infinite]'
                  : '[animation:receipt-laser_2.6s_ease-in-out_infinite]'
              }`}
            >
              <div className="h-[40px] w-full bg-gradient-to-b from-transparent via-[#a6bb18]/20 to-[#a6bb18]/45" />
              <div className="h-[3px] w-full rounded-full bg-[#a6bb18] shadow-[0_0_16px_3px_#a6bb18]" />
            </div>
          </div>

          {/* Shutter & Bottom Camera Controls */}
          <div className="absolute inset-x-0 bottom-[16px] z-20 flex items-center justify-center gap-[20px]">
            <button
              type="button"
              aria-label="Ambil foto struk"
              disabled={scanningState.active}
              onClick={captureFromViewfinder}
              className="group relative flex size-[66px] items-center justify-center rounded-full border-[3px] border-white/95 shadow-lg transition active:scale-95 disabled:opacity-60"
            >
              <span
                className={`size-[52px] rounded-full transition ${
                  scanningState.active
                    ? ' scale-90 animate-pulse bg-[#a6bb18]'
                    : 'bg-white group-hover:bg-[#f2f3e6]'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Manual Input Fallback Link */}
        <div className="mt-[20px] flex items-center justify-center gap-[6px] text-center text-[16px] leading-[normal] tracking-[-0.2px] whitespace-nowrap">
          <p className="font-['Outfit:Regular'] font-normal text-[#054131]">Struk rusak?</p>
          <button
            type="button"
            onClick={onManual}
            className="font-['Outfit:Medium'] font-medium text-[#a6bb18] hover:underline"
          >
            Input manual aja
          </button>
        </div>

        <p className="mt-auto pt-[32px] text-center font-['Courgette:Regular'] text-[26px] leading-[normal] tracking-[-0.3px] text-[#054131]">
          Kloop
        </p>
      </div>

      {/* Validation Pop-up Modal when Receipt is Unreadable / Invalid */}
      <ReceiptValidationModal
        open={validationPopup.open}
        issue={validationPopup.issue}
        metrics={validationPopup.metrics}
        capturedImage={validationPopup.image}
        onRetake={() => {
          setValidationPopup((prev) => ({ ...prev, open: false }))
        }}
        onEnableTorchAndRetake={() => {
          setValidationPopup((prev) => ({ ...prev, open: false }))
          void toggleTorch(true)
        }}
        onPickGallery={() => {
          setValidationPopup((prev) => ({ ...prev, open: false }))
          fileRef.current?.click()
        }}
        onManualInput={() => {
          setValidationPopup((prev) => ({ ...prev, open: false }))
          onManual()
        }}
        onForceContinue={
          validationPopup.issue?.canForceContinue && validationPopup.image
            ? () => {
                const img = validationPopup.image!
                const res = validationPopup.lastResult ?? undefined
                setValidationPopup((prev) => ({ ...prev, open: false }))
                onCaptured(img, res)
              }
            : undefined
        }
      />
    </div>
  )
}
