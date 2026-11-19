import { useCallback, useEffect, useRef, useState } from 'react'
import { ScanScreenSkeleton } from '@/components/skeletons'
import { RoundIconButton, useAssetsReady } from '@/components/ui'
import { SCAN_ICONS } from '@/services/bill.service'
import {
  analyzeReceiptImage,
  autoCropUploadedReceiptImage,
  captureAndAutoCropVideo,
  detectReceiptBoundsInVideoFrame,
  type LiveReceiptBounds,
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

const waitMs = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

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
  const [liveBounds, setLiveBounds] = useState<LiveReceiptBounds>({
    detected: false,
    leftPct: 12,
    topPct: 8,
    widthPct: 76,
    heightPct: 74,
  })
  const [filteredPreviewUrl, setFilteredPreviewUrl] = useState<string | null>(null)

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

  const attachStreamToVideo = useCallback(async (stream: MediaStream) => {
    streamRef.current = stream
    const video = videoRef.current
    if (video) {
      video.srcObject = stream
      try {
        await video.play()
      } catch {
        /* play may resolve via autoPlay */
      }
    }
  }, [])

  // Initialize rear camera cleanly (keep <video> mounted so Android populates torch capabilities)
  useEffect(() => {
    let cancelled = false
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera('unavailable')
      return
    }

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        await attachStreamToVideo(stream)
        if (!cancelled) {
          setCamera('ready')
        }
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
  }, [attachStreamToVideo])

  // Real-time auto-fit bounding box detection on live camera stream
  useEffect(() => {
    if (camera !== 'ready' || validationPopup.open || filteredPreviewUrl) return
    const timer = setInterval(() => {
      const video = videoRef.current
      if (!video || video.readyState < 2) return
      const nextBounds = detectReceiptBoundsInVideoFrame(video)
      setLiveBounds(nextBounds)
    }, 260)
    return () => clearInterval(timer)
  }, [camera, validationPopup.open, filteredPreviewUrl])

  // Helper to apply hardware torch on a playing video track
  const tryApplyHardwareTorchOnTrack = async (track: MediaStreamTrack, enable: boolean): Promise<boolean> => {
    // 1. Standard MediaStreamTrack advanced torch constraint (Android Chrome / Samsung / Edge)
    try {
      await track.applyConstraints({
        advanced: [{ torch: enable } as MediaTrackConstraintSet],
      })
      return true
    } catch {
      /* continue to fallback */
    }

    // 2. Direct top-level torch constraint
    try {
      await track.applyConstraints({
        torch: enable,
      } as unknown as MediaTrackConstraints)
      return true
    } catch {
      /* continue to fallback */
    }

    // 3. ImageCapture API fallback
    try {
      const ImageCaptureCtor = (window as unknown as { ImageCapture?: new (t: MediaStreamTrack) => { setOptions?: (o: unknown) => Promise<void> } }).ImageCapture
      if (ImageCaptureCtor) {
        const ic = new ImageCaptureCtor(track)
        if (typeof ic.setOptions === 'function') {
          await ic.setOptions({ fillLightMode: enable ? 'flash' : 'off', torch: enable })
          return true
        }
      }
    } catch {
      /* continue */
    }

    return false
  }

  const toggleTorch = useCallback(
    async (forceOn?: boolean) => {
      const nextTorch = typeof forceOn === 'boolean' ? forceOn : !torch
      const currentStream = streamRef.current
      const currentTrack = currentStream?.getVideoTracks()[0]

      if (!currentTrack) {
        notify('Kamera belum aktif untuk menyalakan senter')
        return
      }

      // Ensure video is actively playing so Android populates track capabilities
      if (videoRef.current && videoRef.current.paused) {
        await videoRef.current.play().catch(() => undefined)
        await waitMs(150)
      }

      const currentCaps = currentTrack.getCapabilities?.() as TorchCapabilities | undefined
      if (currentCaps?.torch) {
        const ok = await tryApplyHardwareTorchOnTrack(currentTrack, nextTorch)
        if (ok) {
          setTorch(nextTorch)
          notify(nextTorch ? 'Senter HP dinyalakan' : 'Senter HP dimatikan')
          return
        }
      }

      // Even if getCapabilities().torch wasn't reported yet, try applying on current track first
      const directOk = await tryApplyHardwareTorchOnTrack(currentTrack, nextTorch)
      if (directOk && currentCaps?.torch !== false) {
        const settings = currentTrack.getSettings?.() as { torch?: boolean } | undefined
        if (settings?.torch === nextTorch || currentCaps?.torch) {
          setTorch(nextTorch)
          notify(nextTorch ? 'Senter HP dinyalakan' : 'Senter HP dimatikan')
          return
        }
      }

      // On multi-camera Android phones (Samsung/Xiaomi/Oppo/Vivo), the default rear lens may be
      // ultra-wide (no flash). Stop current stream first (Android locks camera if 2 streams open),
      // then search rear videoinput devices for the lens that has `torch: true`.
      if (navigator.mediaDevices?.enumerateDevices) {
        const currentDeviceId = currentTrack.getSettings?.().deviceId
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((d) => d.kind === 'videoinput')
        const rearCandidates = videoDevices.filter(
          (d) => /back|rear|environment|belakang|0/i.test(d.label) && d.deviceId !== currentDeviceId,
        )
        const candidatesToTry = rearCandidates.length > 0 ? rearCandidates : videoDevices.filter((d) => d.deviceId !== currentDeviceId)

        for (const dev of candidatesToTry) {
          try {
            // Stop active stream BEFORE opening the next lens so Android doesn't throw NotReadableError
            streamRef.current?.getTracks().forEach((t) => t.stop())
            await waitMs(160)

            const nextStream = await navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: { exact: dev.deviceId },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            })

            await attachStreamToVideo(nextStream)
            await waitMs(280)

            const nextTrack = nextStream.getVideoTracks()[0]
            const nextCaps = nextTrack?.getCapabilities?.() as TorchCapabilities | undefined
            if (nextTrack && nextCaps?.torch) {
              const switchedOk = await tryApplyHardwareTorchOnTrack(nextTrack, nextTorch)
              if (switchedOk) {
                setTorch(nextTorch)
                notify(nextTorch ? 'Senter HP dinyalakan' : 'Senter HP dimatikan')
                return
              }
            }
          } catch {
            /* try next candidate */
          }
        }

        // Restore default rear environment stream if none of the alternate lenses had torch
        try {
          streamRef.current?.getTracks().forEach((t) => t.stop())
          await waitMs(140)
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          })
          await attachStreamToVideo(fallbackStream)
          await waitMs(220)
          const fbTrack = fallbackStream.getVideoTracks()[0]
          if (fbTrack) {
            await tryApplyHardwareTorchOnTrack(fbTrack, nextTorch)
          }
        } catch {
          /* ignore */
        }
      }

      // Toggle illumination boost state so dark receipts still get brightened even if OS blocks LED
      setTorch(nextTorch)
      notify(nextTorch ? 'Senter / Pencerah kamera dinyalakan' : 'Senter dimatikan')
    },
    [attachStreamToVideo, notify, torch],
  )

  const validateAndProceed = useCallback(
    async (fullScreenEnhancedReceiptUrl: string) => {
      setFilteredPreviewUrl(fullScreenEnhancedReceiptUrl)
      const [analysis] = await Promise.all([
        analyzeReceiptImage(fullScreenEnhancedReceiptUrl, {
          category: categoryTitle,
          participantIds,
          preset: 'auto',
        }),
        new Promise((r) => setTimeout(r, 420)),
      ])
      setFilteredPreviewUrl(null)

      if (!analysis.valid && analysis.issue) {
        setValidationPopup({
          open: true,
          issue: analysis.issue,
          metrics: analysis.metrics,
          image: fullScreenEnhancedReceiptUrl,
          lastResult: analysis,
        })
        return
      }

      onCaptured(fullScreenEnhancedReceiptUrl, analysis)
    },
    [categoryTitle, onCaptured, participantIds],
  )

  const capture = () => {
    const video = videoRef.current
    if (!video || camera !== 'ready') return
    const rect = viewfinderRef.current?.getBoundingClientRect()
    const vfWidth = rect?.width || 360
    const vfHeight = rect?.height || 540

    const enhancedFullScreenUrl = captureAndAutoCropVideo(video, vfWidth, vfHeight)
    void validateAndProceed(enhancedFullScreenUrl)
  }

  const isPreparing = !iconsReady || camera === 'loading'

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-white text-[#054131]">
      {isPreparing && (
        <div className="absolute inset-0 z-40 flex bg-white">
          <ScanScreenSkeleton />
        </div>
      )}

      {/* Keep <video> always mounted so Android camera hardware & torch initialize reliably */}
      <div
        className={`mx-auto flex w-full max-w-[430px] flex-1 flex-col px-[16px] pt-[24px] pb-[24px] ${
          isPreparing ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
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
          className="relative mt-[24px] min-h-[360px] w-full flex-1 overflow-clip rounded-[24px] bg-[#d9d9d9]"
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 size-full object-cover transition duration-300 ${
              camera === 'ready' && !filteredPreviewUrl ? 'opacity-100' : 'opacity-0'
            } ${torch ? 'brightness-125 contrast-110' : ''}`}
          />

          {/* Enhanced high-contrast full-screen receipt preview right after capture */}
          {filteredPreviewUrl && (
            <div className="absolute inset-0 z-20 overflow-hidden bg-white">
              <img
                src={filteredPreviewUrl}
                alt="Hasil filter akurasi struk"
                className="size-full object-cover contrast-125 grayscale-[35%]"
              />
              <div className="absolute top-[14px] left-1/2 -translate-x-1/2 rounded-full bg-[#054131]/85 px-[12px] py-[4px] font-['Outfit:Medium'] text-[11px] text-white backdrop-blur-xs">
                ✓ Filter Ketajaman Struk Diterapkan
              </div>
            </div>
          )}

          {camera === 'ready' && !filteredPreviewUrl && (
            <>
              {/* Auto-Fit Bounding Box that dynamically fits around the detected receipt */}
              <div
                aria-hidden
                style={{
                  left: `${liveBounds.leftPct}%`,
                  top: `${liveBounds.topPct}%`,
                  width: `${liveBounds.widthPct}%`,
                  height: `${liveBounds.heightPct}%`,
                }}
                className={`pointer-events-none absolute rounded-[14px] border-[2px] shadow-[0_0_0_9999px_rgba(5,65,49,0.22)] transition-all duration-300 ease-out ${
                  liveBounds.detected ? 'border-[#a6bb18]' : 'border-white/75'
                }`}
              >
                <span className="absolute -top-[2px] -left-[2px] size-[18px] rounded-tl-[12px] border-t-[3.5px] border-l-[3.5px] border-[#a6bb18]" />
                <span className="absolute -top-[2px] -right-[2px] size-[18px] rounded-tr-[12px] border-t-[3.5px] border-r-[3.5px] border-[#a6bb18]" />
                <span className="absolute -bottom-[2px] -left-[2px] size-[18px] rounded-bl-[12px] border-b-[3.5px] border-l-[3.5px] border-[#a6bb18]" />
                <span className="absolute -bottom-[2px] -right-[2px] size-[18px] rounded-br-[12px] border-b-[3.5px] border-r-[3.5px] border-[#a6bb18]" />
              </div>

              <button
                type="button"
                aria-label="Ambil foto struk"
                onClick={capture}
                className="absolute bottom-[20px] left-1/2 z-10 flex size-[64px] -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-white/90 transition active:scale-95"
              >
                <span className="size-[50px] rounded-full bg-white transition hover:bg-[#f8f8ec]" />
              </button>
            </>
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
