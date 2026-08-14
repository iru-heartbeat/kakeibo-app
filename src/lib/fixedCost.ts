import { addDays, addMonths, format, getDay, isAfter, isBefore, parseISO, startOfMonth } from 'date-fns'
import type { FixedCost } from '../types'
import { resolveDayInMonth } from './paymentDate'

/**
 * 固定費テンプレートから、開始日〜until（含む）までの発生日一覧を計算する。
 */
export function getOccurrenceDates(fixedCost: FixedCost, until: Date): string[] {
  const start = parseISO(fixedCost.startDate)
  if (isAfter(start, until)) return []

  const dates: string[] = []

  if (fixedCost.scheduleType === 'monthly') {
    const dayOfMonth = fixedCost.dayOfMonth ?? 1
    const untilMonthStart = startOfMonth(until)
    let monthCursor = startOfMonth(start)

    while (!isAfter(monthCursor, untilMonthStart)) {
      const occurrence = resolveDayInMonth(monthCursor, dayOfMonth)
      if (!isBefore(occurrence, start) && !isAfter(occurrence, until)) {
        dates.push(format(occurrence, 'yyyy-MM-dd'))
      }
      monthCursor = addMonths(monthCursor, 1)
    }
  } else {
    const dayOfWeek = fixedCost.dayOfWeek ?? 0
    let cursor = start
    while (getDay(cursor) !== dayOfWeek) {
      cursor = addDays(cursor, 1)
    }
    while (!isAfter(cursor, until)) {
      dates.push(format(cursor, 'yyyy-MM-dd'))
      cursor = addDays(cursor, 7)
    }
  }

  return dates
}
