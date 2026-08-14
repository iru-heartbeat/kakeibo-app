import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { CategoryPicker } from './CategoryPicker'
import { PaymentMethodPicker } from './PaymentMethodPicker'
import { PayerPicker } from './PayerPicker'
import { useCategories } from '../hooks/useCategories'
import { addFixedCost, materializeFixedCosts } from '../hooks/useFixedCosts'
import { usePaymentMethods } from '../hooks/usePaymentMethods'
import { usePayers } from '../hooks/usePayers'
import type { FixedCostScheduleType } from '../types'

function today(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

export function FixedCostForm() {
  const categories = useCategories('expense')
  const paymentMethods = usePaymentMethods()
  const payers = usePayers()

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null)
  const [payerId, setPayerId] = useState<string | null>(null)
  const [scheduleType, setScheduleType] = useState<FixedCostScheduleType>('monthly')
  const [dayOfMonth, setDayOfMonth] = useState(27)
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [startDate, setStartDate] = useState(today())
  const [savedMessage, setSavedMessage] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      const fixedCostCategory = categories.find((c) => c.name === '固定費' && !c.parentId)
      setCategoryId(fixedCostCategory?.id ?? categories[0].id)
    }
  }, [categories, categoryId])

  useEffect(() => {
    if (!paymentMethodId && paymentMethods.length > 0) setPaymentMethodId(paymentMethods[0].id)
  }, [paymentMethods, paymentMethodId])

  useEffect(() => {
    if (!payerId && payers.length > 0) setPayerId(payers[0].id)
  }, [payers, payerId])

  const amountNumber = Number(amount)
  const canSave = name.trim() && amountNumber > 0 && categoryId && paymentMethodId && payerId

  async function handleSave() {
    if (!canSave || !categoryId || !paymentMethodId || !payerId) return
    setSaving(true)
    try {
      await addFixedCost({
        name: name.trim(),
        amount: amountNumber,
        categoryId,
        paymentMethodId,
        payerId,
        scheduleType,
        dayOfMonth: scheduleType === 'monthly' ? dayOfMonth : undefined,
        dayOfWeek: scheduleType === 'weekly' ? dayOfWeek : undefined,
        startDate,
      })
      await materializeFixedCosts()
      setName('')
      setAmount('')
      setStartDate(today())
      setSavedMessage(true)
      setTimeout(() => setSavedMessage(false), 1500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <section className="field">
        <label htmlFor="fc-name">名称</label>
        <input
          id="fc-name"
          type="text"
          placeholder="例: 家賃、Netflix"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </section>

      <section className="field">
        <label htmlFor="fc-amount">金額</label>
        <input
          id="fc-amount"
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
        <CategoryPicker categories={categories} kind="expense" selectedId={categoryId} onSelect={setCategoryId} />
      </section>

      <section className="field">
        <label>支払方法</label>
        <PaymentMethodPicker methods={paymentMethods} selectedId={paymentMethodId} onSelect={setPaymentMethodId} />
      </section>

      <section className="field">
        <label>入力者</label>
        <PayerPicker payers={payers} selectedId={payerId} onSelect={setPayerId} />
      </section>

      <section className="field">
        <label>発生タイミング</label>
        <div className="toggle-row">
          <button
            type="button"
            className={scheduleType === 'monthly' ? 'toggle-selected' : ''}
            onClick={() => setScheduleType('monthly')}
          >
            毎月
          </button>
          <button
            type="button"
            className={scheduleType === 'weekly' ? 'toggle-selected' : ''}
            onClick={() => setScheduleType('weekly')}
          >
            毎週
          </button>
        </div>

        {scheduleType === 'monthly' ? (
          <select value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d === 31 ? '月末' : `${d}日`}
              </option>
            ))}
          </select>
        ) : (
          <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
            {WEEKDAY_LABELS.map((label, index) => (
              <option key={index} value={index}>
                {label}曜日
              </option>
            ))}
          </select>
        )}
      </section>

      <section className="field">
        <label htmlFor="fc-start">開始日</label>
        <input id="fc-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <span className="hint">開始日〜今日までの分はすぐに履歴へ反映されます</span>
      </section>

      <button type="button" className="save-button" disabled={!canSave || saving} onClick={handleSave}>
        固定費を登録
      </button>

      {savedMessage && <div className="saved-toast">登録しました</div>}
    </div>
  )
}
