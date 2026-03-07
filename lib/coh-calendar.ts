import ical, { VEvent } from 'node-ical'

interface Interval {
  start: Date
  end: Date
}

export async function getCohBusyTimes(start: Date, end: Date): Promise<Interval[]> {
  const icsUrl = process.env.COH_ICS_URL
  if (!icsUrl) {
    console.warn('COH_ICS_URL not configured, skipping')
    return []
  }

  try {
    const events = await ical.async.fromURL(icsUrl)
    const busy: Interval[] = []

    for (const event of Object.values(events)) {
      if (!event || event.type !== 'VEVENT') continue
      const vevent = event as VEvent
      if (!vevent.start || !vevent.end) continue

      const evStart = new Date(vevent.start)
      const evEnd = new Date(vevent.end)
      const summary = vevent.summary ? String(vevent.summary) : ''

      // Skip "Following:" events (other people's calendars you're tracking)
      if (summary.startsWith('Following:')) continue

      // Skip events you declined
      const attendees = vevent.attendee
        ? (Array.isArray(vevent.attendee) ? vevent.attendee : [vevent.attendee])
        : []
      const me = (attendees as any[]).find((a: any) => {
        const val = (a?.params?.CN || a?.val || '').toLowerCase()
        return val.includes('cgoodrich') || val.includes('caitlin.goodrich')
      })
      if (me) {
        const partstat = (me?.params?.PARTSTAT || '').toUpperCase()
        if (partstat === 'DECLINED') continue
      }

      // Skip other people's multi-day OOO/PTO blocks (but NOT Caitlin's own)
      const durationDays = (evEnd.getTime() - evStart.getTime()) / (1000 * 60 * 60 * 24)
      const othersNames = ['CJ ', 'Jorge ', 'Swetha ', 'Aaron ', 'Sergei ']
      if (durationDays >= 1 && othersNames.some(n => summary.startsWith(n))) continue

      // Skip informational all-day events
      const lsum = summary.toLowerCase()
      if (lsum.includes('birthday') || lsum.includes('anniversary') || lsum === 'payday' || lsum.startsWith('save the date')) continue

      // Include event if it overlaps with our range
      if (evStart < end && evEnd > start) {
        busy.push({ start: evStart, end: evEnd })
      }
    }

    return busy
  } catch (err) {
    console.error('Error fetching COH ICS feed:', err)
    return []
  }
}
