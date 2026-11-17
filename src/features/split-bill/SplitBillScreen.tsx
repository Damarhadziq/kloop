import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ScanResultSkeleton, useSimulatedLoading } from '@/components/skeletons'
import { Badge, ConfirmModal, Icon, Img, usePresence } from '@/components/ui'
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
  const splitScreenAssets = useMemo(
    () => [...Object.values(CIRCLE_AVATARS), ...Object.values(SCAN_ICONS), HOME_IMAGES.dashedLine],
    [],
  )
  const { isLoading } = useSimulatedLoading(true, 650, splitScreenAssets)

  const defaultMethod: SplitMethod = jenis.id === 'flat' ? 'equal' : 'per_item'
  const [splitMethod, setSplitMethod] = useState<SplitMethod>(defaultMethod)
  const [title, setTitle] = useState(initialTitle || (fromScan ? 'Kopi Nako Tembalang' : 'Kopi Nako Tembalang'))

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

  // Per-menu paged scroll state & Top-Right Menu List Popover state
  const [activeMenuIdx, setActiveMenuIdx] = useState(0)
  const [menuListOpen, setMenuListOpen] = useState(false)
  const { mounted: menuListMounted, closing: menuListClosing } = usePresence(menuListOpen, 180)
  const menuPopoverRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  // Confirmation modal state for destructive actions (delete item, cancel bill)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel: string
    onConfirm: () => void
  }>({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Hapus',
    onConfirm: () => undefined,
  })

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

  // Close top-right menu list popover on outside click or Escape
  useEffect(() => {
    if (!menuListOpen) return
    const onDown = (e: PointerEvent) => !menuPopoverRef.current?.contains(e.target as Node) && setMenuListOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuListOpen(false)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuListOpen])

  const scrollToMenuCard = (idx: number) => {
    setActiveMenuIdx(idx)
    const target = cardRefs.current[idx]
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  const handleMenuScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return
    const scrollTop = container.scrollTop
    const cardHeight = container.clientHeight * 0.82
    const nextIdx = Math.max(0, Math.min(items.length, Math.round(scrollTop / Math.max(1, cardHeight))))
    if (nextIdx !== activeMenuIdx) {
      setActiveMenuIdx(nextIdx)
    }
  }

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

  const updateItemName = (itemId: string, name: string) => {
    setItems((curr) => curr.map((it) => (it.id === itemId ? { ...it, name } : it)))
  }

  const updateItemPrice = (itemId: string, rawPrice: string) => {
    const price = Number(rawPrice.replace(/\D/g, '')) || 0
    setItems((curr) => curr.map((it) => (it.id === itemId ? { ...it, price } : it)))
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

  const requestRemoveItem = (item: BillItem) => {
    if (items.length <= 1) {
      notify('Minimal harus ada 1 item pesanan')
      return
    }
    setConfirmDialog({
      open: true,
      title: 'Hapus Menu Pesanan?',
      description: `Menu "${item.name}" (${formatRupiah(item.price)}) akan dihapus dari daftar pembagian tagihan.`,
      confirmLabel: 'Ya, Hapus Menu',
      onConfirm: () => {
        setItems((curr) => curr.filter((it) => it.id !== item.id))
        setActiveMenuIdx((idx) => Math.max(0, idx - 1))
        notify(`Menu "${item.name}" dihapus`)
      },
    })
  }

  const requestCancelBack = () => {
    setConfirmDialog({
      open: true,
      title: 'Batalkan Pengaturan Tagihan?',
      description: 'Perubahan pembagian menu yang belum disimpan akan hilang jika kamu keluar halaman ini.',
      confirmLabel: 'Ya, Keluar',
      onConfirm: onBack,
    })
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
    const nextIdx = items.length
    setItems((curr) => [...curr, newItem])
    setNewItemName('')
    setNewItemPrice('')
    setNewItemQty('1')
    notify(`Menu "${cleanName}" ditambahkan`)
    setTimeout(() => scrollToMenuCard(nextIdx), 120)
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
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-[16px] px-[16px] pt-[24px] pb-[32px] md:pt-[32px]">
        {/* Header with Top-Right Menu List Popover */}
        <header className="relative z-30 flex items-center justify-between gap-[10px]">
          <ScanRoundButton label="Kembali" icon={SCAN_ICONS.back} onClick={requestCancelBack} />
          <div className="flex min-w-0 flex-1 items-center justify-center gap-[6px]">
            <h1 className="truncate font-['Outfit:Medium'] text-[18px] leading-[normal] font-medium tracking-[-0.2px] text-[#054131]">
              Atur Pembagian
            </h1>
            <Badge>{jenis.title}</Badge>
          </div>

          {/* Top-Right Menu List Trigger & Popover */}
          <div ref={menuPopoverRef} className="relative shrink-0">
            <button
              type="button"
              aria-label="Daftar menu pesanan"
              aria-expanded={menuListOpen}
              onClick={() => setMenuListOpen((o) => !o)}
              className={`flex items-center gap-[6px] rounded-full border px-[11px] py-[7px] font-['Outfit:Medium'] text-[12px] font-medium transition active:scale-95 ${
                menuListOpen
                  ? 'border-[#a6bb18] bg-[#f2f3e6] text-[#054131]'
                  : 'border-[#ececec] bg-[#f8f8ec] text-[#054131] hover:bg-[#eef0d6]'
              }`}
            >
              {/* Hugeicons MenuRestaurant /Task01 Icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[#a6bb18]">
                <path
                  d="M9 6H20M9 12H20M9 18H20M4.5 6H4.51M4.5 12H4.51M4.5 18H4.51"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="tabular-nums">{items.length} Menu</span>
            </button>

            {menuListMounted && (
              <div
                role="dialog"
                aria-label="Daftar semua menu"
                className={`absolute top-[46px] right-0 z-40 flex w-[284px] origin-top-right flex-col gap-[8px] rounded-[16px] border border-[#ececec] bg-white p-[12px] shadow-[0_16px_38px_rgba(5,65,49,0.16)] ${
                  menuListClosing
                    ? '[animation:menu-out_180ms_ease-in_forwards]'
                    : '[animation:menu-in_220ms_cubic-bezier(0.2,0.8,0.2,1)]'
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#ececec] pb-[8px]">
                  <span className="font-['Outfit:Medium'] text-[13px] font-medium text-[#054131]">
                    Daftar Menu ({items.length})
                  </span>
                  <span className="font-['Outfit:Regular'] text-[11px] text-[#8e8e8e]">Ketuk untuk lompat</span>
                </div>

                <div className="flex max-h-[230px] flex-col gap-[6px] overflow-y-auto pr-[2px]">
                  {items.map((it, idx) => {
                    const isCurrent = activeMenuIdx === idx && splitMethod === 'per_item'
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => {
                          setSplitMethod('per_item')
                          scrollToMenuCard(idx)
                          setMenuListOpen(false)
                        }}
                        className={`flex w-full items-center justify-between gap-[8px] rounded-[10px] border px-[10px] py-[8px] text-left transition ${
                          isCurrent
                            ? 'border-[#a6bb18] bg-[#f2f3e6] text-[#054131]'
                            : 'border-[#ececec] bg-[#fefef8] text-[#054131] hover:border-[#a6bb18]'
                        }`}
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                          <p className="truncate font-['Outfit:Medium'] text-[13px] font-medium">
                            {idx + 1}. {it.name || 'Menu Tanpa Nama'}
                          </p>
                          <p className="font-['Outfit:Regular'] text-[11px] text-[#8e8e8e]">
                            {it.qty}x • {it.assignedParticipantIds.length} teman
                          </p>
                        </div>
                        <span className="shrink-0 font-['Outfit:SemiBold'] text-[12px] font-semibold tabular-nums text-[#a6bb18]">
                          {formatRupiah(it.price)}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSplitMethod('per_item')
                    scrollToMenuCard(items.length)
                    setMenuListOpen(false)
                  }}
                  className="mt-[2px] flex w-full items-center justify-center gap-[6px] rounded-[8px] bg-[#f2f3e6] py-[8px] font-['Outfit:Medium'] text-[12px] font-medium text-[#a6bb18] transition hover:bg-[#e8ead2]"
                >
                  <span>+ Tambah Menu & Pajak</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {isLoading ? (
          <ScanResultSkeleton />
        ) : (
          <div className="stagger flex flex-col gap-[14px]">
            {/* Nama Tempat & Pilih Teman yang Ikut */}
            <div className="flex flex-col gap-[10px] rounded-[12px] border border-[#ececec] bg-white p-[12px]">
              <label className="flex flex-col gap-[5px] font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
                Nama tempat / tagihan
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="cth. Kopi Nako Tembalang"
                  className="w-full truncate rounded-[8px] border border-[#ececec] bg-[#fefef8] px-[12px] py-[9px] font-['Outfit:Medium'] text-[15px] font-medium text-[#054131] outline-none transition focus:border-[#a6bb18] focus:shadow-[0_0_0_3px_rgba(166,187,24,0.14)]"
                />
              </label>

              <div className="flex flex-col gap-[6px]">
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
                <div className="flex items-center gap-[6px] overflow-x-auto pb-[2px]">
                  {availableFriends.map((friend) => {
                    const active = selectedFriends.includes(friend)
                    return (
                      <button
                        key={friend}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleFriendInBill(friend)}
                        className={`flex shrink-0 items-center gap-[5px] rounded-[999px] border px-[8px] py-[4px] transition duration-200 active:scale-95 ${
                          active
                            ? 'border-[#a6bb18] bg-[#f2f3e6] text-[#054131]'
                            : 'border-[#ececec] bg-white text-[#8e8e8e] opacity-70 hover:opacity-100'
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

            {/* Toggle Tab: Per Menu vs Bagi Rata */}
            <div
              role="tablist"
              aria-label="Metode pembagian tagihan"
              className="grid grid-cols-2 gap-[8px] rounded-[10px] border border-[#ececec] bg-white p-[5px]"
            >
              {(
                [
                  { key: 'per_item', label: 'Per Menu (Scroll)' },
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
                    className={`flex items-center justify-center gap-[6px] rounded-[8px] py-[8px] px-[12px] font-['Outfit:Medium'] text-[13px] font-medium transition-colors duration-200 ${
                      active ? 'bg-[#a6bb18] text-white' : 'bg-white text-[#8e8e8e] hover:bg-[#f8f8ec]'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {splitMethod === 'per_item' ? (
              <div className="flex flex-col gap-[8px]">
                {/* Page Indicator & Scroll Hint Bar */}
                <div className="flex items-center justify-between px-[4px]">
                  <span className="font-['Outfit:Medium'] text-[13px] font-medium text-[#054131]">
                    {activeMenuIdx < items.length
                      ? `Menu ${activeMenuIdx + 1} dari ${items.length}`
                      : 'Tambah Menu & Pajak'}
                  </span>
                  <div className="flex items-center gap-[5px]">
                    {items.map((it, idx) => (
                      <button
                        key={it.id}
                        type="button"
                        aria-label={`Lompat ke menu ${idx + 1}`}
                        onClick={() => scrollToMenuCard(idx)}
                        className={`h-[6px] rounded-full transition-all duration-300 ${
                          activeMenuIdx === idx ? 'w-[18px] bg-[#a6bb18]' : 'w-[6px] bg-[#dedede]'
                        }`}
                      />
                    ))}
                    <button
                      type="button"
                      aria-label="Lompat ke tambah menu & pajak"
                      onClick={() => scrollToMenuCard(items.length)}
                      className={`h-[6px] rounded-full transition-all duration-300 ${
                        activeMenuIdx >= items.length ? 'w-[18px] bg-[#a6bb18]' : 'w-[6px] bg-[#dedede]'
                      }`}
                    />
                  </div>
                </div>

                {/* Vertical Scroll-Snap Per-Menu Viewport with Top & Bottom White Blur Layers */}
                <div className="relative overflow-hidden rounded-[16px]">
                  {/* Top Soft White Blur Layer */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[28px] bg-gradient-to-b from-white via-white/85 to-transparent backdrop-blur-[1.5px]"
                  />

                  <div
                    ref={scrollContainerRef}
                    onScroll={handleMenuScroll}
                    className="flex h-[370px] snap-y snap-mandatory flex-col gap-[16px] overflow-y-auto py-[18px] scroll-smooth"
                  >
                    {items.map((item, idx) => (
                      <div
                        key={item.id}
                        ref={(el) => {
                          cardRefs.current[idx] = el
                        }}
                        className="flex min-h-[328px] w-full shrink-0 snap-center flex-col justify-between gap-[12px] rounded-[16px] border border-[#ececec] bg-white p-[14px] shadow-[0_6px_22px_rgba(5,65,49,0.05)]"
                      >
                        {/* Card Top Badge & Delete Action */}
                        <div className="flex items-center justify-between gap-[8px]">
                          <div className="flex items-center gap-[6px]">
                            <span className="rounded-[6px] bg-[#f2f3e6] px-[8px] py-[2px] font-['Outfit:Medium'] text-[11px] font-medium text-[#a6bb18]">
                              Menu #{idx + 1}
                            </span>
                            <span className="font-['Outfit:Regular'] text-[11px] text-[#8e8e8e]">
                              Geser ↕ untuk menu lain
                            </span>
                          </div>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => requestRemoveItem(item)}
                              className="flex items-center gap-[4px] rounded-[6px] px-[8px] py-[3px] font-['Outfit:Regular'] text-[12px] text-[#e5484d] transition hover:bg-[#fdf1f1]"
                            >
                              <span>Hapus</span>
                            </button>
                          )}
                        </div>

                        {/* Editable Menu Name & Price + Qty Stepper */}
                        <div className="flex flex-col gap-[10px]">
                          <label className="flex flex-col gap-[4px] font-['Outfit:Regular'] text-[11px] text-[#8e8e8e]">
                            Nama Menu Pesanan
                            <input
                              value={item.name}
                              onChange={(e) => updateItemName(item.id, e.target.value)}
                              placeholder="Nama menu"
                              className="w-full truncate rounded-[8px] border border-[#ececec] bg-[#fefef8] px-[10px] py-[8px] font-['Outfit:Medium'] text-[15px] font-medium text-[#054131] outline-none focus:border-[#a6bb18]"
                            />
                          </label>

                          <div className="flex items-end justify-between gap-[10px]">
                            <div className="flex flex-col gap-[4px]">
                              <span className="font-['Outfit:Regular'] text-[11px] text-[#8e8e8e]">Jumlah</span>
                              <div className="flex items-center gap-[8px] rounded-[8px] border border-[#ececec] bg-[#fefef8] px-[8px] py-[6px]">
                                <button
                                  type="button"
                                  aria-label={`Kurangi jumlah ${item.name}`}
                                  onClick={() => updateItemQty(item.id, -1)}
                                  className="px-[6px] font-['Outfit:SemiBold'] text-[15px] text-[#054131] hover:text-[#a6bb18]"
                                >
                                  −
                                </button>
                                <span className="font-['Outfit:Medium'] text-[13px] font-medium tabular-nums text-[#054131]">
                                  {item.qty}x
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Tambah jumlah ${item.name}`}
                                  onClick={() => updateItemQty(item.id, 1)}
                                  className="px-[6px] font-['Outfit:SemiBold'] text-[15px] text-[#054131] hover:text-[#a6bb18]"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <label className="flex min-w-0 flex-1 flex-col gap-[4px] font-['Outfit:Regular'] text-[11px] text-[#8e8e8e]">
                              Total Harga Menu (Rp)
                              <input
                                inputMode="numeric"
                                value={item.price || ''}
                                onChange={(e) => updateItemPrice(item.id, e.target.value)}
                                className="w-full rounded-[8px] border border-[#ececec] bg-[#fefef8] px-[10px] py-[7px] text-right font-['Outfit:SemiBold'] text-[16px] font-semibold tabular-nums text-[#054131] outline-none focus:border-[#a6bb18]"
                              />
                            </label>
                          </div>
                        </div>

                        <div className="relative h-0 w-full">
                          <div className="absolute inset-[-1px_0_0_0]">
                            <img alt="" className="block size-full max-w-none" src={HOME_IMAGES.dashedLine} />
                          </div>
                        </div>

                        {/* Friend Assignment per Item */}
                        <div className="flex flex-col gap-[8px]">
                          <div className="flex items-center justify-between">
                            <span className="font-['Outfit:Regular'] text-[12px] text-[#8e8e8e]">
                              Dibagi ke ({item.assignedParticipantIds.length} teman):
                            </span>
                            <button
                              type="button"
                              onClick={() => assignAllToItem(item.id)}
                              className="font-['Outfit:Medium'] text-[12px] font-medium text-[#a6bb18] hover:underline"
                            >
                              Pilih Semua Teman
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
                                  className={`flex max-w-[118px] items-center gap-[6px] rounded-[999px] border px-[10px] py-[5px] transition duration-150 active:scale-95 ${
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
                    ))}

                    {/* Final Scroll Page: Add Menu & Tax/Service */}
                    <div
                      ref={(el) => {
                        cardRefs.current[items.length] = el
                      }}
                      className="flex min-h-[328px] w-full shrink-0 snap-center flex-col justify-between gap-[12px] rounded-[16px] border border-dashed border-[#dedede] bg-[#fefef8] p-[14px]"
                    >
                      <form onSubmit={handleAddItem} className="flex flex-col gap-[10px]">
                        <p className="font-['Outfit:Medium'] text-[14px] font-medium text-[#054131]">
                          + Tambah Menu Lainnya
                        </p>
                        <div className="grid grid-cols-12 gap-[8px]">
                          <input
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="Nama menu (cth. Matcha Latte)"
                            className="col-span-12 rounded-[8px] border border-[#ececec] bg-white px-[10px] py-[8px] font-['Outfit:Regular'] text-[13px] text-[#054131] outline-none focus:border-[#a6bb18] sm:col-span-6"
                          />
                          <input
                            value={newItemQty}
                            onChange={(e) => setNewItemQty(e.target.value)}
                            inputMode="numeric"
                            placeholder="Qty"
                            className="col-span-4 rounded-[8px] border border-[#ececec] bg-white px-[10px] py-[8px] font-['Outfit:Regular'] text-[13px] text-[#054131] outline-none focus:border-[#a6bb18] sm:col-span-2"
                          />
                          <input
                            value={newItemPrice}
                            onChange={(e) => setNewItemPrice(e.target.value)}
                            inputMode="numeric"
                            placeholder="Harga satuan (Rp)"
                            className="col-span-8 rounded-[8px] border border-[#ececec] bg-white px-[10px] py-[8px] font-['Outfit:Regular'] text-[13px] text-[#054131] outline-none focus:border-[#a6bb18] sm:col-span-4"
                          />
                        </div>
                        <button
                          type="submit"
                          className="self-end rounded-[8px] bg-[#a6bb18] px-[14px] py-[7px] font-['Outfit:Medium'] text-[12px] font-medium text-white transition hover:bg-[#97ab12]"
                        >
                          + Tambah ke Daftar Menu
                        </button>
                      </form>

                      <div className="flex flex-col gap-[8px] border-t border-[#ececec] pt-[10px]">
                        <p className="font-['Outfit:Medium'] text-[13px] font-medium text-[#054131]">
                          Pajak & Biaya Layanan
                        </p>
                        <div className="grid grid-cols-2 gap-[10px]">
                          <label className="flex flex-col gap-[4px] font-['Outfit:Regular'] text-[11px] text-[#8e8e8e]">
                            Pajak / PPN (Rp)
                            <input
                              inputMode="numeric"
                              value={taxAmount || ''}
                              placeholder="0"
                              onChange={(e) => setTaxAmount(Number(e.target.value.replace(/\D/g, '')) || 0)}
                              className="rounded-[8px] border border-[#ececec] bg-white px-[10px] py-[7px] font-['Outfit:Regular'] text-[13px] text-[#054131] outline-none focus:border-[#a6bb18]"
                            />
                          </label>
                          <label className="flex flex-col gap-[4px] font-['Outfit:Regular'] text-[11px] text-[#8e8e8e]">
                            Service Charge (Rp)
                            <input
                              inputMode="numeric"
                              value={serviceAmount || ''}
                              placeholder="0"
                              onChange={(e) => setServiceAmount(Number(e.target.value.replace(/\D/g, '')) || 0)}
                              className="rounded-[8px] border border-[#ececec] bg-white px-[10px] py-[7px] font-['Outfit:Regular'] text-[13px] text-[#054131] outline-none focus:border-[#a6bb18]"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Soft White Blur Layer */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[32px] bg-gradient-to-t from-white via-white/85 to-transparent backdrop-blur-[1.5px]"
                  />
                </div>
              </div>
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
              <div className="grid grid-cols-2 gap-[8px]">
                {participantShares.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between gap-[8px] rounded-[8px] border border-[#ececec] bg-[#fefef8] px-[10px] py-[7px]"
                  >
                    <div className="flex min-w-0 items-center gap-[6px]">
                      <span className="relative block size-[22px] shrink-0">
                        <Img src={p.avatarUrl} skeleton="rounded-full" />
                      </span>
                      <span className="truncate font-['Outfit:Regular'] text-[13px] text-[#054131]">{p.name}</span>
                    </div>
                    <span className="shrink-0 font-['Outfit:Medium'] text-[13px] font-medium tabular-nums text-[#a6bb18]">
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
                onClick={requestCancelBack}
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

      <ConfirmModal
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        variant="danger"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </div>
  )
}
