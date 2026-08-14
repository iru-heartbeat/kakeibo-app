import { addMonths, addWeeks, format } from 'date-fns'
import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useCategories } from '../hooks/useCategories'
import { usePrefersDark } from '../hooks/usePrefersDark'
import { useTransactions } from '../hooks/useTransactions'
import { aggregateByParentCategory, filterTransactionsByPeriod, foldIntoOther, getPeriodRange } from '../lib/aggregate'
import { CATEGORICAL_DARK, CATEGORICAL_LIGHT, MAX_PIE_SLICES, OTHER_LABEL } from '../lib/chartPalette'
import type { AggregationBasis, AggregationPeriod } from '../types'

function formatPeriodLabel(period: AggregationPeriod, anchor: Date): string {
  const { start, end } = getPeriodRange(period, anchor)
  if (period === 'week') {
    return `${format(start, 'M/d')} 〜 ${format(end, 'M/d')}`
  }
  return format(anchor, 'yyyy年M月')
}

export function Aggregation() {
  const transactions = useTransactions()
  const categories = useCategories()
  const prefersDark = usePrefersDark()

  const [period, setPeriod] = useState<AggregationPeriod>('month')
  const [basis, setBasis] = useState<AggregationBasis>('usage')
  const [anchor, setAnchor] = useState(new Date())

  const periodExpenses = useMemo(
    () => filterTransactionsByPeriod(transactions, period, basis, anchor).filter((t) => t.kind === 'expense'),
    [transactions, period, basis, anchor],
  )

  const totals = useMemo(() => {
    const byParent = aggregateByParentCategory(periodExpenses, categories)
    return foldIntoOther(byParent, MAX_PIE_SLICES, OTHER_LABEL)
  }, [periodExpenses, categories])

  const grandTotal = totals.reduce((sum, t) => sum + t.total, 0)
  const palette = prefersDark ? CATEGORICAL_DARK : CATEGORICAL_LIGHT

  const monthlyTransactions = useMemo(
    () => filterTransactionsByPeriod(transactions, 'month', basis, anchor),
    [transactions, basis, anchor],
  )
  const monthlyIncome = useMemo(
    () => monthlyTransactions.filter((t) => t.kind === 'income').reduce((sum, t) => sum + t.amount, 0),
    [monthlyTransactions],
  )
  const monthlyExpense = useMemo(
    () => monthlyTransactions.filter((t) => t.kind === 'expense').reduce((sum, t) => sum + t.amount, 0),
    [monthlyTransactions],
  )
  const monthlyBalance = monthlyIncome - monthlyExpense
  const monthlyUsageRate = monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) * 100 : null

  function handlePrev() {
    setAnchor((prev) => (period === 'week' ? addWeeks(prev, -1) : addMonths(prev, -1)))
  }

  function handleNext() {
    setAnchor((prev) => (period === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1)))
  }

  return (
    <div className="page">
      <h1>集計</h1>

      <div className="toggle-row">
        <button type="button" className={period === 'week' ? 'toggle-selected' : ''} onClick={() => setPeriod('week')}>
          週
        </button>
        <button
          type="button"
          className={period === 'month' ? 'toggle-selected' : ''}
          onClick={() => setPeriod('month')}
        >
          月
        </button>
      </div>

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

      <div className="period-nav">
        <button type="button" onClick={handlePrev} aria-label="前の期間">
          ‹
        </button>
        <span>{formatPeriodLabel(period, anchor)}</span>
        <button type="button" onClick={handleNext} aria-label="次の期間">
          ›
        </button>
      </div>

      <div className="balance-card">
        <div className="balance-card-title">{format(anchor, 'yyyy年M月')}の収支</div>
        <div className="balance-card-row">
          <span>収入</span>
          <span>¥{monthlyIncome.toLocaleString()}</span>
        </div>
        <div className="balance-card-row">
          <span>支出</span>
          <span>¥{monthlyExpense.toLocaleString()}</span>
        </div>
        <div className={`balance-card-row balance-card-total ${monthlyBalance < 0 ? 'balance-negative' : 'balance-positive'}`}>
          <span>収支</span>
          <span>
            {monthlyBalance >= 0 ? '+' : ''}¥{monthlyBalance.toLocaleString()}
          </span>
        </div>
        <div className="balance-card-usage-rate">
          {monthlyUsageRate === null ? '収入が未登録です' : `収入の${monthlyUsageRate.toFixed(1)}%を使用`}
        </div>
      </div>

      <div className="aggregation-total">支出合計 ¥{grandTotal.toLocaleString()}</div>

      {totals.length === 0 ? (
        <p className="empty">この期間の取引はありません</p>
      ) : (
        <>
          <div className="viz-root pie-chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={totals} dataKey="total" nameKey="name" innerRadius={70} outerRadius={110} stroke="none">
                  {totals.map((entry, index) => (
                    <Cell key={entry.categoryId} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`¥${Number(value).toLocaleString()}`, name]}
                  contentStyle={{ fontSize: 13 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="category-legend">
            {totals.map((t, index) => (
              <li key={t.categoryId} className="category-legend-row">
                <span className="legend-swatch" style={{ backgroundColor: palette[index % palette.length] }} />
                <span className="legend-name">{t.name}</span>
                <span className="legend-amount">¥{t.total.toLocaleString()}</span>
                <span className="legend-percentage">{t.percentage.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
