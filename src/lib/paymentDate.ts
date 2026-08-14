import { addMonths, format, getDaysInMonth, parseISO, setDate, startOfMonth } from 'date-fns'
import type { PaymentMethod } from '../types'

/** 月内の日数を超える日付指定（31日締め等）は月末に丸める */
export function resolveDayInMonth(monthStart: Date, day: number): Date {
  const daysInMonth = getDaysInMonth(monthStart)
  return setDate(monthStart, Math.min(day, daysInMonth))
}

/**
 * 利用日と支払方法から支払日（引き落とし日）を計算する。
 * 現金・即時決済の場合は利用日をそのまま返す。
 */
export function calculatePaymentDate(usageDate: string, method: PaymentMethod): string {
  if (method.type !== 'credit') {
    return usageDate
  }

  const closingDay = method.closingDay ?? 31
  const paymentDay = method.paymentDay ?? 27
  const monthOffset = method.paymentMonthOffset ?? 1

  const usage = parseISO(usageDate)
  const usageMonthStart = startOfMonth(usage)
  const closingDateThisMonth = resolveDayInMonth(usageMonthStart, closingDay)

  const closingMonthStart =
    usage.getDate() <= closingDateThisMonth.getDate() ? usageMonthStart : addMonths(usageMonthStart, 1)

  const paymentMonthStart = addMonths(closingMonthStart, monthOffset)
  const paymentDate = resolveDayInMonth(paymentMonthStart, paymentDay)

  return format(paymentDate, 'yyyy-MM-dd')
}
