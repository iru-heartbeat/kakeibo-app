import { useState } from 'react'
import { addPaymentMethod, updatePaymentMethod } from '../hooks/usePaymentMethods'
import type { PaymentMethod, PaymentMethodType } from '../types'

interface PaymentMethodPickerProps {
  methods: PaymentMethod[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function PaymentMethodPicker({ methods, selectedId, onSelect }: PaymentMethodPickerProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<PaymentMethodType>('other')
  const [closingDay, setClosingDay] = useState(31)
  const [paymentDay, setPaymentDay] = useState(27)
  const [paymentMonthOffset, setPaymentMonthOffset] = useState<1 | 2>(1)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editClosingDay, setEditClosingDay] = useState(31)
  const [editPaymentDay, setEditPaymentDay] = useState(27)
  const [editPaymentMonthOffset, setEditPaymentMonthOffset] = useState<1 | 2>(1)

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    const created = await addPaymentMethod({
      name,
      type: newType,
      ...(newType === 'credit' ? { closingDay, paymentDay, paymentMonthOffset } : {}),
    })
    setNewName('')
    setNewType('other')
    setAdding(false)
    onSelect(created.id)
  }

  function startEdit(method: PaymentMethod) {
    setEditingId(method.id)
    setEditName(method.name)
    setEditClosingDay(method.closingDay ?? 31)
    setEditPaymentDay(method.paymentDay ?? 27)
    setEditPaymentMonthOffset(method.paymentMonthOffset ?? 1)
  }

  async function handleEditSave() {
    if (!editingId) return
    const name = editName.trim()
    if (!name) return
    await updatePaymentMethod(editingId, {
      name,
      closingDay: editClosingDay,
      paymentDay: editPaymentDay,
      paymentMonthOffset: editPaymentMonthOffset,
    })
    setEditingId(null)
  }

  return (
    <div className="picker">
      {methods.map((method) => (
        <div key={method.id} className="picker-chip-row">
          <button
            type="button"
            className={`chip ${selectedId === method.id ? 'chip-selected' : ''}`}
            onClick={() => onSelect(method.id)}
          >
            {method.name}
          </button>
          {method.type === 'credit' && (
            <button
              type="button"
              className="chip-edit"
              aria-label={`${method.name}を編集`}
              onClick={() => startEdit(method)}
            >
              ✎
            </button>
          )}
        </div>
      ))}

      {!adding && (
        <button type="button" className="chip chip-add" onClick={() => setAdding(true)}>
          ＋ 追加
        </button>
      )}

      {adding && (
        <div className="inline-add-form">
          <input
            type="text"
            placeholder="支払方法名"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <select value={newType} onChange={(e) => setNewType(e.target.value as PaymentMethodType)}>
            <option value="other">即時決済（PayPayなど）</option>
            <option value="cash">現金</option>
            <option value="credit">クレジットカード</option>
          </select>

          {newType === 'credit' && (
            <div className="credit-fields">
              <label>
                締め日
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={closingDay}
                  onChange={(e) => setClosingDay(Number(e.target.value))}
                />
              </label>
              <label>
                支払日
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={paymentDay}
                  onChange={(e) => setPaymentDay(Number(e.target.value))}
                />
              </label>
              <label>
                支払月
                <select
                  value={paymentMonthOffset}
                  onChange={(e) => setPaymentMonthOffset(Number(e.target.value) as 1 | 2)}
                >
                  <option value={1}>翌月払い</option>
                  <option value={2}>翌々月払い</option>
                </select>
              </label>
            </div>
          )}

          <button type="button" onClick={handleAdd}>
            追加
          </button>
          <button type="button" className="btn-cancel" onClick={() => setAdding(false)}>
            キャンセル
          </button>
        </div>
      )}

      {editingId && (
        <div className="inline-add-form">
          <input type="text" placeholder="カード名" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <div className="credit-fields">
            <label>
              締め日
              <input
                type="number"
                min={1}
                max={31}
                value={editClosingDay}
                onChange={(e) => setEditClosingDay(Number(e.target.value))}
              />
            </label>
            <label>
              支払日
              <input
                type="number"
                min={1}
                max={31}
                value={editPaymentDay}
                onChange={(e) => setEditPaymentDay(Number(e.target.value))}
              />
            </label>
            <label>
              支払月
              <select
                value={editPaymentMonthOffset}
                onChange={(e) => setEditPaymentMonthOffset(Number(e.target.value) as 1 | 2)}
              >
                <option value={1}>翌月払い</option>
                <option value={2}>翌々月払い</option>
              </select>
            </label>
          </div>
          <span className="hint">以後の新規取引の支払日自動計算に反映されます（過去の取引は変わりません）</span>
          <button type="button" onClick={handleEditSave}>
            保存
          </button>
          <button type="button" className="btn-cancel" onClick={() => setEditingId(null)}>
            キャンセル
          </button>
        </div>
      )}
    </div>
  )
}
