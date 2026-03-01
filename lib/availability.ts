import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { addMinutes, addDays, isWeekend, format } from 'date-fns'

const WORK_START_HOUR = 9   // 9 AM
const WORK_END_HOUR = 17    // 5 PM
const SLOT_DURATION = 30    // minutes
const TIMEZONE = 'America/Los_Angeles' // PST/PDT is the host timezone

interface Interval {
  start: Date
  end: Date
}

function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.start < b.end && a.end > b.start
}

export function computeAvailableSlots(date: Date, busyIntervals: Interval[]): Date[] {
  // Generate slots in the host's timezone (PST)
  const dayStart = fromZonedTime(
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), WORK_START_HOUR, 0, 0),
    TIMEZONE
  )
  const dayEnd = fromZonedTime(
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), WORK_END_HOUR, 0, 0),
    TIMEZONE
  )

  const slots: Date[] = []
  let current = dayStart

  while (current < dayEnd) {
    const slotEnd = addMinutes(current, SLOT_DURATION)
    const slot: Interval = { start: current, end: slotEnd }

    const isBusy = busyIntervals.some((b) => intervalsOverlap(slot, b))
    if (!isBusy) {
      slots.push(current)
    }

    current = slotEnd
  }

  return slots
}

export function getBusinessDays(startDate: Date, count: number): Date[] {
  const days: Date[] = []
  let current = new Date(startDate)
  current.setHours(0, 0, 0, 0)

  while (days.length < count) {
    if (!isWeekend(current)) {
      days.push(new Date(current))
    }
    current = addDays(current, 1)
  }

  return days
}

export function formatSlotPST(date: Date): string {
  return format(toZonedTime(date, 'America/Los_Angeles'), 'h:mm a')
}

export function formatSlotEST(date: Date): string {
  return format(toZonedTime(date, 'America/New_York'), 'h:mm a')
}

export function formatDateHeader(date: Date): string {
  return format(date, 'EEEE, MMMM d').toUpperCase()
}

export function formatDateLabel(date: Date): string {
  const day = format(date, 'EEEE')
  const monthDay = format(date, 'MMMM d')
  return `${day}, ${monthDay}`
}
