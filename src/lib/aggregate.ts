import { endOfMonth, endOfWeek, isWithinInterval, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import type { AggregationBasis, AggregationPeriod, Category, Transaction } from '../types'

export interface CategoryTotal {
  categoryId: string
  name: string
  total: number
  percentage: number
}

export function getPeriodRange(period: AggregationPeriod, anchor: Date): { start: Date; end: Date } {
  if (period === 'week') {
    return { start: startOfWeek(anchor, { weekStartsOn: 1 }), end: endOfWeek(anchor, { weekStartsOn: 1 }) }
  }
  return { start: startOfMonth(anchor), end: endOfMonth(anchor) }
}

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: AggregationPeriod,
  basis: AggregationBasis,
  anchor: Date,
): Transaction[] {
  const { start, end } = getPeriodRange(period, anchor)
  return transactions.filter((t) => {
    const date = parseISO(basis === 'usage' ? t.usageDate : t.paymentDate)
    return isWithinInterval(date, { start, end })
  })
}

function buildTotals(transactions: Transaction[], keyOf: (t: Transaction) => string): Map<string, number> {
  const totals = new Map<string, number>()
  for (const t of transactions) {
    const key = keyOf(t)
    totals.set(key, (totals.get(key) ?? 0) + t.amount)
  }
  return totals
}

function toCategoryTotals(totals: Map<string, number>, categories: Category[]): CategoryTotal[] {
  const grandTotal = Array.from(totals.values()).reduce((sum, v) => sum + v, 0)
  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  return Array.from(totals.entries())
    .map(([categoryId, total]) => ({
      categoryId,
      name: categoryMap.get(categoryId)?.name ?? '不明',
      total,
      percentage: grandTotal === 0 ? 0 : (total / grandTotal) * 100,
    }))
    .sort((a, b) => b.total - a.total)
}

/** カテゴリ単位（サブカテゴリはそのまま）での集計 */
export function aggregateByCategory(transactions: Transaction[], categories: Category[]): CategoryTotal[] {
  return toCategoryTotals(
    buildTotals(transactions, (t) => t.categoryId),
    categories,
  )
}

/** サブカテゴリを親カテゴリに合算した集計（円グラフ用） */
export function aggregateByParentCategory(transactions: Transaction[], categories: Category[]): CategoryTotal[] {
  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  function rootIdOf(id: string): string {
    const seen = new Set<string>()
    let current = categoryMap.get(id)
    while (current?.parentId && categoryMap.has(current.parentId) && !seen.has(current.id)) {
      seen.add(current.id)
      current = categoryMap.get(current.parentId)
    }
    return current?.id ?? id
  }

  return toCategoryTotals(
    buildTotals(transactions, (t) => rootIdOf(t.categoryId)),
    categories,
  )
}

const OTHER_BUCKET_ID = '__other__'

/** 円グラフ表示用に、上位 maxSlices-1 件以外を「その他」へ合算する */
export function foldIntoOther(totals: CategoryTotal[], maxSlices: number, otherLabel: string): CategoryTotal[] {
  if (totals.length <= maxSlices) return totals

  const kept = totals.slice(0, maxSlices - 1)
  const rest = totals.slice(maxSlices - 1)
  const otherTotal = rest.reduce((sum, t) => sum + t.total, 0)
  const otherPercentage = rest.reduce((sum, t) => sum + t.percentage, 0)

  return [
    ...kept,
    { categoryId: OTHER_BUCKET_ID, name: otherLabel, total: otherTotal, percentage: otherPercentage },
  ]
}
