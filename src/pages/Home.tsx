import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { CategoryPicker } from '../components/CategoryPicker'
import { FixedCostForm } from '../components/FixedCostForm'
import { FixedCostList } from '../components/FixedCostList'
import { PaymentMethodPicker } from '../components/PaymentMethodPicker'
import { PayerPicker } from '../components/PayerPicker'
import { useCategories } from '../hooks/useCategories'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { usePayers } from '../hooks/usePayers'
import { addTransaction } from '../hooks/useTransactions'
import { calculatePaymentDate } from '../lib/paymentDate'

type InputMode = 'expense' | 'fixed' | 'income'

function today(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function Home() {
  const [mode, setMode] = useState<InputMode>('expense')

  return (
    <div className="page">
      <h1>収支入力</h1>

      <div className="toggle-row">
        <button
          type="button"
          className={mode === 'expense' ? 'toggle-selected' : ''}
          onClick={() => setMode('expense')}
        >
          支出
        </button>
        <button type="button" className={mode === 'fixed' ? 'toggle-selected' : ''} onClick={() => setMode('fixed')}>
          固定費
        </button>
        <button
          type="button"
          className={mode === 'income' ? 'toggle-selected' : ''}
          onClick={() => setMode('income')}
        >
          収入
        </button>
      </div>

      {mode === 'expense' && <ExpenseForm />}
      {mode === 'fixed' && (
        <>
          <FixedCostForm />
          <h2 className="section-heading">登録済みの固定費</h2>
          <FixedCostList />
        </>
      )}
      {mode === 'income' && <IncomeForm />}
    </div>
  )
}

function ExpenseForm() {
  const categories = useCategories('expense')
  const paymentMethods = usePaymentMethods()
  const payers = usePayers()

  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null)
  const [payerId, setPayerId] = useState<string | null>(null)
  const [usageDate, setUsageDate] = useState(today())
  const [paymentDate, setPaymentDate] = useState(today())
  const [paymentDateIsManual, setPaymentDateIsManual] = useState(false)
  const [savedMessage, setSavedMessage] = useState(false)

  useEffect(() => {
    if (!categoryId && categories.length > 0) setCategoryId(categories[0].id)
  }, [categories, categoryId])

  useEffect(() => {
    if (!paymentMethodId && paymentMethods.length > 0) setPaymentMethodId(paymentMethods[0].id)
  }, [paymentMethods, paymentMethodId])

  useEffect(() => {
    if (!payerId && payers.length > 0) setPayerId(payers[0].id)
  }, [payers, payerId])

  const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId) ?? null
  const isCredit = selectedMethod?.type === 'credit'

  useEffect(() => {
    if (!selectedMethod) return
    if (selectedMethod.type !== 'credit') {
      setPaymentDate(usageDate)
      setPaymentDateIsManual(false)
      return
    }
    if (!paymentDateIsManual) {
      setPaymentDate(calculatePaymentDate(usageDate, selectedMethod))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usageDate, selectedMethod, paymentDateIsManual])

  function handlePaymentMethodSelect(id: string) {
    setPaymentMethodId(id)
    setPaymentDateIsManual(false)
  }

  const amountNumber = Number(amount)
  const canSave = amountNumber > 0 && categoryId && paymentMethodId && payerId

  async function handleSave() {
    if (!canSave || !categoryId || !paymentMethodId || !payerId) return
    await addTransaction({
      kind: 'expense',
      amount: amountNumber,
      categoryId,
      paymentMethodId,
      usageDate,
      paymentDate: isCredit ? paymentDate : usageDate,
      paymentDateIsManual: isCredit ? paymentDateIsManual : false,
      payerId,
    })
    setAmount('')
    setUsageDate(today())
    setPaymentDateIsManual(false)
    setSavedMessage(true)
    setTimeout(() => setSavedMessage(false), 1500)
  }

  return (
    <div>
      <section className="field">
        <label htmlFor="amount">金額</label>
        <input
          id="amount"
          type="number"
          inputMode="numeric"
          placeholder="0"
          className="amount-input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />
      </section>

      <section className="field">
        <label>カテゴリ</label>
        <CategoryPicker categories={categories} kind="expense" selectedId={categoryId} onSelect={setCategoryId} />
      </section>

      <section className="field">
        <label>支払方法</label>
        <PaymentMethodPicker
          methods={paymentMethods}
          selectedId={paymentMethodId}
          onSelect={handlePaymentMethodSelect}
        />
      </section>

      <section className="field">
        <label htmlFor="usageDate">利用日</label>
        <input id="usageDate" type="date" value={usageDate} onChange={(e) => setUsageDate(e.target.value)} />
      </section>

      {isCredit && (
        <section className="field">
          <label htmlFor="paymentDate">支払日（引き落とし日）</label>
          <input
            id="paymentDate"
            type="date"
            value={paymentDate}
            onChange={(e) => {
              setPaymentDate(e.target.value)
              setPaymentDateIsManual(true)
            }}
          />
          {!paymentDateIsManual && <span className="hint">締め日・支払日ルールから自動計算</span>}
        </section>
      )}

      <section className="field">
        <label>入力者</label>
        <PayerPicker payers={payers} selectedId={payerId} onSelect={setPayerId} />
      </section>

      <button type="button" className="save-button" disabled={!canSave} onClick={handleSave}>
        保存
      </button>

      {savedMessage && <div className="saved-toast">保存しました</div>}
    </div>
  )
}

function IncomeForm() {
  const categories = useCategories('income')
  const payers = usePayers()

  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [payerId, setPayerId] = useState<string | null>(null)
  const [date, setDate] = useState(today())
  const [savedMessage, setSavedMessage] = useState(false)

  useEffect(() => {
    if (!categoryId && categories.length > 0) setCategoryId(categories[0].id)
  }, [categories, categoryId])

  useEffect(() => {
    if (!payerId && payers.length > 0) setPayerId(payers[0].id)
  }, [payers, payerId])

  const amountNumber = Number(amount)
  const canSave = amountNumber > 0 && categoryId && payerId

  async function handleSave() {
    if (!canSave || !categoryId || !payerId) return
    await addTransaction({
      kind: 'income',
      amount: amountNumber,
      categoryId,
      usageDate: date,
      paymentDate: date,
      paymentDateIsManual: false,
      payerId,
    })
    setAmount('')
    setDate(today())
    setSavedMessage(true)
    setTimeout(() => setSavedMessage(false), 1500)
  }

  return (
    <div>
      <section className="field">
        <label htmlFor="income-amount">金額</label>
        <input
          id="income-amount"
          type="number"
          inputMode="numeric"
          placeholder="0"
          className="amount-input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </section>

      <section className="field">
        <label>カテゴリ</label>
        <CategoryPicker categories={categories} kind="income" selectedId={categoryId} onSelect={setCategoryId} />
      </section>

      <section className="field">
        <label htmlFor="income-date">受取日</label>
        <input id="income-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </section>

      <section className="field">
        <label>入力者</label>
        <PayerPicker payers={payers} selectedId={payerId} onSelect={setPayerId} />
      </section>

      <button type="button" className="save-button" disabled={!canSave} onClick={handleSave}>
        保存
      </button>

      {savedMessage && <div className="saved-toast">保存しました</div>}
    </div>
  )
}
