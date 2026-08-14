import { useState } from 'react'
import { CategoryPicker } from '../components/CategoryPicker'
import { PaymentMethodPicker } from '../components/PaymentMethodPicker'
import { PayerPicker } from '../components/PayerPicker'
import { deleteTransaction, updateTransaction } from '../hooks/useTransactions'
import { getCategoryLabel } from '../lib/categoryLabel'
import { calculatePaymentDate } from '../lib/paymentDate'
import type { AggregationBasis, Category, PaymentMethod, Payer, Transaction } from '../types'

interface TransactionRowProps {
  transaction: Transaction
  categories: Category[]
  paymentMethods: PaymentMethod[]
  payers: Payer[]
  basis: AggregationBasis
}

export function TransactionRow({ transaction, categories, paymentMethods, payers, basis }: TransactionRowProps) {
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState(String(transaction.amount))
  const [categoryId, setCategoryId] = useState(transaction.categoryId)
  const [paymentMethodId, setPaymentMethodId] = useState(transaction.paymentMethodId ?? '')
  const [payerId, setPayerId] = useState(transaction.payerId)
  const [usageDate, setUsageDate] = useState(transaction.usageDate)
  const [paymentDate, setPaymentDate] = useState(transaction.paymentDate)
  const [paymentDateIsManual, setPaymentDateIsManual] = useState(transaction.paymentDateIsManual)

  const isIncome = transaction.kind === 'income'
  const expenseCategories = categories.filter((c) => c.kind === 'expense')
  const incomeCategories = categories.filter((c) => c.kind === 'income')

  const paymentMethod = paymentMethods.find((m) => m.id === transaction.paymentMethodId)
  const payer = payers.find((p) => p.id === transaction.payerId)
  const editMethod = paymentMethods.find((m) => m.id === paymentMethodId)
  const isCredit = editMethod?.type === 'credit'
  const displayDate = basis === 'usage' ? transaction.usageDate : transaction.paymentDate

  function handleUsageDateChange(value: string) {
    setUsageDate(value)
    if (isCredit && !paymentDateIsManual && editMethod) {
      setPaymentDate(calculatePaymentDate(value, editMethod))
    } else if (!isCredit) {
      setPaymentDate(value)
    }
  }

  function handleMethodSelect(id: string) {
    setPaymentMethodId(id)
    setPaymentDateIsManual(false)
    const method = paymentMethods.find((m) => m.id === id)
    if (method && method.type === 'credit') {
      setPaymentDate(calculatePaymentDate(usageDate, method))
    } else {
      setPaymentDate(usageDate)
    }
  }

  async function handleSave() {
    const amountNumber = Number(amount)
    if (amountNumber <= 0) return

    if (isIncome) {
      await updateTransaction(transaction.id, {
        amount: amountNumber,
        categoryId,
        paymentMethodId: undefined,
        usageDate,
        paymentDate: usageDate,
        paymentDateIsManual: false,
        payerId,
      })
    } else {
      await updateTransaction(transaction.id, {
        amount: amountNumber,
        categoryId,
        paymentMethodId,
        usageDate,
        paymentDate: isCredit ? paymentDate : usageDate,
        paymentDateIsManual: isCredit ? paymentDateIsManual : false,
        payerId,
      })
    }
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm('この取引を削除しますか？')) return
    await deleteTransaction(transaction.id)
  }

  if (!editing) {
    return (
      <div className="transaction-row">
        <div className="transaction-row-main">
          <span className="transaction-date">{displayDate}</span>
          <span className="transaction-category">{getCategoryLabel(transaction.categoryId, categories)}</span>
          {!isIncome && <span className="transaction-method">{paymentMethod?.name ?? '不明'}</span>}
          {transaction.fixedCostId && <span className="badge-fixed">固定費</span>}
          <span className={`transaction-amount ${isIncome ? 'transaction-amount-income' : ''}`}>
            {isIncome ? '+' : ''}¥{transaction.amount.toLocaleString()}
          </span>
          <span className="transaction-payer">{payer?.name ?? '不明'}</span>
        </div>
        <div className="transaction-row-actions">
          <button type="button" onClick={() => setEditing(true)}>
            編集
          </button>
          <button type="button" className="btn-cancel" onClick={handleDelete}>
            削除
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="transaction-row transaction-row-editing">
      <div className="field">
        <label>金額</label>
        <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="field">
        <label>カテゴリ</label>
        {isIncome ? (
          <CategoryPicker categories={incomeCategories} kind="income" selectedId={categoryId} onSelect={setCategoryId} />
        ) : (
          <CategoryPicker
            categories={expenseCategories}
            kind="expense"
            selectedId={categoryId}
            onSelect={setCategoryId}
          />
        )}
      </div>

      {!isIncome && (
        <div className="field">
          <label>支払方法</label>
          <PaymentMethodPicker methods={paymentMethods} selectedId={paymentMethodId} onSelect={handleMethodSelect} />
        </div>
      )}

      <div className="field">
        <label>{isIncome ? '受取日' : '利用日'}</label>
        <input type="date" value={usageDate} onChange={(e) => handleUsageDateChange(e.target.value)} />
      </div>

      {!isIncome && isCredit && (
        <div className="field">
          <label>支払日</label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => {
              setPaymentDate(e.target.value)
              setPaymentDateIsManual(true)
            }}
          />
        </div>
      )}

      <div className="field">
        <label>入力者</label>
        <PayerPicker payers={payers} selectedId={payerId} onSelect={setPayerId} />
      </div>
      <div className="transaction-row-actions">
        <button type="button" onClick={handleSave}>
          保存
        </button>
        <button type="button" className="btn-cancel" onClick={() => setEditing(false)}>
          キャンセル
        </button>
      </div>
    </div>
  )
}
