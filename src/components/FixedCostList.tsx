import { useCategories } from '../hooks/useCategories'
import { deleteFixedCost, useFixedCosts } from '../hooks/useFixedCosts'
import { getCategoryLabel } from '../lib/categoryLabel'

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

function scheduleLabel(fixedCost: { scheduleType: string; dayOfMonth?: number; dayOfWeek?: number }): string {
  if (fixedCost.scheduleType === 'monthly') {
    const day = fixedCost.dayOfMonth ?? 1
    return `毎月${day === 31 ? '月末' : `${day}日`}`
  }
  return `毎週${WEEKDAY_LABELS[fixedCost.dayOfWeek ?? 0]}曜日`
}

export function FixedCostList() {
  const fixedCosts = useFixedCosts()
  const categories = useCategories()

  async function handleDelete(id: string) {
    if (!confirm('この固定費を削除しますか？（今後の自動生成が停止します。過去の取引は履歴に残ります）')) return
    await deleteFixedCost(id)
  }

  if (fixedCosts.length === 0) {
    return <p className="empty">登録済みの固定費はありません</p>
  }

  return (
    <ul className="fixed-cost-list">
      {fixedCosts.map((fc) => (
        <li key={fc.id} className="fixed-cost-row">
          <div className="fixed-cost-main">
            <span className="fixed-cost-name">{fc.name}</span>
            <span className="fixed-cost-amount">¥{fc.amount.toLocaleString()}</span>
          </div>
          <div className="fixed-cost-sub">
            <span>{getCategoryLabel(fc.categoryId, categories)}</span>
            <span>{scheduleLabel(fc)}</span>
          </div>
          <button type="button" className="btn-cancel" onClick={() => handleDelete(fc.id)}>
            削除
          </button>
        </li>
      ))}
    </ul>
  )
}
