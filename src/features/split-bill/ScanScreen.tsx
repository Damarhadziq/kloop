import { useCallback, useEffect, useRef, useState } from 'react'
import { ScanScreenSkeleton } from '@/components/skeletons'
import { RoundIconButton, useAssetsReady } from '@/components/ui'
import { SCAN_ICONS } from '@/services/bill.service'
import {
  analyzeReceiptImage,
  autoCropUploadedReceiptImage,
  captureAndAutoCropVideo,
} from '@/services/scanner.service'
import type { ReceiptQualityMetrics, ReceiptScanAnalysisResult, ReceiptValidationIssue } from '@/types'
import { ReceiptValidationModal } from './ReceiptValidationModal'

type TorchCapabilities = MediaTrackCapabilities & {
  torch?: boolean
  fillLightMode?: string[]
}

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

const SCAN_SCREEN_ICONS = Object.values(SCAN_ICONS)

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
  const iconsReady = useAssetsReady(SCAN_SCREEN_ICONS, 320)
  const videoRef = useRef<HTMLVideoElement>(null)
  const viewfinderRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [camera, setCamera] = useState<'loading' | 'ready' | 'unavailable'>('loading')
  const [torch, setTorch] = useState(false)

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

  // Initialize rear camera and prefer rear lens with hardware torch support
  useEffect(() => {
    let cancelled = false
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera('unavailable')
      return
    }

    async function startCamera() {
      try {
        let stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        // Check if current rear lens supports torch; if not, try finding the main rear camera that has torch
        const initialTrack = stream.getVideoTracks()[0]
        const initialCaps = initialTrack?.getCapabilities?.() as TorchCapabilities | undefined
        if (!initialCaps?.torch && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const rearCameras = devices.filter(
            (d) => d.kind === 'videoinput' && /back|rear|environment|0/i.test(d.label),
          )
          for (const dev of rearCameras) {
            if (dev.deviceId === initialTrack?.getSettings?.().deviceId) continue
            try {
              const candidateStream = await navigator.mediaDevices.getUserMedia({
                video: {
                  deviceId: { exact: dev.deviceId },
                  width: { ideal: 1920 },
                  height: { ideal: 1080 },
                },
                audio: false,
              })
              const candidateTrack = candidateStream.getVideoTracks()[0]
              const candidateCaps = candidateTrack?.getCapabilities?.() as TorchCapabilities | undefined
              if (candidateCaps?.torch) {
                stream.getTracks().forEach((t) => t.stop())
                stream = candidateStream
                break
              } else {
                candidateStream.getTracks().forEach((t) => t.stop())
              }
            } catch {
              /* ignore and keep initial stream */
            }
          }
        }

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setCamera('ready')
      } catch {
        if (!cancelled) setCamera('unavailable')
      }
    }

    void startCamera()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  // Attach stream whenever video element mounts after skeleton
  useEffect(() => {
    if (iconsReady && camera === 'ready' && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current
      }
    }
  }, [iconsReady, camera])

  const toggleTorch = useCallback(
    async (forceOn?: boolean) => {
      const nextTorch = typeof forceOn === 'boolean' ? forceOn : !torch
      const track = streamRef.current?.getVideoTracks()[0]
      if (!track) {
        notify('Kamera belum aktif untuk menyalakan senter')
        return
      }

      const caps = track.getCapabilities?.() as TorchCapabilities | undefined
      const supportsTorch = Boolean(caps?.torch || caps?.fillLightMode?.includes('flash'))

      try {
        await track.applyConstraints({
          advanced: [{ torch: nextTorch } as MediaTrackConstraintSet],
        })
        setTorch(nextTorch)
        notify(nextTorch ? 'Senter HP dinyalakan' : 'Senter HP dimatikan')
        return
      } catch {
        // Fallback: direct constraint object for browsers that don't use `advanced`
        try {
          await track.applyConstraints({ torch: nextTorch } as unknown as MediaTrackConstraints)
          setTorch(nextTorch)
          notify(nextTorch ? 'Senter HP dinyalakan' : 'Senter HP dimatikan')
          return
        } catch {
          if (!supportsTorch) {
            notify('Browser/perangkat ini membatasi akses senter (Gunakan Chrome Android via HTTPS)')
          } else {
            notify('Gagal menyalakan senter')
          }
        }
      }
    },
    [notify, torch],
  )

  const validateAndProceed = useCallback(
    async (fullScreenReceiptUrl: string) => {
      const analysis = await analyzeReceiptImage(fullScreenReceiptUrl, {
        category: categoryTitle,
        participantIds,
        preset: 'auto',
      })

      if (!analysis.valid && analysis.issue) {
        setValidationPopup({
          open: true,
          issue: analysis.issue,
          metrics: analysis.metrics,
          image: fullScreenReceiptUrl,
          lastResult: analysis,
        })
        return
      }

      onCaptured(fullScreenReceiptUrl, analysis)
    },
    [categoryTitle, onCaptured, participantIds],
  )

  const capture = () => {
    const video = videoRef.current
    if (!video || camera !== 'ready') return
    const rect = viewfinderRef.current?.getBoundingClientRect()
    const vfWidth = rect?.width || 360
    const vfHeight = rect?.height || 540

    // Automatically crop to the viewfinder & receipt paper bounds and scale to full-screen
    const croppedReceiptDataUrl = captureAndAutoCropVideo(video, vfWidth, vfHeight)
    void validateAndProceed(croppedReceiptDataUrl)
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-white text-[#054131]">
      {!iconsReady || camera === 'loading' ? (
        <ScanScreenSkeleton />
      ) : (
        <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-[16px] pt-[24px] pb-[24px] md:pt-[32px]">
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
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (f) {
                    const rawUrl = URL.createObjectURL(f)
                    const croppedFullScreenUrl = await autoCropUploadedReceiptImage(rawUrl)
                    URL.revokeObjectURL(rawUrl)
                    void validateAndProceed(croppedFullScreenUrl)
                  }
                }}
              />
            </div>
          </div>

          <div className="mt-[54px] flex w-full flex-col items-center gap-[6px] text-center leading-[normal] tracking-[-0.2px]">
            <p className="font-['Outfit:Medium'] text-[18px] font-medium text-[#054131]">
              Posisikan struk belanja di dalam kotak
            </p>
            <p className="font-['Outfit:Regular'] text-[14px] font-normal text-[#8e8e8e]">
              Pastikan nama menu, harga, dan total terlihat jelas
            </p>
          </div>

          <div
            ref={viewfinderRef}
            className="relative mt-[24px] min-h-[360px] w-full flex-1 overflow-clip rounded-[24px] bg-[#d9d9d9] md:max-h-[620px]"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${
                camera === 'ready' ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {camera === 'ready' && (
              <button
                type="button"
                aria-label="Ambil foto struk"
                onClick={capture}
                className="absolute bottom-[20px] left-1/2 flex size-[64px] -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-white/90 transition active:scale-95"
              >
                <span className="size-[50px] rounded-full bg-white transition hover:bg-[#f8f8ec]" />
              </button>
            )}
            {camera === 'unavailable' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-[12px] p-[24px] text-center">
                <p className="font-['Outfit:Regular'] text-[14px] text-[#054131]">Kamera tidak bisa diakses.</p>
                <button
                  type="button"
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
            <button
              type="button"
              onClick={onManual}
              className="font-['Outfit:Medium'] font-medium text-[#a6bb18] hover:underline"
            >
              Input manual aja
            </button>
          </div>

          <p className="mt-auto pt-[48px] text-center font-['Courgette:Regular'] text-[26px] leading-[normal] tracking-[-0.3px] text-[#054131]">
            Kloop
          </p>
        </div>
      )}

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
