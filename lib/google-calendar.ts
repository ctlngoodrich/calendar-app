import { google } from 'googleapis'

interface Interval {
  start: Date
  end: Date
}

function getOAuth2Client() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
  return client
}

export async function getGoogleBusyTimes(start: Date, end: Date): Promise<Interval[]> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
    console.warn('Google Calendar not configured, skipping')
    return []
  }

  try {
    const auth = getOAuth2Client()
    const calendar = google.calendar({ version: 'v3', auth })
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'

    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        items: [{ id: calendarId }],
      },
    })

    const busy = res.data.calendars?.[calendarId]?.busy || []
    return busy.map((b) => ({
      start: new Date(b.start!),
      end: new Date(b.end!),
    }))
  } catch (err) {
    console.error('Error fetching Google busy times:', err)
    return []
  }
}
