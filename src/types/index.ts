export type PaymentStatus = 'unpaid' | 'waiting_verification' | 'settled'

export type BillStatus = 'draft' | 'active' | 'settled'

export type SplitMethod = 'equal' | 'per_item'

export type InputMode = 'manual' | 'scan'

export interface UserProfile {
  id: string
  username: string
  fullName: string
  phone?: string
  avatarUrl: string
  bankName: string
  bankAccountNo: string
  qrisUrl?: string
}

export interface BillItem {
  id: string
  billId: string
  name: string
  qty: number
  price: number
  assignedParticipantIds: string[]
}

export interface BillParticipant {
  id: string
  billId: string
  userId: string
  name: string
  avatarUrl: string
  totalOwed: number
  paymentStatus: PaymentStatus
  proofImageUrl?: string
  /** Computed convenience flag (`paymentStatus === 'settled'`) for UI toggles */
  paid: boolean
}

export interface Bill {
  id: string
  creatorId: string
  title: string
  category: string
  totalAmount: number
  taxAmount: number
  serviceAmount: number
  discountAmount: number
  status: BillStatus
  createdAt: string
  /** Formatted display timestamp (e.g. "Hari ini, 13:40") */
  time: string
  /** Alias for `totalAmount` for UI compatibility */
  total: number
  participants: BillParticipant[]
  items?: BillItem[]
  splitMethod?: SplitMethod
}

export interface Session {
  name: string
  phone: string
  user?: UserProfile
}

export interface TalanganSummary {
  masuk: {
    count: number
    amount: number
    note: string
  }
  tagihan: {
    count: number
    amount: number
    note: string
  }
}

export interface JenisOption {
  readonly id: 'resto' | 'jajan' | 'flat'
  readonly title: string
  readonly desc: string
  readonly icon: string
}

