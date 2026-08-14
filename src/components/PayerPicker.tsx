import { useState } from 'react'
import { addPayer } from '../hooks/usePayers'
import type { Payer } from '../types'

interface PayerPickerProps {
  payers: Payer[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function PayerPicker({ payers, selectedId, onSelect }: PayerPickerProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    const created = await addPayer(name)
    setNewName('')
    setAdding(false)
    onSelect(created.id)
  }

  return (
    <div className="picker">
      {payers.map((payer) => (
        <button
          key={payer.id}
          type="button"
          className={`chip ${selectedId === payer.id ? 'chip-selected' : ''}`}
          onClick={() => onSelect(payer.id)}
        >
          {payer.name}
        </button>
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
            placeholder="名前"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <button type="button" onClick={handleAdd}>
            追加
          </button>
          <button type="button" className="btn-cancel" onClick={() => setAdding(false)}>
            キャンセル
          </button>
        </div>
      )}
    </div>
  )
}
