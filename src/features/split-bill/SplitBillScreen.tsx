import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
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

  // Full-page view index:
  // Page 0 = Nama Tempat & Siapa Aja yang Ikut Patungan
  // Page 1..items.length = Menu 1..N (when splitMethod === 'per_item')
  // Last Page = Pajak, Tambah Menu & Ringkasan Pembagian
  const [activePageIdx, setActivePageIdx] = useState(0)
  const [menuListOpen, setMenuListOpen] = useState(false)
  const { mounted: menuListMounted, closing: menuListClosing } = usePresence(menuListOpen, 180)

  // Floating menu state on the right-side vertical ellipse rail
  const [floatRailExpanded, setFloatRailExpanded] = useState(false)
  const [activeFloatToastVisible, setActiveFloatToastVisible] = useState(true)
  const floatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const railRef = useRef<HTMLDivElement>(null)

  const menuPopoverRef = useRef<HTMLDivElement>(null)
  const pageScrollRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
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

  // Close expanded float rail when tapping outside
  useEffect(() => {
    if (!floatRailExpanded) return
    const onDown = (e: PointerEvent) => !railRef.current?.contains(e.target as Node) && setFloatRailExpanded(false)
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [floatRailExpanded])

  // Briefly reveal the active ellipse's floating badge whenever activePageIdx changes
  useEffect(() => {
    setActiveFloatToastVisible(true)
    if (floatTimerRef.current) clearTimeout(floatTimerRef.current)
    floatTimerRef.current = setTimeout(() => {
      setActiveFloatToastVisible(false)
    }, 1800)
    return () => {
      if (floatTimerRef.current) clearTimeout(floatTimerRef.current)
    }
  }, [activePageIdx])

  const pageMetaList = useMemo(() => {
    const list: { index: number; shortTitle: string; subtitle: string }[] = [
      {
        index: 0,
        shortTitle: 'Tempat & Teman',
        subtitle: `${selectedFriends.length} teman`,
      },
    ]
    if (splitMethod === 'per_item') {
      items.forEach((it, idx) => {
        list.push({
          index: idx + 1,
          shortTitle: it.name || `Menu ${idx + 1}`,
          subtitle: formatRupiah(it.price),
        })
      })
    }
    list.push({
      index: list.length,
      shortTitle: 'Ringkasan & Simpan',
      subtitle: formatRupiah(
        splitMethod === 'equal'
          ? Number(equalTotalInput.replace(/\D/g, '')) || 0
          : Math.max(0, items.reduce((a, b) => a + b.price, 0) + taxAmount + serviceAmount - discountAmount),
      ),
    })
    return list
  }, [selectedFriends.length, splitMethod, items, equalTotalInput, taxAmount, serviceAmount, discountAmount])

  const totalPages = pageMetaList.length

  const scrollToPage = (pageIdx: number) => {
    const clamped = Math.max(0, Math.min(totalPages - 1, pageIdx))
    setActivePageIdx(clamped)
    const target = pageRefs.current[clamped]
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleViewportScroll = () => {
    const container = pageScrollRef.current
    if (!container) return
    const pageH = container.clientHeight || window.innerHeight || 640
    const idx = Math.max(0, Math.min(totalPages - 1, Math.round(container.scrollTop / pageH)))
    if (idx !== activePageIdx) {
      setActivePageIdx(idx)
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

  // Standard Login-page consistent input & label classes
  const labelTextClass =
    "font-['Outfit:Regular'] text-[16px] leading-[normal] font-normal tracking-[-0.2px] text-[#054131]"
  const inputBoxClass =
    "w-full rounded-[12px] border border-[#ececec] bg-[#fefef8] px-[12px] py-[14px] font-['Outfit:Regular'] text-[14px] leading-[normal] tracking-[-0.2px] text-[#054131] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#8e8e8e] focus:border-[#a6bb18] focus:shadow-[0_0_0_3px_rgba(166,187,24,0.14)]"

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
        <img src={KLOOP_LOGO} alt="" className="w-[240px] max-w-[62vw] opacity-[0.06] md:w-[290px]" />
      </div>

      {/* Top Header with White Blur Layer */}
      <div className="relative z-30 shrink-0 bg-gradient-to-b from-white via-white/95 to-transparent px-[16px] pt-[20px] pb-[12px] backdrop-blur-[2px] md:pt-[28px]">
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
                className={`absolute top-[48px] right-0 z-40 flex w-[272px] origin-top-right flex-col gap-[8px] rounded-[16px] border border-[#ececec] bg-white p-[12px] shadow-[0_16px_38px_rgba(5,65,49,0.16)] ${
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

      {/* Main Full-View Paged Scroll Area */}
      <div className="relative flex-1 min-h-0 w-full">
        {/* Top Soft White Blur Layer over Scroll Viewport */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[28px] bg-gradient-to-b from-white via-white/80 to-transparent backdrop-blur-[1.5px]"
        />

        {/* Bottom Soft White Blur Layer over Scroll Viewport */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[36px] bg-gradient-to-t from-white via-white/85 to-transparent backdrop-blur-[1.5px]"
        />

        {/* Right-Side Vertical Ellipse Progress & Interactive Float Menu */}
        <div
          ref={railRef}
          onMouseEnter={() => setFloatRailExpanded(true)}
          onMouseLeave={() => setFloatRailExpanded(false)}
          className="absolute top-1/2 right-[8px] z-30 flex -translate-y-1/2 flex-col items-end gap-[10px] md:right-[16px]"
        >
          {pageMetaList.map((meta) => {
            const isActive = activePageIdx === meta.index
            const showFloatPill = floatRailExpanded || (isActive && activeFloatToastVisible)

            return (
              <div key={meta.index} className="relative flex items-center justify-end">
                {/* Animated Floating Menu Pill per Ellipse */}
                {showFloatPill && (
                  <button
                    type="button"
                    onClick={() => {
                      scrollToPage(meta.index)
                      setFloatRailExpanded((prev) => !prev)
                    }}
                    style={{ animationDelay: floatRailExpanded ? `${meta.index * 35}ms` : '0ms' }}
                    className={`mr-[8px] flex max-w-[176px] items-center gap-[6px] rounded-full border px-[10px] py-[5px] text-left shadow-[0_8px_20px_rgba(5,65,49,0.12)] backdrop-blur-md transition [animation:float-pill-in_220ms_cubic-bezier(0.2,0.8,0.2,1)_both] ${
                      isActive
                        ? 'border-[#a6bb18] bg-[#054131] text-white'
                        : 'border-[#ececec] bg-white/95 text-[#054131] hover:border-[#a6bb18]'
                    }`}
                  >
                    <span
                      className={`size-[6px] shrink-0 rounded-full ${
                        isActive ? 'bg-[#a6bb18]' : 'bg-[#dedede]'
                      }`}
                    />
                    <span className="truncate font-['Outfit:Medium'] text-[11px] font-medium">
                      {meta.shortTitle}
                    </span>
                  </button>
                )}

                {/* Vertical Ellipse Dot */}
                <button
                  type="button"
                  aria-label={meta.shortTitle}
                  aria-current={isActive ? 'step' : undefined}
                  onClick={() => {
                    if (isActive) {
                      setFloatRailExpanded((e) => !e)
                    } else {
                      scrollToPage(meta.index)
                      setFloatRailExpanded(true)
                    }
                  }}
                  className="group flex items-center justify-center p-[3px]"
                >
                  <span
                    className={`block rounded-full transition-all duration-300 ${
                      isActive
                        ? 'h-[24px] w-[8px] bg-[#a6bb18] shadow-[0_0_10px_rgba(166,187,24,0.45)]'
                        : 'h-[8px] w-[8px] bg-[#dedede] group-hover:bg-[#a6bb18]/60'
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>

        {/* Full-Page Scroll Container */}
        <div
          ref={pageScrollRef}
          onScroll={handleViewportScroll}
          className="snap-page-scroll relative z-10 h-full w-full snap-y snap-mandatory overflow-y-auto scroll-smooth"
        >
          {/* PAGE 0: Nama Tempat & Siapa Aja yang Ikut Patungan */}
          <section
            ref={(el) => {
              pageRefs.current[0] = el as HTMLDivElement | null
            }}
            className="flex h-full min-h-full w-full snap-center items-center justify-center px-[16px] pr-[28px] py-[16px]"
          >
            <div className="flex w-full max-w-[480px] flex-col gap-[20px] rounded-[20px] border border-[#ececec] bg-white/92 p-[20px] shadow-[0_12px_36px_rgba(5,65,49,0.06)] backdrop-blur-[3px]">
              <label className="flex w-full flex-col gap-[10px]">
                <span className={labelTextClass}>Nama Tempat / Tagihan</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masukkan nama tempat"
                  className={inputBoxClass}
                />
              </label>

              {/* Metode Pembagian */}
              <div className="flex w-full flex-col gap-[10px]">
                <span className={labelTextClass}>Metode Pembagian</span>
                <div
                  role="tablist"
                  aria-label="Metode pembagian tagihan"
                  className="grid grid-cols-2 gap-[8px] rounded-[12px] border border-[#ececec] bg-[#fefef8] p-[6px]"
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
                        className={`flex h-[40px] items-center justify-center rounded-[8px] px-[12px] font-['Outfit:Medium'] text-[14px] font-medium transition-colors duration-200 ${
                          active ? 'bg-[#a6bb18] text-white' : 'bg-transparent text-[#8e8e8e] hover:bg-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Siapa Aja yang Ikut Patungan Disini */}
              <div className="flex w-full flex-col gap-[10px]">
                <div className="flex items-center justify-between">
                  <span className={labelTextClass}>Teman Patungan ({selectedFriends.length})</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFriends([...availableFriends])}
                    className="font-['Outfit:Medium'] text-[14px] font-medium text-[#a6bb18] hover:underline"
                  >
                    Pilih Semua
                  </button>
                </div>
                <div
                  onScroll={onFriendChipScroll}
                  className={`flex flex-wrap gap-[8px] ${friendChipScrollClass}`}
                >
                  {availableFriends.map((friend) => {
                    const active = selectedFriends.includes(friend)
                    return (
                      <button
                        key={friend}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleFriendInBill(friend)}
                        className={`flex max-w-[132px] items-center gap-[6px] rounded-[999px] border px-[10px] py-[6px] transition duration-200 active:scale-95 ${
                          active
                            ? 'border-[#a6bb18] bg-[#f2f3e6] text-[#054131] ring-1 ring-[#a6bb18]'
                            : 'border-[#ececec] bg-white text-[#8e8e8e] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Icon src={CIRCLE_AVATARS[friend]} size={20} round />
                        <span className="truncate font-['Outfit:Regular'] text-[14px]">{friend}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* PAGES 1..N: 1 Menu = 1 Full Page View */}
          {splitMethod === 'per_item' &&
            items.map((item, idx) => {
              const pageIndex = idx + 1
              return (
                <section
                  key={item.id}
                  ref={(el) => {
                    pageRefs.current[pageIndex] = el as HTMLDivElement | null
                  }}
                  className="flex h-full min-h-full w-full snap-center items-center justify-center px-[16px] pr-[28px] py-[16px]"
                >
                  <div className="flex w-full max-w-[480px] flex-col gap-[18px] rounded-[20px] border border-[#ececec] bg-white/92 p-[20px] shadow-[0_12px_36px_rgba(5,65,49,0.06)] backdrop-blur-[3px]">
                    <div className="flex items-center justify-between gap-[8px]">
                      <span className="rounded-[8px] bg-[#f2f3e6] px-[10px] py-[4px] font-['Outfit:Medium'] text-[13px] font-medium text-[#a6bb18]">
                        Menu {idx + 1} / {items.length}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => requestRemoveItem(item)}
                          className="rounded-[8px] px-[8px] py-[4px] font-['Outfit:Regular'] text-[14px] text-[#e5484d] transition hover:bg-[#fdf1f1]"
                        >
                          Hapus
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-[16px]">
                      <label className="flex w-full flex-col gap-[10px]">
                        <span className={labelTextClass}>Nama Menu</span>
                        <input
                          value={item.name}
                          onChange={(e) => updateItemName(item.id, e.target.value)}
                          placeholder="Masukkan nama menu"
                          className={inputBoxClass}
                        />
                      </label>

                      <div className="grid grid-cols-12 gap-[12px]">
                        <div className="col-span-5 flex flex-col gap-[10px]">
                          <span className={labelTextClass}>Jumlah</span>
                          <div className="flex h-[48px] items-center justify-between rounded-[12px] border border-[#ececec] bg-[#fefef8] px-[10px]">
                            <button
                              type="button"
                              aria-label={`Kurangi jumlah ${item.name}`}
                              onClick={() => updateItemQty(item.id, -1)}
                              className="px-[6px] font-['Outfit:SemiBold'] text-[18px] text-[#054131] hover:text-[#a6bb18]"
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
                              className="px-[6px] font-['Outfit:SemiBold'] text-[18px] text-[#054131] hover:text-[#a6bb18]"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <label className="col-span-7 flex flex-col gap-[10px]">
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
                    <div className="flex flex-col gap-[10px]">
                      <div className="flex items-center justify-between">
                        <span className={labelTextClass}>
                          Dibagi ke ({item.assignedParticipantIds.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => assignAllToItem(item.id)}
                          className="font-['Outfit:Medium'] text-[14px] font-medium text-[#a6bb18] hover:underline"
                        >
                          Pilih Semua
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
                              className={`flex max-w-[132px] items-center gap-[6px] rounded-[999px] border px-[10px] py-[6px] transition duration-150 active:scale-95 ${
                                assigned
                                  ? 'border-[#a6bb18] bg-[#f2f3e6] text-[#054131] ring-1 ring-[#a6bb18]'
                                  : 'border-[#ececec] bg-white text-[#8e8e8e] opacity-65 hover:opacity-100'
                              }`}
                            >
                              <Icon src={CIRCLE_AVATARS[friend]} size={20} round />
                              <span className="truncate font-['Outfit:Regular'] text-[14px]">{friend}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              )
            })}

          {/* FINAL PAGE: Pajak, Tambah Menu Baru & Ringkasan Pembagian */}
          <section
            ref={(el) => {
              pageRefs.current[totalPages - 1] = el as HTMLDivElement | null
            }}
            className="flex h-full min-h-full w-full snap-center items-center justify-center px-[16px] pr-[28px] py-[16px]"
          >
            <div className="flex w-full max-w-[480px] flex-col gap-[16px] rounded-[20px] border border-[#ececec] bg-white/92 p-[20px] shadow-[0_12px_36px_rgba(5,65,49,0.06)] backdrop-blur-[3px]">
              {splitMethod === 'per_item' ? (
                <>
                  {/* Form Tambah Menu Baru */}
                  <form
                    onSubmit={handleAddItem}
                    className="flex flex-col gap-[10px] rounded-[12px] border border-dashed border-[#dedede] bg-[#fefef8] p-[12px]"
                  >
                    <span className={labelTextClass}>Tambah Menu Lainnya</span>
                    <div className="grid grid-cols-12 gap-[8px]">
                      <input
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Nama menu"
                        className="col-span-6 rounded-[12px] border border-[#ececec] bg-white px-[10px] py-[12px] font-['Outfit:Regular'] text-[14px] text-[#054131] outline-none focus:border-[#a6bb18]"
                      />
                      <input
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(e.target.value)}
                        inputMode="numeric"
                        placeholder="Qty"
                        className="col-span-2 rounded-[12px] border border-[#ececec] bg-white px-[8px] py-[12px] text-center font-['Outfit:Regular'] text-[14px] text-[#054131] outline-none focus:border-[#a6bb18]"
                      />
                      <input
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        inputMode="numeric"
                        placeholder="Harga"
                        className="col-span-4 rounded-[12px] border border-[#ececec] bg-white px-[10px] py-[12px] font-['Outfit:Regular'] text-[14px] text-[#054131] outline-none focus:border-[#a6bb18]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="self-end rounded-[10px] bg-[#f2f3e6] px-[14px] py-[8px] font-['Outfit:Medium'] text-[14px] font-medium text-[#a6bb18] transition hover:bg-[#e8ead2]"
                    >
                      + Tambah Menu
                    </button>
                  </form>

                  {/* Pajak & Service */}
                  <div className="grid grid-cols-2 gap-[12px]">
                    <label className="flex flex-col gap-[8px]">
                      <span className={labelTextClass}>Pajak / PPN</span>
                      <input
                        inputMode="numeric"
                        value={taxAmount || ''}
                        placeholder="0"
                        onChange={(e) => setTaxAmount(Number(e.target.value.replace(/\D/g, '')) || 0)}
                        className={inputBoxClass}
                      />
                    </label>
                    <label className="flex flex-col gap-[8px]">
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
                <label className="flex flex-col gap-[10px]">
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
              <div className="flex flex-col gap-[10px] border-t border-[#ececec] pt-[12px]">
                <div className="flex items-center justify-between">
                  <span className={labelTextClass}>Total Tagihan</span>
                  <span className="font-['Outfit:SemiBold'] text-[18px] font-semibold tabular-nums text-[#054131]">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
                <div className="grid max-h-[116px] grid-cols-2 gap-[8px] overflow-y-auto pr-[2px]">
                  {participantShares.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between gap-[6px] rounded-[10px] border border-[#ececec] bg-[#fefef8] px-[10px] py-[8px]"
                    >
                      <div className="flex min-w-0 items-center gap-[6px]">
                        <span className="relative block size-[20px] shrink-0">
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
