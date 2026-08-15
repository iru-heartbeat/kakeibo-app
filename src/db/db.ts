import Dexie, { type EntityTable } from 'dexie'
import type { Category, FixedCost, PaymentMethod, Payer, Transaction } from '../types'

export class KakeiboDB extends Dexie {
  categories!: EntityTable<Category, 'id'>
  paymentMethods!: EntityTable<PaymentMethod, 'id'>
  payers!: EntityTable<Payer, 'id'>
  transactions!: EntityTable<Transaction, 'id'>
  fixedCosts!: EntityTable<FixedCost, 'id'>

  constructor() {
    super('kakeibo')

    this.version(1).stores({
      categories: 'id, parentId, sortOrder',
      paymentMethods: 'id, type, sortOrder',
      payers: 'id, sortOrder',
      transactions: 'id, categoryId, paymentMethodId, payerId, usageDate, paymentDate, createdAt',
    })

    this.version(2)
      .stores({
        categories: 'id, kind, parentId, sortOrder',
        paymentMethods: 'id, type, sortOrder',
        payers: 'id, sortOrder',
        transactions:
          'id, kind, categoryId, paymentMethodId, payerId, usageDate, paymentDate, fixedCostId, createdAt',
        fixedCosts: 'id, categoryId, paymentMethodId, payerId',
      })
      .upgrade(async (tx) => {
        await tx
          .table('categories')
          .toCollection()
          .modify((category) => {
            if (!category.kind) category.kind = 'expense'
          })
        await tx
          .table('transactions')
          .toCollection()
          .modify((transaction) => {
            if (!transaction.kind) transaction.kind = 'expense'
          })
      })

    this.version(3).stores({
      fixedCosts: 'id, categoryId, paymentMethodId, payerId, createdAt',
    })
  }
}

export const db = new KakeiboDB()
