import { NextRequest, NextResponse } from 'next/server'
import { getOutlookBusyTimes } from '@/lib/outlook'
import { getGoogleBusyTimes } from '@/lib/google-calendar'
import { getCohBusyTimes } from '@/lib/coh-calendar'
import { computeAvailableSlots } from '@/lib/availability'
import { addDays, startOfDay, endOfDay } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date') // YYYY-MM-DD

  if (!dateParam) {
    return NextResponse.json({ error: 'date param required' }, { status: 400 })
  }

  // Parse date in PST timezone (host's timezone)
  const [year, month, day] = dateParam.split('-').map(Number)
  const localDate = new Date(year, month - 1, day)

  // Range to query: full day in UTC (±1 day buffer to catch timezone edges)
  const rangeStart = fromZonedTime(
    new Date(year, month - 1, day, 0, 0, 0),
    'America/Los_Angeles'
  )
  const rangeEnd = fromZonedTime(
    new Date(year, month - 1, day, 23, 59, 59),
    'America/Los_Angeles'
  )

  try {
    // Fetch all calendars in parallel
    const [outlookBusy, googleBusy, cohBusy] = await Promise.all([
      getOutlookBusyTimes(rangeStart, rangeEnd),
      getGoogleBusyTimes(rangeStart, rangeEnd),
      getCohBusyTimes(rangeStart, rangeEnd),
    ])

    const allBusy = [...outlookBusy, ...googleBusy, ...cohBusy]
    const slots = computeAvailableSlots(localDate, allBusy)

    return NextResponse.json({
      date: dateParam,
      slots: slots.map((s) => s.toISOString()),
    })
  } catch (err) {
    console.error('Availability error:', err)
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
  }
}
