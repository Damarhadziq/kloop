import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MODAL_BG_PATTERN, MODAL_DELETE_ICON, usePresence, useScrollLock } from '@/components/ui'
import type { ReceiptQualityMetrics, ReceiptValidationIssue } from '@/types'

function MetricBar({
  label,
  value,
  highlightBad,
}: {
  label: string
  value: number
  highlightBad?: boolean
}) {
  const isLow = highlightBad || value < 25
  const barColor = isLow ? 'bg-[#e5484d]' : value < 48 ? 'bg-[#f59e0b]' : 'bg-[#2acb70]'
  const textColor = isLow ? 'text-[#e5484d]' : 'text-[#054131]'

  return (
    <div className="flex flex-col gap-[4px] rounded-[8px] border border-[#ececec] bg-[#fefef8] p-[8px]">
      <div className="flex items-center justify-between text-[11px]">
        <span className="truncate font-['Outfit:Regular'] text-[#8e8e8e]">{label}</span>
        <span className={`font-['Outfit:SemiBold'] font-semibold tabular-nums ${textColor}`}>{value}%</span>
      </div>
      <div className="h-[5px] w-full overflow-hidden rounded-full bg-[#ececec]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.max(6, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  )
}

export function ReceiptValidationModal({
  open,
  issue,
  metrics,
  capturedImage,
  onRetake,
  onEnableTorchAndRetake,
  onPickGallery,
  onManualInput,
  onForceContinue,
}: {
  open: boolean
  issue: ReceiptValidationIssue | null
  metrics: ReceiptQualityMetrics | null
  capturedImage?: string | null
  onRetake: () => void
  onEnableTorchAndRetake?: () => void
  onPickGallery: () => void
  onManualInput: () => void
  onForceContinue?: () => void
}) {
  const { mounted, closing } = usePresence(open && !!issue, 220)
  useScrollLock(mounted)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onRetake()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onRetake])

  if (!mounted || !issue) return null

  const isError = issue.severity === 'error'

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-[16px] bg-[#054131]/55 backdrop-blur-[2px] ${
        closing ? '[animation:fade-out_200ms_ease-in_forwards]' : '[animation:fade-in_200ms_ease-out]'
      }`}
      onClick={onRetake}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="validation-modal-title"
        aria-describedby="validation-modal-desc"
        onClick={(e) => e.stopPropagation()}
        className={`relative flex max-h-[calc(100dvh-32px)] w-full max-w-[390px] flex-col gap-[16px] overflow-y-auto rounded-[24px] border border-[#ececec] bg-white p-[20px] text-[#054131] shadow-[0_20px_48px_rgba(5,65,49,0.24)] ${
          closing ? '[animation:modal-out_200ms_ease-in_forwards]' : '[animation:modal-in_280ms_cubic-bezier(0.2,0.8,0.2,1)]'
        }`}
      >
        <img
          src={MODAL_BG_PATTERN}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full object-cover select-none"
        />

        {/* Top Status Header */}
        <div className="relative z-10 flex items-start justify-between gap-[12px]">
          <div className="flex items-center gap-[12px]">
            <img
              src={MODAL_DELETE_ICON}
              alt=""
              aria-hidden
              className="size-[42px] shrink-0 rounded-full"
            />
            <div className="flex min-w-0 flex-col gap-[2px]">
              <span
                className={`inline-flex w-fit items-center rounded-[6px] px-[8px] py-[2px] font-['Outfit:Medium'] text-[11px] font-medium ${
                  isError ? 'bg-[#e5484d]/12 text-[#e5484d]' : 'bg-[#f2f3e6] text-[#a6bb18]'
                }`}
              >
                {isError ? 'Validasi Struk Gagal' : 'Kualitas Struk Kurang Optimal'}
              </span>
              <h3
                id="validation-modal-title"
                className="font-['Outfit:SemiBold'] text-[17px] leading-[22px] font-semibold tracking-[-0.2px] text-[#054131]"
              >
                {issue.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            aria-label="Tutup peringatan"
            onClick={onRetake}
            className="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-[#f8f8ec] text-[#8e8e8e] transition hover:bg-[#eef0d6] hover:text-[#054131]"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Captured Preview + Description */}
        <div className="flex items-center gap-[12px] rounded-[12px] border border-[#ececec] bg-[#fefef8] p-[10px]">
          {capturedImage && (
            <div className="relative h-[68px] w-[54px] shrink-0 overflow-hidden rounded-[8px] border border-[#ececec] bg-[#d9d9d9]">
              <img src={capturedImage} alt="Pratinjau struk" className="size-full object-cover" />
              <span className="absolute inset-0 bg-[#e5484d]/15" />
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <p className="font-['Outfit:Medium'] text-[13px] font-medium text-[#054131]">{issue.subtitle}</p>
            <p id="validation-modal-desc" className="font-['Outfit:Regular'] text-[12px] leading-[17px] text-[#8e8e8e]">
              {issue.description}
            </p>
          </div>
        </div>

        {/* Diagnostic Quality Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 gap-[8px]">
            <MetricBar
              label="Pencahayaan"
              value={metrics.brightness}
              highlightBad={issue.code === 'too_dark' || issue.code === 'glare_overexposed'}
            />
            <MetricBar
              label="Ketajaman Fokus"
              value={metrics.sharpness}
              highlightBad={issue.code === 'blurry'}
            />
            <MetricBar
              label="Kontras Teks"
              value={metrics.contrast}
              highlightBad={issue.code === 'low_contrast_faded'}
            />
            <MetricBar
              label="Akurasi Struk"
              value={metrics.confidence}
              highlightBad={issue.code === 'not_receipt'}
            />
          </div>
        )}

        {/* Actionable Tips */}
        <div className="flex flex-col gap-[6px] rounded-[12px] bg-[#f2f3e6]/70 p-[12px]">
          <p className="font-['Outfit:Medium'] text-[12px] font-medium text-[#054131]">
            Saran perbaikan agar struk terbaca:
          </p>
          <ul className="flex flex-col gap-[4px]">
            {issue.tips.map((tip, idx) => (
              <li
                key={idx}
                className="flex items-start gap-[6px] font-['Outfit:Regular'] text-[12px] leading-[17px] text-[#054131]"
              >
                <span className="mt-[5px] size-[5px] shrink-0 rounded-full bg-[#a6bb18]" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-[8px] pt-[2px]">
          {issue.suggestTorch && onEnableTorchAndRetake ? (
            <button
              type="button"
              onClick={onEnableTorchAndRetake}
              className="flex w-full items-center justify-center gap-[8px] rounded-[10px] bg-[#a6bb18] py-[11px] px-[14px] font-['Outfit:Medium'] text-[14px] font-medium text-white transition hover:bg-[#97ab12] active:scale-[0.98]"
            >
              <span>Nyalakan Senter & Foto Ulang</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onRetake}
              className="flex w-full items-center justify-center gap-[8px] rounded-[10px] bg-[#a6bb18] py-[11px] px-[14px] font-['Outfit:Medium'] text-[14px] font-medium text-white transition hover:bg-[#97ab12] active:scale-[0.98]"
            >
              <span>Foto Ulang Struk</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-[8px]">
            <button
              type="button"
              onClick={onPickGallery}
              className="rounded-[10px] border border-[#ececec] bg-[#fefef8] py-[10px] px-[10px] font-['Outfit:Medium'] text-[13px] font-medium text-[#054131] transition hover:bg-[#f2f3e6]"
            >
              Pilih dari Galeri
            </button>
            <button
              type="button"
              onClick={onManualInput}
              className="rounded-[10px] bg-[#f2f3e6] py-[10px] px-[10px] font-['Outfit:Medium'] text-[13px] font-medium text-[#a6bb18] transition hover:bg-[#e8ead2]"
            >
              Input Manual Saja
            </button>
          </div>

          {issue.canForceContinue && onForceContinue && (
            <button
              type="button"
              onClick={onForceContinue}
              className="mt-[2px] w-full text-center font-['Outfit:Regular'] text-[12px] text-[#8e8e8e] underline transition hover:text-[#054131]"
            >
              Tetap lanjutkan dengan hasil pembacaan seadanya
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
