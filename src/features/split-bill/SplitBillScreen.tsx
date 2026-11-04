import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ScanResultSkeleton, useSimulatedLoading } from '@/components/skeletons'
import { Badge, Icon, Img } from '@/components/ui'
import {
  CIRCLE_AVATARS,
  HOME_IMAGES,
  SCAN_ICONS,
  formatRupiah,
  parseScannedReceipt,
  type CircleName,
  type CreateBillInput,
} from '@/services/bill.service'
import type { BillItem, JenisOption, SplitMethod } from '@/types'
import { ScanRoundButton } from './ScanScreen'

export function SplitBillScreen({
  jenis,
  circle,
  initialTitle = '',
  initialTotal = 0,
  fromScan = false,
  onBack,
  onSaveBill,
  notify,
}: {
  jenis: JenisOption
  circle: CircleName[]
  initialTitle?: string
  initialTotal?: number
  fromScan?: boolean
  onBack: () => void
  onSaveBill: (input: CreateBillInput) => void
  notify: (msg: string) => void
}) {
  const { isLoading } = useSimulatedLoading(true, 800)
  const defaultMethod: SplitMethod = jenis.id === 'flat' ? 'equal' : 'per_item'
  const [splitMethod, setSplitMethod] = useState<SplitMethod>(defaultMethod)
  const [title, setTitle] = useState(initialTitle || (fromScan ? 'Struk hasil scan' : 'Kopi Nako Tembalang'))

  const availableFriends = useMemo<CircleName[]>(
    () => (circle.length > 0 ? circle : (Object.keys(CIRCLE_AVATARS) as CircleName[]).slice(0, 4)),
    [circle],
  )
  const [selectedFriends, setSelectedFriends] = useState<CircleName[]>(() => availableFriends.slice(0, 3))

  const [items, setItems] = useState<BillItem[]>([])
  const [taxAmount, setTaxAmount] = useState(fromScan ? 11500 : 0)
  const [serviceAmount, setServiceAmount] = useState(fromScan ? 4000 : 0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [equalTotalInput, setEqualTotalInput] = useState(initialTotal > 0 ? String(initialTotal) : '128500')

  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemQty, setNewItemQty] = useState('1')

  useEffect(() => {
    let alive = true
    const defaultAssigned = availableFriends.slice(0, 3)
    if (fromScan) {
      parseScannedReceipt(jenis.title, defaultAssigned, 300).then((draft) => {
        if (!alive) return
        setTitle(initialTitle || draft.title)
        setItems(draft.items)
        setTaxAmount(draft.taxAmount)
        setServiceAmount(draft.serviceAmount)
        setDiscountAmount(draft.discountAmount)
      })
    } else {
      const baseTotal = initialTotal > 0 ? initialTotal : 120000
      setItems([
        {
          id: 'manual-item-1',
          billId: 'draft-manual',
          name: initialTitle || 'Paket Menu Bersama',
          qty: 1,
          price: baseTotal,
          assignedParticipantIds: defaultAssigned,
        },
      ])
    }
    return () => {
      alive = false
    }
  }, [fromScan, jenis.title, availableFriends, initialTitle, initialTotal])

  const toggleFriendInBill = (friend: CircleName) => {
    setSelectedFriends((prev) => {
      if (prev.includes(friend)) {
        if (prev.length <= 1) {
          notify('Minimal 1 teman harus dipilih')
          return prev
        }
        const next = prev.filter((f) => f !== friend)
        setItems((currItems) =>
          currItems.map((it) => ({
            ...it,
            assignedParticipantIds: it.assignedParticipantIds.filter((id) => id !== friend),
          })),
        )
        return next
      }
      return [...prev, friend]
    })
  }

  const toggleFriendOnItem = (itemId: string, friend: CircleName) => {
    if (!selectedFriends.includes(friend)) {
      setSelectedFriends((prev) => [...prev, friend])
    }
    setItems((curr) =>
      curr.map((it) => {
        if (it.id !== itemId) return it
        const exists = it.assignedParticipantIds.includes(friend)
        const nextAssigned = exists
          ? it.assignedParticipantIds.filter((id) => id !== friend)
          : [...it.assignedParticipantIds, friend]
        return {
          ...it,
          assignedParticipantIds: nextAssigned,
        }
      }),
    )
  }

  const assignAllToItem = (itemId: string) => {
    setItems((curr) =>
      curr.map((it) => (it.id === itemId ? { ...it, assignedParticipantIds: [...selectedFriends] } : it)),
    )
  }

  const updateItemQty = (itemId: string, delta: number) => {
    setItems((curr) =>
      curr.map((it) => {
        if (it.id !== itemId) return it
        const nextQty = Math.max(1, it.qty + delta)
        const unitPrice = Math.round(it.price / Math.max(1, it.qty))
        return {
          ...it,
          qty: nextQty,
          price: unitPrice * nextQty,
        }
      }),
    )
  }

  const removeItem = (itemId: string) => {
    if (items.length <= 1) {
      notify('Minimal harus ada 1 item pesanan')
      return
    }
    setItems((curr) => curr.filter((it) => it.id !== itemId))
  }

  const handleAddItem = (e: FormEvent) => {
    e.preventDefault()
    const cleanName = newItemName.trim()
    const unitPrice = Number(newItemPrice.replace(/\D/g, ''))
    const qty = Math.max(1, Number(newItemQty.replace(/\D/g, '')) || 1)
    if (!cleanName || !unitPrice) {
      notify('Isi nama menu dan harga terlebih dahulu')
      return
    }
    const newItem: BillItem = {
      id: `item-${Date.now()}`,
      billId: 'draft',
      name: cleanName,
      qty,
      price: unitPrice * qty,
      assignedParticipantIds: [...selectedFriends],
    }
    setItems((curr) => [...curr, newItem])
    setNewItemName('')
    setNewItemPrice('')
    setNewItemQty('1')
    notify(`Menu "${cleanName}" ditambahkan`)
  }

  const itemsSubtotal = useMemo(() => items.reduce((acc, it) => acc + it.price, 0), [items])

  const grandTotal = useMemo(() => {
    if (splitMethod === 'equal') {
      const parsed = Number(equalTotalInput.replace(/\D/g, ''))
      return parsed > 0 ? parsed : itemsSubtotal + taxAmount + serviceAmount - discountAmount
    }
    return Math.max(0, itemsSubtotal + taxAmount + serviceAmount - discountAmount)
  }, [splitMethod, equalTotalInput, itemsSubtotal, taxAmount, serviceAmount, discountAmount])

  const participantShares = useMemo(() => {
    const count = Math.max(1, selectedFriends.length)
    if (splitMethod === 'equal') {
      const share = Math.round(grandTotal / count)
      return selectedFriends.map((name) => ({
        name,
        avatarUrl: CIRCLE_AVATARS[name],
        totalOwed: share,
      }))
    }

    const rawSubtotals: Record<string, number> = {}
    selectedFriends.forEach((f) => {
      rawSubtotals[f] = 0
    })

    items.forEach((item) => {
      const assignees = item.assignedParticipantIds.filter((id) => selectedFriends.includes(id as CircleName))
      const effectiveAssignees = assignees.length > 0 ? assignees : selectedFriends
      const perPerson = item.price / Math.max(1, effectiveAssignees.length)
      effectiveAssignees.forEach((f) => {
        rawSubtotals[f] = (rawSubtotals[f] || 0) + perPerson
      })
    })

    const extraCharges = taxAmount + serviceAmount - discountAmount
    return selectedFriends.map((name) => {
      const base = rawSubtotals[name] || 0
      const ratio = itemsSubtotal > 0 ? base / itemsSubtotal : 1 / count
      const totalOwed = Math.max(0, Math.round(base + extraCharges * ratio))
      return {
        name,
        avatarUrl: CIRCLE_AVATARS[name],
        totalOwed,
      }
    })
  }, [selectedFriends, splitMethod, grandTotal, items, taxAmount, serviceAmount, discountAmount, itemsSubtotal])

  const handleFinish = () => {
    const cleanTitle = title.trim() || 'Struk hasil scan'
    if (grandTotal <= 0) {
      notify('Total tagihan belum valid')
      return
    }
    onSaveBill({
      title: cleanTitle,
      category: jenis.title,
      totalAmount: grandTotal,
      taxAmount: splitMethod === 'per_item' ? taxAmount : 0,
      serviceAmount: splitMethod === 'per_item' ? serviceAmount : 0,
      discountAmount: splitMethod === 'per_item' ? discountAmount : 0,
      splitMethod,
      participants: participantShares.map((p) => ({
        name: p.name,
        avatarUrl: p.avatarUrl,
        totalOwed: p.totalOwed,
        paid: false,
      })),
      items,
    })
  }

  return (
    <div className="min-h-dvh w-full bg-white text-[#054131]">
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-[20px] px-[16px] pt-[24px] pb-[40px] md:pt-[32px]">
        {/* Header */}
        <header className="flex items-center justify-between gap-[10px]">
          <ScanRoundButton label="Kembali" icon={SCAN_ICONS.back} onClick={onBack} />
          <div className="flex min-w-0 flex-1 items-center justify-center gap-[6px]">
            <h1 className="truncate font-['Outfit:Medium'] text-[18px] leading-[normal] font-medium tracking-[-0.2px] text-[#054131]">
              Atur Pembagian
            </h1>
            <Badge>{jenis.title}</Badge>
          </div>
          <span className="size-[40px] shrink-0" aria-hidden />
        </header>

        {isLoading ? (
          <ScanResultSkeleton />
        ) : (
          <div className="stagger flex flex-col gap-[20px]">
            {/* Nama Tempat & Ringkasan */}
            <div className="flex flex-col gap-[10px] rounded-[12px] border border-[#ececec] bg-white p-[12px]">
              <label className="flex flex-col gap-[6px] font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
                Nama tempat / tagihan
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="cth. Kopi Nako Tembalang"
                  className="w-full truncate rounded-[8px] border border-[#ececec] bg-[#fefef8] px-[12px] py-[10px] font-['Outfit:Medium'] text-[15px] font-medium text-[#054131] outline-none transition focus:border-[#a6bb18] focus:shadow-[0_0_0_3px_rgba(166,187,24,0.14)]"
                />
              </label>

              {/*Pilih Teman yang Ikut Patungan */}
              <div className="flex flex-col gap-[8px] pt-[4px]">
                <div className="flex items-center justify-between">
                  <span className="font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
                    Teman yang ikut ({selectedFriends.length} dipilih)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFriends([...availableFriends])}
                    className="font-['Outfit:Medium'] text-[12px] font-medium text-[#a6bb18] hover:underline"
                  >
                    Pilih Semua
                  </button>
                </div>
                <div className="flex flex-wrap gap-[8px]">
                  {availableFriends.map((friend) => {
                    const active = selectedFriends.includes(friend)
                    return (
                      <button
                        key={friend}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleFriendInBill(friend)}
                        className={`flex max-w-[128px] items-center gap-[6px] rounded-[999px] border px-[8px] py-[4px] transition duration-200 active:scale-95 ${
                          active
                            ? 'border-[#a6bb18] bg-[#f2f3e6] text-[#054131]'
                            : 'border-[#ececec] bg-white text-[#8e8e8e] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Icon src={CIRCLE_AVATARS[friend]} size={20} round />
                        <span className="truncate font-['Outfit:Regular'] text-[12px]">{friend}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Toggle Tab: Bagi Rata vs Per Menu */}
            <div
              role="tablist"
              aria-label="Metode pembagian tagihan"
              className="grid grid-cols-2 gap-[8px] rounded-[10px] border border-[#ececec] bg-white p-[6px]"
            >
              {(
                [
                  { key: 'per_item', label: 'Per Menu' },
                  { key: 'equal', label: 'Bagi Rata' },
                ] as const
              ).map((tab) => {
                const active = splitMethod === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setSplitMethod(tab.key)
                      if (tab.key === 'equal') {
                        setEqualTotalInput(String(itemsSubtotal + taxAmount + serviceAmount - discountAmount))
                      }
                    }}
                    className={`flex items-center justify-center gap-[6px] rounded-[8px] py-[8px] px-[12px] font-['Outfit:Medium'] text-[14px] font-medium transition-colors duration-200 ${
                      active ? 'bg-[#a6bb18] text-white' : 'bg-white text-[#8e8e8e] hover:bg-[#f8f8ec]'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {splitMethod === 'per_item' ? (
              <>
                {/* Daftar Menu & Pilih Avatar Teman per Item */}
                <div className="flex flex-col gap-[12px]">
                  <div className="flex items-center justify-between">
                    <h2 className="font-['Outfit:Medium'] text-[16px] font-medium text-[#054131]">
                      Daftar Menu ({items.length})
                    </h2>
                    <span className="font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
                      Ketuk avatar untuk bagi menu
                    </span>
                  </div>

                  {items.map((item) => {
                    return (
                      <div
                        key={item.id}
                        className="flex w-full flex-col gap-[10px] rounded-[12px] border border-[#ececec] bg-white p-[12px]"
                      >
                        <div className="flex items-start justify-between gap-[10px]">
                          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                            <p className="truncate font-['Outfit:Medium'] text-[15px] font-medium text-[#054131]">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-[8px]">
                              <div className="flex items-center gap-[6px] rounded-[6px] border border-[#ececec] bg-[#fefef8] px-[6px] py-[2px]">
                                <button
                                  type="button"
                                  aria-label={`Kurangi jumlah ${item.name}`}
                                  onClick={() => updateItemQty(item.id, -1)}
                                  className="px-[4px] font-['Outfit:Medium'] text-[13px] text-[#054131] hover:text-[#a6bb18]"
                                >
                                  −
                                </button>
                                <span className="font-['Outfit:Regular'] text-[12px] tabular-nums text-[#054131]">
                                  {item.qty}x
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Tambah jumlah ${item.name}`}
                                  onClick={() => updateItemQty(item.id, 1)}
                                  className="px-[4px] font-['Outfit:Medium'] text-[13px] text-[#054131] hover:text-[#a6bb18]"
                                >
                                  +
                                </button>
                              </div>
                              {items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="font-['Outfit:Regular'] text-[12px] text-[#8e8e8e] hover:text-[#d14343]"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="shrink-0 font-['Outfit:SemiBold'] text-[16px] font-semibold tabular-nums text-[#054131]">
                            {formatRupiah(item.price)}
                          </p>
                        </div>

                        <div className="relative h-0 w-full">
                          <div className="absolute inset-[-1px_0_0_0]">
                            <img alt="" className="block size-full max-w-none" src={HOME_IMAGES.dashedLine} />
                          </div>
                        </div>

                        <div className="flex flex-col gap-[8px]">
                          <div className="flex items-center justify-between">
                            <span className="font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
                              Dibagi ke ({item.assignedParticipantIds.length} teman):
                            </span>
                            <button
                              type="button"
                              onClick={() => assignAllToItem(item.id)}
                              className="font-['Outfit:Regular'] text-[12px] text-[#a6bb18] hover:underline"
                            >
                              Semua
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-[8px]">
                            {selectedFriends.map((friend) => {
                              const assigned = item.assignedParticipantIds.includes(friend)
                              return (
                                <button
                                  key={friend}
                                  type="button"
                                  aria-pressed={assigned}
                                  onClick={() => toggleFriendOnItem(item.id, friend)}
                                  className={`flex max-w-[116px] items-center gap-[5px] rounded-[999px] border px-[8px] py-[4px] transition duration-150 active:scale-95 ${
                                    assigned
                                      ? 'border-[#a6bb18] bg-[#f2f3e6] text-[#054131] ring-1 ring-[#a6bb18]'
                                      : 'border-[#ececec] bg-white text-[#8e8e8e] opacity-65 hover:opacity-100'
                                  }`}
                                >
                                  <Icon src={CIRCLE_AVATARS[friend]} size={18} round />
                                  <span className="truncate font-['Outfit:Regular'] text-[12px]">{friend}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Form Tambah Menu Baru */}
                  <form
                    onSubmit={handleAddItem}
                    className="flex flex-col gap-[10px] rounded-[12px] border border-dashed border-[#dedede] bg-[#fefef8] p-[12px]"
                  >
                    <p className="font-['Outfit:Medium'] text-[13px] font-medium text-[#054131]">+ Tambah Menu Lainnya</p>
                    <div className="grid grid-cols-1 gap-[8px] sm:grid-cols-12">
                      <input
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Nama menu (cth. Matcha Latte)"
                        className="rounded-[8px] border border-[#ececec] bg-white px-[10px] py-[8px] font-['Outfit:Regular'] text-[13px] text-[#054131] outline-none focus:border-[#a6bb18] sm:col-span-6"
                      />
                      <input
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(e.target.value)}
                        inputMode="numeric"
                        placeholder="Qty"
                        className="rounded-[8px] border border-[#ececec] bg-white px-[10px] py-[8px] font-['Outfit:Regular'] text-[13px] text-[#054131] outline-none focus:border-[#a6bb18] sm:col-span-2"
                      />
                      <input
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        inputMode="numeric"
                        placeholder="Harga satuan (Rp)"
                        className="rounded-[8px] border border-[#ececec] bg-white px-[10px] py-[8px] font-['Outfit:Regular'] text-[13px] text-[#054131] outline-none focus:border-[#a6bb18] sm:col-span-4"
                      />
                    </div>
                    <button
                      type="submit"
                      className="self-end rounded-[8px] bg-[#f2f3e6] px-[12px] py-[6px] font-['Outfit:Medium'] text-[13px] font-medium text-[#a6bb18] transition hover:bg-[#e8ead2]"
                    >
                      Tambah ke Daftar
                    </button>
                  </form>
                </div>

                {/* Pajak & Biaya Layanan */}
                <div className="flex flex-col gap-[10px] rounded-[12px] border border-[#ececec] bg-white p-[12px]">
                  <p className="font-['Outfit:Medium'] text-[14px] font-medium text-[#054131]">
                    Pajak & Biaya Tambahan
                  </p>
                  <div className="grid grid-cols-2 gap-[10px]">
                    <label className="flex flex-col gap-[4px] font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
                      Pajak / PPN (Rp)
                      <input
                        inputMode="numeric"
                        value={taxAmount || ''}
                        placeholder="0"
                        onChange={(e) => setTaxAmount(Number(e.target.value.replace(/\D/g, '')) || 0)}
                        className="rounded-[8px] border border-[#ececec] px-[10px] py-[8px] font-['Outfit:Regular'] text-[13px] text-[#054131] outline-none focus:border-[#a6bb18]"
                      />
                    </label>
                    <label className="flex flex-col gap-[4px] font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
                      Service Charge (Rp)
                      <input
                        inputMode="numeric"
                        value={serviceAmount || ''}
                        placeholder="0"
                        onChange={(e) => setServiceAmount(Number(e.target.value.replace(/\D/g, '')) || 0)}
                        className="rounded-[8px] border border-[#ececec] px-[10px] py-[8px] font-['Outfit:Regular'] text-[13px] text-[#054131] outline-none focus:border-[#a6bb18]"
                      />
                    </label>
                  </div>
                </div>
              </>
            ) : (
              /* Mode Bagi Rata (Flat) */
              <div className="flex flex-col gap-[14px] rounded-[12px] border border-[#ececec] bg-white p-[12px]">
                <label className="flex flex-col gap-[6px] font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
                  Total Tagihan Bersama (Rp)
                  <input
                    inputMode="numeric"
                    value={equalTotalInput}
                    onChange={(e) => setEqualTotalInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="185000"
                    className="rounded-[8px] border border-[#ececec] bg-[#fefef8] px-[12px] py-[10px] font-['Outfit:SemiBold'] text-[20px] font-semibold text-[#054131] outline-none focus:border-[#a6bb18]"
                  />
                </label>
                <div className="flex items-center justify-between rounded-[8px] bg-[#f2f3e6] px-[12px] py-[10px]">
                  <span className="font-['Outfit:Regular'] text-[13px] text-[#054131]">
                    Dibagi rata ke {selectedFriends.length} teman
                  </span>
                  <span className="font-['Outfit:SemiBold'] text-[16px] font-semibold tabular-nums text-[#a6bb18]">
                    {formatRupiah(Math.round(grandTotal / Math.max(1, selectedFriends.length)))} / orang
                  </span>
                </div>
              </div>
            )}

            {/* Preview Pembagian per Teman */}
            <div className="flex flex-col gap-[10px] rounded-[12px] border border-[#ececec] bg-white p-[12px]">
              <div className="flex items-center justify-between">
                <p className="font-['Outfit:Medium'] text-[14px] font-medium text-[#054131]">
                  Ringkasan per Teman
                </p>
                <p className="font-['Outfit:SemiBold'] text-[16px] font-semibold tabular-nums text-[#054131]">
                  Total: {formatRupiah(grandTotal)}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-[8px] sm:grid-cols-2">
                {participantShares.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between gap-[8px] rounded-[8px] border border-[#ececec] bg-[#fefef8] px-[10px] py-[8px]"
                  >
                    <div className="flex min-w-0 items-center gap-[8px]">
                      <span className="relative block size-[24px] shrink-0">
                        <Img src={p.avatarUrl} skeleton="rounded-full" />
                      </span>
                      <span className="truncate font-['Outfit:Regular'] text-[14px] text-[#054131]">{p.name}</span>
                    </div>
                    <span className="shrink-0 font-['Outfit:Medium'] text-[14px] font-medium tabular-nums text-[#a6bb18]">
                      {formatRupiah(p.totalOwed)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-[10px]">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 rounded-[10px] bg-[#f2f3e6] py-[12px] font-['Outfit:Medium'] text-[14px] font-medium text-[#a6bb18] transition hover:bg-[#e8ead2] active:scale-[0.98]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-[2] rounded-[10px] bg-[#a6bb18] py-[12px] font-['Outfit:Medium'] text-[14px] font-medium text-white transition hover:bg-[#97ab12] active:scale-[0.98]"
              >
                Simpan & Lihat Rincian
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

