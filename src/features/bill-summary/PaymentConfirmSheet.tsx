import { useRef, useState, type FormEvent } from 'react'
import { Icon, Sheet } from '@/components/ui'
import { MOCK_CURRENT_USER } from '@/services/auth.service'
import { formatRupiah, verifyPayment } from '@/services/bill.service'
import type { BillParticipant, PaymentStatus } from '@/types'

export function PaymentConfirmSheet({
  open,
  billId,
  participant,
  onClose,
  onConfirmed,
  notify,
}: {
  open: boolean
  billId: string
  participant: BillParticipant | null
  onClose: () => void
  onConfirmed: (billId: string, participantName: string, status: PaymentStatus, proofUrl?: string) => void
  notify: (msg: string) => void
}) {
  const [method, setMethod] = useState<'transfer' | 'qris' | 'cash'>('transfer')
  const [proofUrl, setProofUrl] = useState<string | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!participant) return null

  const copyAccount = () => {
    navigator.clipboard?.writeText(MOCK_CURRENT_USER.bankAccountNo.replace(/\s+/g, '')).catch(() => undefined)
    notify('Nomor rekening berhasil disalin')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const nextStatus: PaymentStatus = 'settled'
      await verifyPayment(billId, participant.name, nextStatus, proofUrl)
      onConfirmed(billId, participant.name, nextStatus, proofUrl)
      setProofUrl(undefined)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} labelledBy="confirm-pay-title">
      <form onSubmit={handleSubmit} className="flex flex-col gap-[16px] p-[20px] pt-[8px] pb-[32px]">
        <div className="mx-auto h-[4px] w-[64px] shrink-0 rounded-[12px] bg-[#dedede]" />

        <div className="flex items-center justify-between gap-[8px] pt-[8px]">
          <div className="flex min-w-0 items-center gap-[8px]">
            <Icon src={participant.avatarUrl} size={28} round />
            <div className="flex min-w-0 flex-col">
              <p
                id="confirm-pay-title"
                className="truncate font-['Outfit:Medium'] text-[16px] font-medium text-[#054131]"
              >
                Konfirmasi Bayar • {participant.name}
              </p>
              <p className="font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
                Opsi A — Verifikasi & Bukti Pembayaran
              </p>
            </div>
          </div>
          <p className="shrink-0 font-['Outfit:SemiBold'] text-[18px] font-semibold tabular-nums text-[#a6bb18]">
            {formatRupiah(participant.totalOwed)}
          </p>
        </div>

        {/* Metode Pembayaran */}
        <div className="grid grid-cols-3 gap-[8px]">
          {(
            [
              { id: 'transfer', label: 'Transfer Bank' },
              { id: 'qris', label: 'QRIS' },
              { id: 'cash', label: 'Tunai' },
            ] as const
          ).map((m) => {
            const active = method === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`rounded-[8px] border py-[8px] px-[8px] font-['Outfit:Medium'] text-[12px] font-medium transition ${
                  active
                    ? 'border-[#a6bb18] bg-[#f2f3e6] text-[#054131]'
                    : 'border-[#ececec] bg-white text-[#8e8e8e] hover:bg-[#fefef8]'
                }`}
              >
                {m.label}
              </button>
            )
          })}
        </div>

        {/* Detail Rekening Tujuan */}
        {method === 'transfer' && (
          <div className="flex items-center justify-between gap-[10px] rounded-[10px] border border-[#ececec] bg-[#fefef8] p-[12px]">
            <div className="flex min-w-0 flex-col gap-[2px]">
              <span className="font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
                Rekening Talangan ({MOCK_CURRENT_USER.bankName})
              </span>
              <span className="truncate font-['Outfit:SemiBold'] text-[15px] font-semibold text-[#054131]">
                {MOCK_CURRENT_USER.bankAccountNo}
              </span>
              <span className="font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
                a.n. {MOCK_CURRENT_USER.fullName}
              </span>
            </div>
            <button
              type="button"
              onClick={copyAccount}
              className="shrink-0 rounded-[8px] bg-[#f2f3e6] px-[12px] py-[6px] font-['Outfit:Medium'] text-[12px] font-medium text-[#a6bb18] transition hover:bg-[#e8ead2]"
            >
              Salin
            </button>
          </div>
        )}

        {method === 'qris' && (
          <div className="flex flex-col items-center gap-[8px] rounded-[10px] border border-[#ececec] bg-[#fefef8] p-[14px] text-center">
            <div className="flex size-[96px] items-center justify-center rounded-[10px] border border-dashed border-[#dedede] bg-white p-[10px]">
              <img alt="QRIS Kloop" src={MOCK_CURRENT_USER.qrisUrl} className="max-h-full max-w-full object-contain" />
            </div>
            <p className="font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
              Scan QRIS a.n. {MOCK_CURRENT_USER.fullName} sesuai nominal tagihan
            </p>
          </div>
        )}

        {/* Upload Bukti Bayar (Opsional) */}
        <div className="flex flex-col gap-[6px]">
          <span className="font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
            Bukti Transfer / Pembayaran (Opsional)
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) setProofUrl(URL.createObjectURL(f))
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-[8px] rounded-[10px] border border-dashed border-[#dedede] bg-[#fefef8] px-[12px] py-[12px] font-['Outfit:Regular'] text-[13px] text-[#054131] transition hover:border-[#a6bb18] hover:bg-[#f2f3e6]/40"
          >
            {proofUrl ? '✓ Bukti pembayaran terlampir (Ganti foto)' : '+ Lampirkan foto bukti transfer'}
          </button>
        </div>

        <div className="flex gap-[10px] pt-[4px]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[8px] bg-[#f2f3e6] py-[10px] font-['Outfit:Medium'] text-[14px] font-medium text-[#a6bb18] transition duration-200 hover:bg-[#e8ead2] active:scale-[0.98]"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-[1.5] rounded-[8px] bg-[#a6bb18] py-[10px] font-['Outfit:Medium'] text-[14px] font-medium text-white transition duration-200 hover:bg-[#97ab12] active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? 'Memproses...' : 'Konfirmasi Lunas'}
          </button>
        </div>
      </form>
    </Sheet>
  )
}

