import { useState } from 'react'
import { BillSummarySkeleton, useSimulatedLoading } from '@/components/skeletons'
import { Badge, Icon, Img } from '@/components/ui'
import { ScanRoundButton } from '@/features/split-bill'
import { MOCK_CURRENT_USER } from '@/services/auth.service'
import { HOME_IMAGES, SCAN_ICONS, formatRupiah } from '@/services/bill.service'
import type { Bill, BillParticipant, PaymentStatus } from '@/types'
import { PaymentConfirmSheet } from './PaymentConfirmSheet'

export function BillSummaryScreen({
  bill,
  reminded,
  onBack,
  onRemind,
  onTogglePaid,
  onConfirmPayment,
  notify,
}: {
  bill: Bill
  reminded: Record<string, boolean>
  onBack: () => void
  onRemind: (billId: string, name: string) => void
  onTogglePaid: (billId: string, name: string) => void
  onConfirmPayment: (billId: string, name: string, status: PaymentStatus, proofUrl?: string) => void
  notify: (msg: string) => void
}) {
  const { isLoading } = useSimulatedLoading(true, 750)
  const [selectedParticipant, setSelectedParticipant] = useState<BillParticipant | null>(null)

  const paidCount = bill.participants.filter((p) => p.paid).length
  const totalCount = bill.participants.length

  const copyRekening = () => {
    navigator.clipboard?.writeText(MOCK_CURRENT_USER.bankAccountNo.replace(/\s+/g, '')).catch(() => undefined)
    notify('Nomor rekening berhasil disalin')
  }

  return (
    <div className="min-h-dvh w-full bg-white text-[#054131]">
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-[20px] px-[16px] pt-[24px] pb-[48px] md:pt-[32px]">
        {/* Header */}
        <header className="flex items-center justify-between gap-[10px]">
          <ScanRoundButton label="Kembali ke beranda" icon={SCAN_ICONS.back} onClick={onBack} />
          <div className="flex min-w-0 flex-1 items-center justify-center gap-[6px]">
            <h1 className="truncate font-['Outfit:Medium'] text-[18px] leading-[normal] font-medium tracking-[-0.2px] text-[#054131]">
              Rincian Tagihan
            </h1>
            <Badge>{bill.splitMethod === 'equal' ? 'Bagi Rata' : 'Per Menu'}</Badge>
          </div>
          <span className="size-[40px] shrink-0" aria-hidden />
        </header>

        {isLoading ? (
          <BillSummarySkeleton />
        ) : (
          <div className="stagger flex flex-col gap-[20px]">
            {/* Kartu Rincian Utama */}
            <div className="flex w-full flex-col gap-[14px] rounded-[12px] border border-[#ececec] bg-white p-[12px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[4px]">
                  <Icon src={HOME_IMAGES.chefHat} size={18} />
                  <p className="font-['Outfit:Medium'] text-[14px] leading-[normal] font-medium tracking-[-0.2px] whitespace-nowrap text-[#2233f5]">
                    {bill.category}
                  </p>
                </div>
                <p className="font-['Outfit:Regular'] text-[12px] leading-[normal] font-normal tracking-[-0.2px] whitespace-nowrap text-[#8e8e8e]">
                  {bill.time}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 font-['Outfit:Medium'] leading-[normal] font-medium tracking-[-0.2px]">
                <p className="truncate text-[18px] text-[#054131]">{bill.title}</p>
                <p className="shrink-0 text-[22px] tabular-nums text-[#054131]">{formatRupiah(bill.total)}</p>
              </div>

              <div className="relative h-0 w-full">
                <div className="absolute inset-[-2px_0_0_0]">
                  <img alt="" className="block size-full max-w-none" src={HOME_IMAGES.dashedLine} />
                </div>
              </div>

              {/* Daftar Menu / Item Pesanan */}
              {bill.items && bill.items.length > 0 && (
                <div className="flex flex-col gap-[8px]">
                  <p className="font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">Daftar Item Pesanan</p>
                  {bill.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-[8px] text-[14px]">
                      <div className="flex min-w-0 items-center gap-[6px]">
                        <span className="shrink-0 rounded-[4px] bg-[#f2f3e6] px-[6px] py-px font-['Outfit:Medium'] text-[12px] text-[#054131]">
                          {item.qty}x
                        </span>
                        <span className="truncate font-['Outfit:Regular'] text-[#054131]">{item.name}</span>
                      </div>
                      <span className="shrink-0 font-['Outfit:Regular'] tabular-nums text-[#054131]">
                        {formatRupiah(item.price)}
                      </span>
                    </div>
                  ))}
                  {(bill.taxAmount > 0 || bill.serviceAmount > 0) && (
                    <div className="mt-[2px] flex flex-col gap-[4px] border-t border-[#ececec] pt-[6px] text-[12px] text-[#8e8e8e]">
                      {bill.taxAmount > 0 && (
                        <div className="flex items-center justify-between">
                          <span>Pajak (PPN)</span>
                          <span className="tabular-nums">{formatRupiah(bill.taxAmount)}</span>
                        </div>
                      )}
                      {bill.serviceAmount > 0 && (
                        <div className="flex items-center justify-between">
                          <span>Service Charge</span>
                          <span className="tabular-nums">{formatRupiah(bill.serviceAmount)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Info Rekening Talangan */}
            <div className="flex w-full items-center justify-between gap-[12px] rounded-[12px] border border-[#ececec] bg-[#fefef8] p-[12px]">
              <div className="flex min-w-0 flex-col gap-[4px]">
                <p className="font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
                  Rekening Tujuan ({MOCK_CURRENT_USER.bankName} a.n. {MOCK_CURRENT_USER.fullName})
                </p>
                <p className="truncate font-['Outfit:SemiBold'] text-[16px] font-semibold tracking-[-0.2px] text-[#054131]">
                  {MOCK_CURRENT_USER.bankAccountNo}
                </p>
              </div>
              <button
                type="button"
                onClick={copyRekening}
                className="shrink-0 rounded-[8px] bg-[#f2f3e6] px-[14px] py-[8px] font-['Outfit:Medium'] text-[13px] font-medium text-[#a6bb18] transition hover:bg-[#e8ead2] active:scale-[0.98]"
              >
                Salin Rek
              </button>
            </div>

            {/* Status Pembayaran Peserta */}
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center justify-between">
                <h2 className="font-['Outfit:Medium'] text-[16px] font-medium text-[#054131]">
                  Status Peserta ({paidCount}/{totalCount} Lunas)
                </h2>
                <span className="font-['Outfit:Regular'] text-[12px] text-[#a6bb18]">
                  {paidCount === totalCount ? 'Semua sudah lunas' : `${totalCount - paidCount} belum bayar`}
                </span>
              </div>

              {bill.participants.map((p) => {
                const key = `${bill.id}-${p.name}`
                const share = p.totalOwed || Math.round(bill.total / Math.max(1, bill.participants.length))
                return (
                  <div
                    key={p.name}
                    className="flex w-full items-center justify-between gap-[10px] rounded-[10px] border border-[#ececec] bg-white p-[12px]"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-[10px]">
                      <button
                        type="button"
                        onClick={() => onTogglePaid(bill.id, p.name)}
                        title={p.paid ? 'Tandai belum lunas' : 'Tandai lunas'}
                        className="relative shrink-0 rounded-full transition hover:opacity-80"
                      >
                        <Icon src={p.avatarUrl} size={32} round />
                      </button>
                      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                        <div className="flex items-center gap-[6px]">
                          <p
                            className={`truncate font-['Outfit:Medium'] text-[14px] font-medium ${
                              p.paid ? 'text-[#2acb70]' : 'text-[#054131]'
                            }`}
                          >
                            {p.name}
                          </p>
                          {p.paid && (
                            <span className="relative size-[18px] shrink-0 overflow-clip">
                              <span className="absolute inset-[8.33%]">
                                <Img src={HOME_IMAGES.verified} alt="Lunas" skeleton="rounded-full" />
                              </span>
                            </span>
                          )}
                        </div>
                        <p className="font-['Outfit:Regular'] text-[13px] tabular-nums text-[#8e8e8e]">
                          {formatRupiah(share)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-[6px]">
                      {p.paid ? (
                        <button
                          type="button"
                          onClick={() => onTogglePaid(bill.id, p.name)}
                          className="rounded-[8px] bg-[#2acb70]/12 px-[10px] py-[6px] font-['Outfit:Medium'] text-[12px] font-medium text-[#2acb70] transition hover:bg-[#2acb70]/20"
                        >
                          Sudah Lunas
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            aria-label={`Ingatkan ${p.name}`}
                            onClick={() => onRemind(bill.id, p.name)}
                            className={`flex items-center gap-[4px] rounded-[8px] px-[8px] py-[6px] transition ${
                              reminded[key] ? 'bg-[#a6bb18]/25' : 'bg-[#f2f3e6] hover:bg-[#e8ead2]'
                            }`}
                          >
                            <Icon src={HOME_IMAGES.bellSmall} size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedParticipant({
                                ...p,
                                totalOwed: share,
                              })
                            }
                            className="rounded-[8px] bg-[#a6bb18] px-[10px] py-[6px] font-['Outfit:Medium'] text-[12px] font-medium whitespace-nowrap text-white transition hover:bg-[#97ab12] active:scale-[0.98]"
                          >
                            Konfirmasi Bayar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <PaymentConfirmSheet
        open={!!selectedParticipant}
        billId={bill.id}
        participant={selectedParticipant}
        onClose={() => setSelectedParticipant(null)}
        onConfirmed={(billId, name, status, proofUrl) => {
          onConfirmPayment(billId, name, status, proofUrl)
          notify(`Pembayaran ${name} dikonfirmasi lunas`)
        }}
        notify={notify}
      />
    </div>
  )
}

