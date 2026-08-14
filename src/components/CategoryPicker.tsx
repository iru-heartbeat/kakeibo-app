import { useState } from 'react'
import { addCategory } from '../hooks/useCategories'
import type { Category, CategoryKind } from '../types'

interface CategoryPickerProps {
  categories: Category[]
  kind: CategoryKind
  selectedId: string | null
  onSelect: (id: string) => void
}

export function CategoryPicker({ categories, kind, selectedId, onSelect }: CategoryPickerProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newParentId, setNewParentId] = useState('')

  const topLevel = categories.filter((c) => !c.parentId)
  const childrenOf = (parentId: string) => categories.filter((c) => c.parentId === parentId)

  async function handleAdd() {
    const name = newName.trim()
    if (!name) return
    const created = await addCategory(name, kind, newParentId || undefined)
    setNewName('')
    setNewParentId('')
    setAdding(false)
    onSelect(created.id)
  }

  return (
    <div className="picker">
      {topLevel.map((cat) => (
        <div key={cat.id} className="picker-group">
          <button
            type="button"
            className={`chip ${selectedId === cat.id ? 'chip-selected' : ''}`}
            onClick={() => onSelect(cat.id)}
          >
            {cat.name}
          </button>
          {childrenOf(cat.id).length > 0 && (
            <div className="picker-subrow">
              {childrenOf(cat.id).map((child) => (
                <button
                  key={child.id}
                  type="button"
                  className={`chip chip-sub ${selectedId === child.id ? 'chip-selected' : ''}`}
                  onClick={() => onSelect(child.id)}
                >
                  {child.name}
                </button>
              ))}
            </div>
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
            placeholder="カテゴリ名"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <select value={newParentId} onChange={(e) => setNewParentId(e.target.value)}>
            <option value="">大カテゴリとして追加</option>
            {topLevel.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} の子カテゴリ
              </option>
            ))}
          </select>
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
