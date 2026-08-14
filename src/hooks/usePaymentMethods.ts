import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { PaymentMethod, PaymentMethodType } from '../types'

export function usePaymentMethods(): PaymentMethod[] {
  return useLiveQuery(() => db.paymentMethods.orderBy('sortOrder').toArray(), [], []) ?? []
}

export interface NewPaymentMethodInput {
  name: string
  type: PaymentMethodType
  closingDay?: number
  paymentDay?: number
  paymentMonthOffset?: 1 | 2
}

export async function addPaymentMethod(input: NewPaymentMethodInput): Promise<PaymentMethod> {
  const count = await db.paymentMethods.count()
  const method: PaymentMethod = {
    id: crypto.randomUUID(),
    isDefault: false,
    sortOrder: count,
    ...input,
  }
  await db.paymentMethods.add(method)
  return method
}

export async function updatePaymentMethod(id: string, changes: Partial<NewPaymentMethodInput>): Promise<void> {
  await db.paymentMethods.update(id, changes)
}
