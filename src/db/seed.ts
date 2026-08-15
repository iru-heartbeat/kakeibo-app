import { db } from './db'
import type { CategoryKind, PaymentMethodType } from '../types'

const DEFAULT_EXPENSE_CATEGORIES = ['食費', '交通費', '娯楽費', '日用品', '住居費', '医療費', '固定費', 'その他']
const DEFAULT_INCOME_CATEGORIES = ['給与', '賞与', '副業', 'その他']

const DEFAULT_PAYMENT_METHODS: Array<{
  name: string
  type: PaymentMethodType
  closingDay?: number
  paymentDay?: number
  paymentMonthOffset?: 1 | 2
}> = [
  { name: '現金', type: 'cash' },
  { name: 'PayPay', type: 'other' },
  { name: 'クレジットカード', type: 'credit', closingDay: 31, paymentDay: 27, paymentMonthOffset: 1 },
]

async function ensureCategory(name: string, kind: CategoryKind, sortOrder: number): Promise<void> {
  const exists = await db.categories.where({ kind }).filter((c) => !c.parentId && c.name === name).first()
  if (exists) return
  await db.categories.add({
    id: crypto.randomUUID(),
    name,
    kind,
    isDefault: true,
    sortOrder,
  })
}

async function ensurePaymentMethod(input: (typeof DEFAULT_PAYMENT_METHODS)[number], sortOrder: number): Promise<void> {
  const exists = await db.paymentMethods.filter((m) => m.name === input.name).first()
  if (exists) return
  await db.paymentMethods.add({
    id: crypto.randomUUID(),
    isDefault: true,
    sortOrder,
    ...input,
  })
}

async function ensurePayer(name: string, sortOrder: number): Promise<void> {
  const exists = await db.payers.filter((p) => p.name === name).first()
  if (exists) return
  await db.payers.add({ id: crypto.randomUUID(), name, sortOrder })
}

export async function seedIfEmpty(): Promise<void> {
  await db.transaction('rw', db.categories, db.paymentMethods, db.payers, async () => {
    await Promise.all(DEFAULT_EXPENSE_CATEGORIES.map((name, i) => ensureCategory(name, 'expense', i)))
    await Promise.all(DEFAULT_INCOME_CATEGORIES.map((name, i) => ensureCategory(name, 'income', i)))
    await Promise.all(DEFAULT_PAYMENT_METHODS.map((method, i) => ensurePaymentMethod(method, i)))
    await ensurePayer('自分', 0)
  })
}
