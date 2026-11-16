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

export type ReceiptValidationIssueCode =
  | 'too_dark'
  | 'blurry'
  | 'glare_overexposed'
  | 'low_contrast_faded'
  | 'not_receipt'
  | 'resolution_too_small'

export interface ReceiptQualityMetrics {
  /** 0 - 100 average luminance score */
  brightness: number
  /** 0 - 100 edge sharpness / focus score */
  sharpness: number
  /** 0 - 100 text-to-paper contrast score */
  contrast: number
  /** 0 - 100 percentage of overexposed / glare pixels */
  glareRatio: number
  /** 0 - 100 estimated horizontal receipt text-line density */
  textDensity: number
  /** 0 - 100 overall OCR / receipt recognition confidence */
  confidence: number
  width: number
  height: number
}

export interface ReceiptValidationIssue {
  code: ReceiptValidationIssueCode
  severity: 'error' | 'warning'
  title: string
  subtitle: string
  description: string
  tips: string[]
  canForceContinue: boolean
  suggestTorch?: boolean
}

export interface ScannedReceiptDraft {
  title: string
  category: string
  items: BillItem[]
  taxAmount: number
  serviceAmount: number
  discountAmount: number
  detectedTextLines?: string[]
  confidence?: number
}

export interface ReceiptScanAnalysisResult {
  valid: boolean
  metrics: ReceiptQualityMetrics
  issue: ReceiptValidationIssue | null
  draft: ScannedReceiptDraft | null
  detectedLines: string[]
}


