import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Transaction } from '../types'

export function useTransactions(): Transaction[] {
  return useLiveQuery(() => db.transactions.orderBy('usageDate').reverse().toArray(), [], []) ?? []
}

export type NewTransactionInput = Omit<Transaction, 'id' | 'createdAt'>

export async function addTransaction(input: NewTransactionInput): Promise<Transaction> {
  const transaction: Transaction = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  }
  await db.transactions.add(transaction)
  return transaction
}

export async function updateTransaction(id: string, changes: Partial<NewTransactionInput>): Promise<void> {
  await db.transactions.update(id, changes)
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id)
}
