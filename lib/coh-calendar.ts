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
