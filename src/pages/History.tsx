import { useMemo, useState } from 'react'
import { TransactionRow } from '../components/TransactionRow'
import { useCategories } from '../hooks/useCategories'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { usePayers } from '../hooks/usePayers'
import { useTransactions } from '../hooks/useTransactions'
import { getCategoryLabel } from '../lib/categoryLabel'
import type { AggregationBasis, TransactionKind } from '../types'

const ALL = 'all'

export function History() {
  const transactions = useTransactions()
  const categories = useCategories()
  const paymentMethods = usePaymentMethods()
  const payers = usePayers()

  const [basis, setBasis] = useState<AggregationBasis>('usage')
  const [kindFilter, setKindFilter] = useState<TransactionKind | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState(ALL)
  const [methodFilter, setMethodFilter] = useState(ALL)
  const [payerFilter, setPayerFilter] = useState(ALL)

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => kindFilter === 'all' || t.kind === kindFilter)
      .filter((t) => categoryFilter === ALL || t.categoryId === categoryFilter)
      .filter((t) => methodFilter === ALL || t.paymentMethodId === methodFilter)
      .filter((t) => payerFilter === ALL || t.payerId === payerFilter)
      .slice()
      .sort((a, b) => {
        const dateA = basis === 'usage' ? a.usageDate : a.paymentDate
        const dateB = basis === 'usage' ? b.usageDate : b.paymentDate
        return dateB.localeCompare(dateA)
      })
  }, [transactions, kindFilter, categoryFilter, methodFilter, payerFilter, basis])

  const expenseTotal = filtered.filter((t) => t.kind === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const incomeTotal = filtered.filter((t) => t.kind === 'income').reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="page">
      <h1>履歴一覧</h1>

      <div className="toggle-row">
        <button
          type="button"
          className={basis === 'usage' ? 'toggle-selected' : ''}
          onClick={() => setBasis('usage')}
        >
          利用日ベース
        </button>
        <button
          type="button"
          className={basis === 'payment' ? 'toggle-selected' : ''}
          onClick={() => setBasis('payment')}
        >
          支払日ベース
        </button>
      </div>

      <div className="toggle-row">
        <button type="button" className={kindFilter === 'all' ? 'toggle-selected' : ''} onClick={() => setKindFilter('all')}>
          すべて
        </button>
        <button
          type="button"
          className={kindFilter === 'expense' ? 'toggle-selected' : ''}
          onClick={() => setKindFilter('expense')}
        >
          支出
        </button>
        <button
          type="button"
          className={kindFilter === 'income' ? 'toggle-selected' : ''}
          onClick={() => setKindFilter('income')}
        >
          収入
        </button>
      </div>

      <div className="filter-row">
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value={ALL}>すべてのカテゴリ</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {getCategoryLabel(c.id, categories)}
            </option>
          ))}
        </select>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
          <option value={ALL}>すべての支払方法</option>
          {paymentMethods.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select value={payerFilter} onChange={(e) => setPayerFilter(e.target.value)}>
          <option value={ALL}>すべての入力者</option>
          {payers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="history-total">
        {kindFilter === 'income' ? (
          `収入合計 ¥${incomeTotal.toLocaleString()}（${filtered.length}件）`
        ) : kindFilter === 'expense' ? (
          `支出合計 ¥${expenseTotal.toLocaleString()}（${filtered.length}件）`
        ) : (
          `支出 ¥${expenseTotal.toLocaleString()} ／ 収入 ¥${incomeTotal.toLocaleString()}（${filtered.length}件）`
        )}
      </div>

      <div className="transaction-list">
        {filtered.length === 0 && <p className="empty">該当する取引がありません</p>}
        {filtered.map((t) => (
          <TransactionRow
            key={t.id}
            transaction={t}
            categories={categories}
            paymentMethods={paymentMethods}
            payers={payers}
            basis={basis}
          />
        ))}
      </div>
    </div>
  )
}
