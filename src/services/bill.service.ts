import type {
  Bill,
  BillItem,
  BillParticipant,
  JenisOption,
  PaymentStatus,
  SplitMethod,
  TalanganSummary,
  UserProfile,
} from '@/types'

const a = (f: string) => `/assets/${f}`
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export const formatRupiah = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`

export const HOME_IMAGES = {
  profile: a('99968.svg'),
  billList: a('fabc8.svg'),
  cashOut: a('3c9ae.svg'),
  bell: a('5b4e9.svg'),
  illustration: a('470ea.svg'),
  docAdd: a('cd915.svg'),
  scan: a('5bfbd.svg'),
  chefHat: a('6400b.svg'),
  dashedLine: a('968ba.svg'),
  verified: a('41abe.svg'),
  bellSmall: a('5a751.svg'),
  usersGroup: a('a81da.svg'),
  stack: [a('42990.png'), a('e083e.png'), a('016c5.png'), a('f1afc.png')],
} as const

export const CIRCLE_AVATARS = {
  Anya: a('5828b.svg'),
  Jules: a('050f8.svg'),
  Mira: a('2172f.svg'),
  Nico: a('79c9b.svg'),
  Sven: a('03948.svg'),
  Lars: a('f4918.svg'),
  Ines: a('df415.svg'),
  Rolf: a('e48f9.svg'),
  Greta: a('4be25.svg'),
} as const

export type CircleName = keyof typeof CIRCLE_AVATARS

export const JENIS_OPTIONS: readonly JenisOption[] = [
  { id: 'resto', title: 'Resto & Kafe', desc: 'Hitung per menu pesanan dan pajak/service.', icon: a('18af0.svg') },
  { id: 'jajan', title: 'Jajanan & Kaki Lima', desc: 'Catat cepat pengeluaran jajan tanpa rincian menu.', icon: a('687d1.svg') },
  { id: 'flat', title: 'Bagi Rata (Flat)', desc: 'Satu total langsung dibagi rata ke teman terpilih.', icon: a('c0e45.svg') },
] as const

export const SCAN_ICONS = {
  close: a('8423a.svg'),
  back: a('5ceb4.svg'),
  flashlight: a('72e1b.svg'),
  gallery: a('140e3.svg'),
} as const

export const SCAN_ASSETS = [...Object.values(SCAN_ICONS), ...JENIS_OPTIONS.map((j) => j.icon)]

export const INITIAL_CIRCLE_FRIENDS: UserProfile[] = (Object.keys(CIRCLE_AVATARS) as CircleName[]).map((name, idx) => ({
  id: `u-circle-${idx + 1}`,
  username: name.toLowerCase(),
  fullName: name,
  avatarUrl: CIRCLE_AVATARS[name],
  bankName: 'BCA',
  bankAccountNo: `7100 2394 0${idx + 1}`,
}))

export const INITIAL_TALANGAN: TalanganSummary = {
  masuk: { count: 4, amount: 345000, note: 'Dari 4 teman di 2 sesi bill' },
  tagihan: { count: 3, amount: 65000, note: '1 tagihan belum kamu bayar' },
}

function makeParticipant(
  billId: string,
  index: number,
  name: string,
  avatarUrl: string,
  paid: boolean,
  totalOwed: number,
): BillParticipant {
  return {
    id: `${billId}-p${index + 1}`,
    billId,
    userId: `u-${name.toLowerCase()}`,
    name,
    avatarUrl,
    totalOwed,
    paymentStatus: paid ? 'settled' : 'unpaid',
    paid,
  }
}

export const INITIAL_BILLS: Bill[] = [
  {
    id: 'b1',
    creatorId: 'u-self',
    category: 'Resto & Kafe',
    time: 'Hari ini, 13:40',
    createdAt: '2026-11-04T13:40:00+07:00',
    title: 'Kopi Nako Tembalang',
    totalAmount: 185000,
    total: 185000,
    taxAmount: 15000,
    serviceAmount: 5000,
    discountAmount: 0,
    status: 'active',
    splitMethod: 'per_item',
    participants: [
      makeParticipant('b1', 0, 'Sofia', a('e75cb.svg'), true, 37000),
      makeParticipant('b1', 1, 'Luca', a('f0377.svg'), true, 37000),
      makeParticipant('b1', 2, 'Elena', a('b0c11.svg'), true, 37000),
      makeParticipant('b1', 3, 'Mateo', a('e85ce.svg'), false, 37000),
      makeParticipant('b1', 4, 'Isolde', a('0b9a3.svg'), false, 37000),
    ],
    items: [
      {
        id: 'b1-i1',
        billId: 'b1',
        name: 'Es Kopi Nusantara (3x)',
        qty: 3,
        price: 69000,
        assignedParticipantIds: ['b1-p1', 'b1-p2', 'b1-p3'],
      },
      {
        id: 'b1-i2',
        billId: 'b1',
        name: 'Matcha Latte Oat (2x)',
        qty: 2,
        price: 56000,
        assignedParticipantIds: ['b1-p4', 'b1-p5'],
      },
      {
        id: 'b1-i3',
        billId: 'b1',
        name: 'Platter Cireng & Kentang',
        qty: 1,
        price: 40000,
        assignedParticipantIds: ['b1-p1', 'b1-p2', 'b1-p3', 'b1-p4', 'b1-p5'],
      },
    ],
  },
  {
    id: 'b2',
    creatorId: 'u-self',
    category: 'Resto & Kafe',
    time: 'Kemarin, 19:12',
    createdAt: '2026-11-03T19:12:00+07:00',
    title: 'Mie Gacoan Banyumanik',
    totalAmount: 152000,
    total: 152000,
    taxAmount: 12000,
    serviceAmount: 0,
    discountAmount: 0,
    status: 'active',
    splitMethod: 'per_item',
    participants: [
      makeParticipant('b2', 0, 'Anya', CIRCLE_AVATARS.Anya, true, 52000),
      makeParticipant('b2', 1, 'Jules', CIRCLE_AVATARS.Jules, false, 50000),
      makeParticipant('b2', 2, 'Mira', CIRCLE_AVATARS.Mira, false, 50000),
    ],
    items: [
      {
        id: 'b2-i1',
        billId: 'b2',
        name: 'Mie Gacoan Lv 2 (3x)',
        qty: 3,
        price: 45000,
        assignedParticipantIds: ['b2-p1', 'b2-p2', 'b2-p3'],
      },
      {
        id: 'b2-i2',
        billId: 'b2',
        name: 'Udang Keju & Siomay (3x)',
        qty: 3,
        price: 48000,
        assignedParticipantIds: ['b2-p1', 'b2-p2', 'b2-p3'],
      },
      {
        id: 'b2-i3',
        billId: 'b2',
        name: 'Es Gobak Sodor (3x)',
        qty: 3,
        price: 47000,
        assignedParticipantIds: ['b2-p1', 'b2-p2', 'b2-p3'],
      },
    ],
  },
  {
    id: 'b3',
    creatorId: 'u-self',
    category: 'Resto & Kafe',
    time: 'Sab, 12:05',
    createdAt: '2026-10-31T12:05:00+07:00',
    title: 'Sate Pak Kumis',
    totalAmount: 96000,
    total: 96000,
    taxAmount: 0,
    serviceAmount: 0,
    discountAmount: 0,
    status: 'active',
    splitMethod: 'equal',
    participants: [
      makeParticipant('b3', 0, 'Nico', CIRCLE_AVATARS.Nico, true, 48000),
      makeParticipant('b3', 1, 'Sven', CIRCLE_AVATARS.Sven, false, 48000),
    ],
    items: [
      {
        id: 'b3-i1',
        billId: 'b3',
        name: 'Sate Ayam Campur 20 Tusuk',
        qty: 2,
        price: 76000,
        assignedParticipantIds: ['b3-p1', 'b3-p2'],
      },
      {
        id: 'b3-i2',
        billId: 'b3',
        name: 'Lontong & Es Teh Manis',
        qty: 2,
        price: 20000,
        assignedParticipantIds: ['b3-p1', 'b3-p2'],
      },
    ],
  },
  {
    id: 'b4',
    creatorId: 'u-self',
    category: 'Resto & Kafe',
    time: 'Jum, 20:30',
    createdAt: '2026-10-30T20:30:00+07:00',
    title: 'Warung Bu Rini',
    totalAmount: 74000,
    total: 74000,
    taxAmount: 0,
    serviceAmount: 0,
    discountAmount: 0,
    status: 'settled',
    splitMethod: 'equal',
    participants: [
      makeParticipant('b4', 0, 'Lars', CIRCLE_AVATARS.Lars, true, 37000),
      makeParticipant('b4', 1, 'Ines', CIRCLE_AVATARS.Ines, true, 37000),
    ],
    items: [
      {
        id: 'b4-i1',
        billId: 'b4',
        name: 'Ayam Bakar Madu + Nasi (2x)',
        qty: 2,
        price: 58000,
        assignedParticipantIds: ['b4-p1', 'b4-p2'],
      },
      {
        id: 'b4-i2',
        billId: 'b4',
        name: 'Es Jeruk Peras (2x)',
        qty: 2,
        price: 16000,
        assignedParticipantIds: ['b4-p1', 'b4-p2'],
      },
    ],
  },
]

export const HOME_ASSETS = [
  ...Object.values(HOME_IMAGES).flat(),
  ...Object.values(CIRCLE_AVATARS),
  ...INITIAL_BILLS.flatMap((b) => b.participants.map((p) => p.avatarUrl)),
]

export async function getActiveBills(delayMs = 750): Promise<Bill[]> {
  await wait(delayMs)
  return INITIAL_BILLS
}

export async function getCircleFriends(delayMs = 750): Promise<UserProfile[]> {
  await wait(delayMs)
  return INITIAL_CIRCLE_FRIENDS
}

export async function getTalanganSummary(delayMs = 750): Promise<TalanganSummary> {
  await wait(delayMs)
  return INITIAL_TALANGAN
}

export interface ScannedReceiptDraft {
  title: string
  category: string
  items: BillItem[]
  taxAmount: number
  serviceAmount: number
  discountAmount: number
}

export async function parseScannedReceipt(
  category: string,
  participantIds: string[],
  delayMs = 800,
): Promise<ScannedReceiptDraft> {
  await wait(delayMs)
  const billId = 'draft-scan'
  return {
    title: 'Struk hasil scan',
    category,
    taxAmount: 11500,
    serviceAmount: 4000,
    discountAmount: 0,
    items: [
      {
        id: 'scan-item-1',
        billId,
        name: 'Iced Caramel Macchiato',
        qty: 1,
        price: 38000,
        assignedParticipantIds: participantIds.slice(0, 1),
      },
      {
        id: 'scan-item-2',
        billId,
        name: 'Nasi Goreng Kampung Spesial',
        qty: 1,
        price: 45000,
        assignedParticipantIds: participantIds.slice(1, 2).length ? participantIds.slice(1, 2) : participantIds.slice(0, 1),
      },
      {
        id: 'scan-item-3',
        billId,
        name: 'French Fries Truffle',
        qty: 1,
        price: 30000,
        assignedParticipantIds: [...participantIds],
      },
    ],
  }
}

export interface CreateBillInput {
  title: string
  category: string
  totalAmount: number
  taxAmount?: number
  serviceAmount?: number
  discountAmount?: number
  splitMethod?: SplitMethod
  participants: {
    name: string
    avatarUrl: string
    totalOwed?: number
    paid?: boolean
  }[]
  items?: BillItem[]
}

export async function createBill(input: CreateBillInput, delayMs = 450): Promise<Bill> {
  await wait(delayMs)
  const now = new Date()
  const billId = `b-${now.getTime()}`
  const timeStr = `Hari ini, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')}`
  const count = Math.max(1, input.participants.length)
  const equalShare = Math.round(input.totalAmount / count)

  const participants: BillParticipant[] = input.participants.map((p, idx) => {
    const paid = p.paid ?? false
    return {
      id: `${billId}-p${idx + 1}`,
      billId,
      userId: `u-${p.name.toLowerCase()}`,
      name: p.name,
      avatarUrl: p.avatarUrl,
      totalOwed: p.totalOwed ?? equalShare,
      paymentStatus: paid ? 'settled' : 'unpaid',
      paid,
    }
  })

  return {
    id: billId,
    creatorId: 'u-self',
    title: input.title,
    category: input.category,
    totalAmount: input.totalAmount,
    total: input.totalAmount,
    taxAmount: input.taxAmount ?? 0,
    serviceAmount: input.serviceAmount ?? 0,
    discountAmount: input.discountAmount ?? 0,
    status: 'active',
    createdAt: now.toISOString(),
    time: timeStr,
    splitMethod: input.splitMethod ?? 'equal',
    participants,
    items: input.items ?? [
      {
        id: `${billId}-i1`,
        billId,
        name: input.title,
        qty: 1,
        price: input.totalAmount,
        assignedParticipantIds: participants.map((p) => p.id),
      },
    ],
  }
}

export async function verifyPayment(
  billId: string,
  participantNameOrId: string,
  nextStatus: PaymentStatus = 'settled',
  proofImageUrl?: string,
  delayMs = 400,
): Promise<{ billId: string; participantNameOrId: string; paymentStatus: PaymentStatus; proofImageUrl?: string }> {
  await wait(delayMs)
  return {
    billId,
    participantNameOrId,
    paymentStatus: nextStatus,
    proofImageUrl,
  }
}

