export type PaymentMethodType = 'cash' | 'credit' | 'other'
export type CategoryKind = 'expense' | 'income'
export type TransactionKind = 'expense' | 'income'
export type FixedCostScheduleType = 'monthly' | 'weekly'

export interface Category {
  id: string
  name: string
  kind: CategoryKind
  parentId?: string
  isDefault: boolean
  sortOrder: number
}

export interface PaymentMethod {
  id: string
  name: string
  type: PaymentMethodType
  isDefault: boolean
  sortOrder: number
  /** 締め日 (1-31, 31は月末扱い)。type === 'credit' のときのみ使用 */
  closingDay?: number
  /** 支払日 (1-31, 31は月末扱い)。type === 'credit' のときのみ使用 */
  paymentDay?: number
  /** 締め月から何ヶ月後に支払うか (1: 翌月払い, 2: 翌々月払い)。type === 'credit' のときのみ使用 */
  paymentMonthOffset?: 1 | 2
}

export interface Payer {
  id: string
  name: string
  sortOrder: number
}

export interface Transaction {
  id: string
  kind: TransactionKind
  amount: number
  categoryId: string
  /** 収入 (kind === 'income') の場合は支払方法を持たない */
  paymentMethodId?: string
  /** ISO date string (yyyy-MM-dd)。利用日（収入の場合は受取日） */
  usageDate: string
  /** ISO date string (yyyy-MM-dd)。支払日（現金・収入等は usageDate と同一） */
  paymentDate: string
  /** true の場合、支払方法変更などによる自動再計算をスキップする */
  paymentDateIsManual: boolean
  payerId: string
  memo?: string
  /** 固定費から自動生成された取引の場合、元となった FixedCost の id */
  fixedCostId?: string
  createdAt: string
}

export interface FixedCost {
  id: string
  name: string
  amount: number
  categoryId: string
  paymentMethodId: string
  payerId: string
  scheduleType: FixedCostScheduleType
  /** 1-31 (31は月末扱い)。scheduleType === 'monthly' のときのみ使用 */
  dayOfMonth?: number
  /** 0(日)-6(土)。scheduleType === 'weekly' のときのみ使用 */
  dayOfWeek?: number
  /** ISO date string (yyyy-MM-dd)。発生開始日 */
  startDate: string
  isActive: boolean
  createdAt: string
}

export type AggregationBasis = 'usage' | 'payment'
export type AggregationPeriod = 'week' | 'month'
