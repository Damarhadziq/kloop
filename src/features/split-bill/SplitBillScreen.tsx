import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { ScanResultSkeleton, useSimulatedLoading } from '@/components/skeletons'
import { ConfirmModal, Icon, Img, KLOOP_LOGO, PrimaryButton, usePresence, useScrollBarOnScroll } from '@/components/ui'
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
    () => [...Object.values(CIRCLE_AVATARS), ...Object.values(SCAN_ICONS), HOME_IMAGES.dashedLine, KLOOP_LOGO],
    [],
  )
  const { isLoading } = useSimulatedLoading(true, 650, splitScreenAssets)

  const defaultMethod: SplitMethod = jenis.id === 'flat' ? 'equal' : 'per_item'
  const [splitMethod, setSplitMethod] = useState<SplitMethod>(defaultMethod)
  const [title, setTitle] = useState(initialTitle || 'Kopi Nako Tembalang')

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

  // Active stacked card index:
  // 0 = Nama Tempat & Teman Patungan
  // 1..items.length = Menu 1..N (when splitMethod === 'per_item')
  // Last = Pajak, Tambah Menu & Ringkasan
  const [activePageIdx, setActivePageIdx] = useState(0)
  const [menuListOpen, setMenuListOpen] = useState(false)
  const { mounted: menuListMounted, closing: menuListClosing } = usePresence(menuListOpen, 180)

  // Hold-and-drag state for the right-side vertical ellipse rail
  const [isHoldingRail, setIsHoldingRail] = useState(false)
  const { mounted: floatMenuMounted, closing: floatMenuClosing } = usePresence(isHoldingRail, 180)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const dotRefs = useRef<(HTMLDivElement | null)[]>([])

  const menuPopoverRef = useRef<HTMLDivElement>(null)
  const pageScrollRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLElement | null)[]>([])
  const { onScroll: onFriendChipScroll, scrollClassName: friendChipScrollClass } = useScrollBarOnScroll()

  // Confirmation modal state for destructive actions
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

  // Close top-right popover on outside click
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

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    }
  }, [])

  const pageMetaList = useMemo(() => {
    const list: { index: number; shortTitle: string }[] = [
      {
        index: 0,
        shortTitle: 'Tempat & Teman',
      },
    ]
    if (splitMethod === 'per_item') {
      items.forEach((it, idx) => {
        list.push({
          index: idx + 1,
          shortTitle: it.name || `Menu ${idx + 1}`,
        })
      })
    }
    list.push({
      index: list.length,
      shortTitle: 'Ringkasan & Simpan',
    })
    return list
  }, [splitMethod, items])

  const totalPages = pageMetaList.length

  const scrollToPage = useCallback(
    (pageIdx: number, behavior: ScrollBehavior = 'smooth') => {
      const clamped = Math.max(0, Math.min(totalPages - 1, pageIdx))
      setActivePageIdx(clamped)
      const target = pageRefs.current[clamped]
      if (target) {
        target.scrollIntoView({ behavior, block: 'center' })
      }
    },
    [totalPages],
  )

  // Detect which stacked card is closest to the vertical center of the scroll viewport
  const handleViewportScroll = () => {
    if (isHoldingRail) return
    const container = pageScrollRef.current
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    const centerY = containerRect.top + containerRect.height / 2

    let bestIdx = activePageIdx
    let minDistance = Infinity
    for (let i = 0; i < totalPages; i++) {
      const el = pageRefs.current[i]
      if (!el) continue
      const rect = el.getBoundingClientRect()
      const cardCenterY = rect.top + rect.height / 2
      const dist = Math.abs(cardCenterY - centerY)
      if (dist < minDistance) {
        minDistance = dist
        bestIdx = i
      }
    }
    if (bestIdx !== activePageIdx) {
      setActivePageIdx(bestIdx)
    }
  }

  // Resolve which ellipse index the user's finger Y position is pointing at during hold-and-drag
  const resolveRailIndexAtClientY = useCallback(
    (clientY: number): number => {
      let closestIdx = activePageIdx
      let minDist = Infinity
      for (let i = 0; i < totalPages; i++) {
        const dotEl = dotRefs.current[i]
        if (!dotEl) continue
        const r = dotEl.getBoundingClientRect()
        const center = r.top + r.height / 2
        const d = Math.abs(clientY - center)
        if (d < minDist) {
          minDist = d
          closestIdx = i
        }
      }
      return closestIdx
    },
    [activePageIdx, totalPages],
  )

  const handleRailPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const clientY = e.clientY
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    // Open floating menu only when held (~140ms) or dragged
    holdTimerRef.current = setTimeout(() => {
      setIsHoldingRail(true)
      const targetIdx = resolveRailIndexAtClientY(clientY)
      scrollToPage(targetIdx, 'smooth')
    }, 140)
  }

  const handleRailPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    if (!isHoldingRail) {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current)
        holdTimerRef.current = null
      }
      setIsHoldingRail(true)
    }
    const targetIdx = resolveRailIndexAtClientY(e.clientY)
    if (targetIdx !== activePageIdx) {
      scrollToPage(targetIdx, 'smooth')
    }
  }

  const handleRailPointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setIsHoldingRail(false)
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
    const newMenuPageIdx = items.length + 1
    setItems((curr) => [...curr, newItem])
    setNewItemName('')
    setNewItemPrice('')
    setNewItemQty('1')
    notify(`Menu "${cleanName}" ditambahkan`)
    setTimeout(() => scrollToPage(newMenuPageIdx), 120)
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

  // Compact & consistent label/input classes matching Login page typography
  const labelTextClass =
    "font-['Outfit:Regular'] text-[15px] leading-[normal] font-normal tracking-[-0.2px] text-[#054131]"
  const inputBoxClass =
    "w-full rounded-[12px] border border-[#ececec] bg-[#fefef8] px-[12px] py-[12px] font-['Outfit:Regular'] text-[14px] leading-[normal] tracking-[-0.2px] text-[#054131] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#8e8e8e] focus:border-[#a6bb18] focus:shadow-[0_0_0_3px_rgba(166,187,24,0.14)]"

  // Computes the 3D scale/enter transition class for each card in the vertical stack
  const getCardStackClass = (cardIdx: number) => {
    const isActive = activePageIdx === cardIdx
    return `w-full max-w-[392px] rounded-[20px] border bg-white/95 p-[16px] backdrop-blur-[3px] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
      isActive
        ? 'z-10 scale-100 opacity-100 border-[#ececec] shadow-[0_14px_34px_rgba(5,65,49,0.08)]'
        : 'z-0 scale-[0.88] opacity-45 border-[#ececec]/80 shadow-none'
    }`
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh w-full bg-white text-[#054131]">
        <div className="mx-auto flex w-full max-w-[560px] flex-col gap-[20px] px-[16px] pt-[24px] pb-[40px] md:pt-[32px]">
          <ScanResultSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-white text-[#054131]">
      {/* Faded Kloop Logo Watermark in Center Background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center select-none"
      >
        <img src={KLOOP_LOGO} alt="" className="w-[230px] max-w-[58vw] opacity-[0.06] md:w-[280px]" />
      </div>

      {/* Top Header */}
      <div className="relative z-30 shrink-0 bg-white px-[16px] pt-[20px] pb-[8px] md:pt-[28px]">
        <header className="mx-auto flex w-full max-w-[520px] items-center justify-between gap-[10px]">
          <ScanRoundButton label="Kembali" icon={SCAN_ICONS.back} onClick={requestCancelBack} />

          <h1 className="font-['Outfit:Medium'] text-[18px] leading-[normal] font-medium tracking-[-0.2px] text-[#054131]">
            Atur Pembagian
          </h1>

          {/* Top-Right Icon-Only Button with Circular Menu Count Badge */}
          <div ref={menuPopoverRef} className="relative shrink-0">
            <button
              type="button"
              aria-label="Daftar menu pesanan"
              aria-expanded={menuListOpen}
              onClick={() => setMenuListOpen((o) => !o)}
              className={`relative flex size-[40px] items-center justify-center rounded-full transition active:scale-95 ${
                menuListOpen
                  ? 'bg-[#a6bb18]/25 ring-2 ring-[#a6bb18]'
                  : 'bg-[#f8f8ec] hover:bg-[#eef0d6]'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[#054131]">
                <path
                  d="M9 6H20M9 12H20M9 18H20M4.5 6H4.51M4.5 12H4.51M4.5 18H4.51"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="absolute -top-[3px] -right-[3px] flex size-[19px] items-center justify-center rounded-full bg-[#a6bb18] font-['Outfit:SemiBold'] text-[11px] font-semibold text-white ring-2 ring-white tabular-nums">
                {items.length}
              </span>
            </button>

            {menuListMounted && (
              <div
                role="dialog"
                aria-label="Daftar menu"
                className={`absolute top-[48px] right-0 z-40 flex w-[268px] origin-top-right flex-col gap-[8px] rounded-[16px] border border-[#ececec] bg-white p-[12px] shadow-[0_16px_38px_rgba(5,65,49,0.16)] ${
                  menuListClosing
                    ? '[animation:menu-out_180ms_ease-in_forwards]'
                    : '[animation:menu-in_220ms_cubic-bezier(0.2,0.8,0.2,1)]'
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#ececec] pb-[8px]">
                  <span className="font-['Outfit:Medium'] text-[14px] font-medium text-[#054131]">
                    Daftar Menu ({items.length})
                  </span>
                  <span className="font-['Outfit:SemiBold'] text-[13px] font-semibold tabular-nums text-[#a6bb18]">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>

                <div className="flex max-h-[240px] flex-col gap-[6px] overflow-y-auto pr-[2px]">
                  {items.map((it, idx) => {
                    const pageNumber = idx + 1
                    const isCurrent = activePageIdx === pageNumber && splitMethod === 'per_item'
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => {
                          setSplitMethod('per_item')
                          setTimeout(() => scrollToPage(pageNumber), 40)
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
                            {idx + 1}. {it.name || 'Menu'}
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
                    scrollToPage(totalPages - 1)
                    setMenuListOpen(false)
                  }}
                  className="mt-[2px] flex w-full items-center justify-center rounded-[10px] bg-[#f2f3e6] py-[9px] font-['Outfit:Medium'] text-[13px] font-medium text-[#a6bb18] transition hover:bg-[#e8ead2]"
                >
                  Ringkasan & Pajak
                </button>
              </div>
            )}
          </div>
        </header>
      </div>

      {/* Main Stacked Carousel Viewport */}
      <div className="relative flex-1 min-h-0 w-full">
        {/* Top White Blur Layer covering the peeking previous card */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[76px] bg-gradient-to-b from-white via-white/85 to-transparent backdrop-blur-[2px]"
        />

        {/* Bottom White Blur Layer covering the peeking next card */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[76px] bg-gradient-to-t from-white via-white/85 to-transparent backdrop-blur-[2px]"
        />

        {/* Right-Side Hold-to-Scrub Vertical Ellipse Rail */}
        <div
          ref={railRef}
          onPointerDown={handleRailPointerDown}
          onPointerMove={handleRailPointerMove}
          onPointerUp={handleRailPointerEnd}
          onPointerCancel={handleRailPointerEnd}
          className=" absolute top-1/2 right-[6px] z-30 flex -translate-y-1/2 touch-none select-none flex-col items-end gap-[8px] py-[14px] pl-[12px] pr-[4px] md:right-[16px]"
        >
          {pageMetaList.map((meta) => {
            const isActive = activePageIdx === meta.index
            const distance = Math.abs(activePageIdx - meta.index)

            // Magnetic wave offset while finger is holding and scrubbing along the rail
            const waveTransform = isActive
              ? '-translate-x-[12px] scale-[1.06]'
              : distance === 1
                ? '-translate-x-[5px] scale-[1.01]'
                : 'translate-x-0 scale-95 opacity-80'

            return (
              <div
                key={meta.index}
                ref={(el) => {
                  dotRefs.current[meta.index] = el
                }}
                className="relative flex h-[22px] items-center justify-end"
              >
                {/* Floating Pill without inner ellipse — appears ONLY while holding & dragging */}
                {floatMenuMounted && (
                  <div
                    style={{ animationDelay: `${meta.index * 28}ms` }}
                    className={`pointer-events-none mr-[10px] flex max-w-[180px] items-center rounded-full border px-[12px] py-[5px] shadow-[0_8px_22px_rgba(5,65,49,0.14)] backdrop-blur-md transition-all duration-200 ease-out ${waveTransform} ${
                      floatMenuClosing
                        ? '[animation:float-pill-out_160ms_ease-in_forwards]'
                        : '[animation:float-pill-in_240ms_cubic-bezier(0.34,1.56,0.64,1)_both]'
                    } ${
                      isActive
                        ? 'border-[#a6bb18] bg-[#054131] text-white'
                        : 'border-[#ececec] bg-white/95 text-[#054131]'
                    }`}
                  >
                    <span className="truncate font-['Outfit:Medium'] text-[12px] font-medium">
                      {meta.shortTitle}
                    </span>
                  </div>
                )}

                {/* Right-Side Progress Ellipse */}
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    isActive
                      ? 'h-[22px] w-[7px] bg-[#a6bb18] shadow-[0_0_8px_rgba(166,187,24,0.45)]'
                      : 'h-[7px] w-[7px] bg-[#dedede]'
                  }`}
                />
              </div>
            )
          })}
        </div>

        {/* Stacked Vertical Scroll Container (previous & next cards peek above/below under white blur) */}
        <div
          ref={pageScrollRef}
          onScroll={handleViewportScroll}
          className="snap-page-scroll relative z-10 flex h-full w-full snap-y snap-mandatory flex-col items-center gap-[14px] overflow-y-auto px-[16px] pr-[28px] py-[17vh] scroll-smooth"
        >
          {/* CARD 0: Nama Tempat, Metode Pembagian, & Teman Patungan */}
          <section
            ref={(el) => {
              pageRefs.current[0] = el
            }}
            onClick={() => activePageIdx !== 0 && scrollToPage(0)}
            className="flex w-full shrink-0 snap-center justify-center"
          >
            <div className={`flex flex-col gap-[16px] ${getCardStackClass(0)}`}>
              <label className="flex w-full flex-col gap-[8px]">
                <span className={labelTextClass}>Nama Tempat / Tagihan</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masukkan nama tempat"
                  className={inputBoxClass}
                />
              </label>

              {/* Metode Pembagian (No outer frame, slimmer height, with icons) */}
              <div className="flex w-full flex-col gap-[8px]">
                <span className={labelTextClass}>Metode Pembagian</span>
                <div
                  role="tablist"
                  aria-label="Metode pembagian tagihan"
                  className="grid grid-cols-2 gap-[10px]"
                >
                  {(
                    [
                      {
                        key: 'per_item',
                        label: 'Per Menu',
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path
                              d="M19.5 3.5V20.5L17 19L14.5 20.5L12 19L9.5 20.5L7 19L4.5 20.5V3.5C4.5 2.67157 5.17157 2 6 2H18C18.8284 2 19.5 2.67157 19.5 3.5Z"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M8.5 8H15.5M8.5 12H15.5M8.5 16H12.5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        ),
                      },
                      {
                        key: 'equal',
                        label: 'Bagi Rata',
                        icon: (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                            <circle cx="16.5" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                            <path
                              d="M3.5 19.5C3.5 16.4624 5.96243 14 9 14C12.0376 14 14.5 16.4624 14.5 19.5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M14.5 14.5C15.1 14.18 15.78 14 16.5 14C18.9853 14 21 16.0147 21 18.5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        ),
                      },
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
                        className={`flex items-center justify-center gap-[7px] rounded-[10px] border py-[8px] px-[12px] font-['Outfit:Medium'] text-[13px] font-medium transition duration-200 active:scale-[0.98] ${
                          active
                            ? 'border-[#a6bb18] bg-[#a6bb18] text-white'
                            : 'border-[#ececec] bg-[#fefef8] text-[#8e8e8e] hover:border-[#a6bb18] hover:text-[#054131]'
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Teman Patungan */}
              <div className="flex w-full flex-col gap-[8px]">
                <div className="flex items-center justify-between">
                  <span className={labelTextClass}>Teman Patungan ({selectedFriends.length})</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFriends([...availableFriends])}
                    className="font-['Outfit:Medium'] text-[13px] font-medium text-[#a6bb18] hover:underline"
                  >
                    Pilih Semua
                  </button>
                </div>
                <div
                  onScroll={onFriendChipScroll}
                  className={`flex flex-wrap gap-[7px] ${friendChipScrollClass}`}
                >
                  {availableFriends.map((friend) => {
                    const active = selectedFriends.includes(friend)
                    return (
                      <button
                        key={friend}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleFriendInBill(friend)}
                        className={`flex max-w-[120px] items-center gap-[5px] rounded-[999px] border px-[9px] py-[5px] transition duration-200 active:scale-95 ${
                          active
                            ? 'border-[#a6bb18] bg-[#f2f3e6] text-[#054131] ring-1 ring-[#a6bb18]'
                            : 'border-[#ececec] bg-white text-[#8e8e8e] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Icon src={CIRCLE_AVATARS[friend]} size={18} round />
                        <span className="truncate font-['Outfit:Regular'] text-[13px]">{friend}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* CARDS 1..N: Menu Items */}
          {splitMethod === 'per_item' &&
            items.map((item, idx) => {
              const pageIndex = idx + 1
              return (
                <section
                  key={item.id}
                  ref={(el) => {
                    pageRefs.current[pageIndex] = el
                  }}
                  onClick={() => activePageIdx !== pageIndex && scrollToPage(pageIndex)}
                  className="flex w-full shrink-0 snap-center justify-center"
                >
                  <div className={`flex flex-col gap-[14px] ${getCardStackClass(pageIndex)}`}>
                    {/* Menu Index without background frame + Icon-only Delete button */}
                    <div className="flex items-center justify-between gap-[8px]">
                      <span className="font-['Outfit:Medium'] text-[13px] font-medium text-[#a6bb18]">
                        Menu {idx + 1} / {items.length}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          aria-label={`Hapus ${item.name}`}
                          onClick={() => requestRemoveItem(item)}
                          className="flex size-[30px] items-center justify-center rounded-full text-[#e5484d] transition hover:bg-[#fdf1f1] active:scale-95"
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path
                              d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M9.5 16.5V10.5M14.5 16.5V10.5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-[12px]">
                      <label className="flex w-full flex-col gap-[8px]">
                        <span className={labelTextClass}>Nama Menu</span>
                        <input
                          value={item.name}
                          onChange={(e) => updateItemName(item.id, e.target.value)}
                          placeholder="Masukkan nama menu"
                          className={inputBoxClass}
                        />
                      </label>

                      <div className="grid grid-cols-12 gap-[10px]">
                        <div className="col-span-5 flex flex-col gap-[8px]">
                          <span className={labelTextClass}>Jumlah</span>
                          <div className="flex h-[44px] items-center justify-between rounded-[12px] border border-[#ececec] bg-[#fefef8] px-[10px]">
                            <button
                              type="button"
                              aria-label={`Kurangi jumlah ${item.name}`}
                              onClick={() => updateItemQty(item.id, -1)}
                              className="px-[5px] font-['Outfit:SemiBold'] text-[17px] text-[#054131] hover:text-[#a6bb18]"
                            >
                              −
                            </button>
                            <span className="font-['Outfit:Medium'] text-[14px] font-medium tabular-nums text-[#054131]">
                              {item.qty}x
                            </span>
                            <button
                              type="button"
                              aria-label={`Tambah jumlah ${item.name}`}
                              onClick={() => updateItemQty(item.id, 1)}
                              className="px-[5px] font-['Outfit:SemiBold'] text-[17px] text-[#054131] hover:text-[#a6bb18]"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <label className="col-span-7 flex flex-col gap-[8px]">
                          <span className={labelTextClass}>Harga (Rp)</span>
                          <input
                            inputMode="numeric"
                            value={item.price || ''}
                            onChange={(e) => updateItemPrice(item.id, e.target.value)}
                            placeholder="0"
                            className={`${inputBoxClass} text-right font-['Outfit:Medium'] tabular-nums`}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="relative h-0 w-full">
                      <div className="absolute inset-[-1px_0_0_0]">
                        <img alt="" className="block size-full max-w-none" src={HOME_IMAGES.dashedLine} />
                      </div>
                    </div>

                    {/* Pilih Avatar Teman untuk Menu Ini */}
                    <div className="flex flex-col gap-[8px]">
                      <div className="flex items-center justify-between">
                        <span className={labelTextClass}>
                          Dibagi ke ({item.assignedParticipantIds.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => assignAllToItem(item.id)}
                          className="font-['Outfit:Medium'] text-[13px] font-medium text-[#a6bb18] hover:underline"
                        >
                          Pilih Semua
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-[7px]">
                        {selectedFriends.map((friend) => {
                          const assigned = item.assignedParticipantIds.includes(friend)
                          return (
                            <button
                              key={friend}
                              type="button"
                              aria-pressed={assigned}
                              onClick={() => toggleFriendOnItem(item.id, friend)}
                              className={`flex max-w-[120px] items-center gap-[5px] rounded-[999px] border px-[9px] py-[5px] transition duration-150 active:scale-95 ${
                                assigned
                                  ? 'border-[#a6bb18] bg-[#f2f3e6] text-[#054131] ring-1 ring-[#a6bb18]'
                                  : 'border-[#ececec] bg-white text-[#8e8e8e] opacity-65 hover:opacity-100'
                              }`}
                            >
                              <Icon src={CIRCLE_AVATARS[friend]} size={18} round />
                              <span className="truncate font-['Outfit:Regular'] text-[13px]">{friend}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              )
            })}

          {/* FINAL CARD: Pajak, Tambah Menu Baru & Ringkasan Pembagian */}
          <section
            ref={(el) => {
              pageRefs.current[totalPages - 1] = el
            }}
            onClick={() => activePageIdx !== totalPages - 1 && scrollToPage(totalPages - 1)}
            className="flex w-full shrink-0 snap-center justify-center"
          >
            <div className={`flex flex-col gap-[14px] ${getCardStackClass(totalPages - 1)}`}>
              {splitMethod === 'per_item' ? (
                <>
                  {/* Form Tambah Menu Baru */}
                  <form
                    onSubmit={handleAddItem}
                    className="flex flex-col gap-[8px] rounded-[12px] border border-dashed border-[#dedede] bg-[#fefef8] p-[10px]"
                  >
                    <span className={labelTextClass}>Tambah Menu Lainnya</span>
                    <div className="grid grid-cols-12 gap-[6px]">
                      <input
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Nama menu"
                        className="col-span-6 rounded-[10px] border border-[#ececec] bg-white px-[10px] py-[10px] font-['Outfit:Regular'] text-[13px] text-[#054131] outline-none focus:border-[#a6bb18]"
                      />
                      <input
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(e.target.value)}
                        inputMode="numeric"
                        placeholder="Qty"
                        className="col-span-2 rounded-[10px] border border-[#ececec] bg-white px-[6px] py-[10px] text-center font-['Outfit:Regular'] text-[13px] text-[#054131] outline-none focus:border-[#a6bb18]"
                      />
                      <input
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        inputMode="numeric"
                        placeholder="Harga"
                        className="col-span-4 rounded-[10px] border border-[#ececec] bg-white px-[10px] py-[10px] font-['Outfit:Regular'] text-[13px] text-[#054131] outline-none focus:border-[#a6bb18]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="self-end rounded-[8px] bg-[#f2f3e6] px-[12px] py-[6px] font-['Outfit:Medium'] text-[13px] font-medium text-[#a6bb18] transition hover:bg-[#e8ead2]"
                    >
                      + Tambah Menu
                    </button>
                  </form>

                  {/* Pajak & Service */}
                  <div className="grid grid-cols-2 gap-[10px]">
                    <label className="flex flex-col gap-[6px]">
                      <span className={labelTextClass}>Pajak / PPN</span>
                      <input
                        inputMode="numeric"
                        value={taxAmount || ''}
                        placeholder="0"
                        onChange={(e) => setTaxAmount(Number(e.target.value.replace(/\D/g, '')) || 0)}
                        className={inputBoxClass}
                      />
                    </label>
                    <label className="flex flex-col gap-[6px]">
                      <span className={labelTextClass}>Service Charge</span>
                      <input
                        inputMode="numeric"
                        value={serviceAmount || ''}
                        placeholder="0"
                        onChange={(e) => setServiceAmount(Number(e.target.value.replace(/\D/g, '')) || 0)}
                        className={inputBoxClass}
                      />
                    </label>
                  </div>
                </>
              ) : (
                <label className="flex flex-col gap-[8px]">
                  <span className={labelTextClass}>Total Tagihan Bersama (Rp)</span>
                  <input
                    inputMode="numeric"
                    value={equalTotalInput}
                    onChange={(e) => setEqualTotalInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="185000"
                    className={inputBoxClass}
                  />
                </label>
              )}

              {/* Ringkasan per Teman */}
              <div className="flex flex-col gap-[8px] border-t border-[#ececec] pt-[10px]">
                <div className="flex items-center justify-between">
                  <span className={labelTextClass}>Total Tagihan</span>
                  <span className="font-['Outfit:SemiBold'] text-[17px] font-semibold tabular-nums text-[#054131]">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
                <div className="grid max-h-[104px] grid-cols-2 gap-[6px] overflow-y-auto pr-[2px]">
                  {participantShares.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between gap-[6px] rounded-[10px] border border-[#ececec] bg-[#fefef8] px-[9px] py-[6px]"
                    >
                      <div className="flex min-w-0 items-center gap-[6px]">
                        <span className="relative block size-[18px] shrink-0">
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

              <PrimaryButton type="button" onClick={handleFinish}>
                Simpan & Lihat Rincian
              </PrimaryButton>
            </div>
          </section>
        </div>
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
