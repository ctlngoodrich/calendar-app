import { ClientSecretCredential } from '@azure/identity'

interface Interval {
  start: Date
  end: Date
}

interface BookingData {
  name: string
  email: string
  reason: string
  startTime: Date
  endTime: Date
}

function getCredential() {
  const tenantId = process.env.MICROSOFT_TENANT_ID!
  const clientId = process.env.MICROSOFT_CLIENT_ID!
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!
  return new ClientSecretCredential(tenantId, clientId, clientSecret)
}

async function getAccessToken(): Promise<string> {
  const credential = getCredential()
  const token = await credential.getToken('https://graph.microsoft.com/.default')
  return token.token
}

export async function getOutlookBusyTimes(start: Date, end: Date): Promise<Interval[]> {
  const userEmail = process.env.MICROSOFT_USER_EMAIL
  if (!userEmail || !process.env.MICROSOFT_CLIENT_ID) {
    console.warn('Outlook not configured, skipping')
    return []
  }

  try {
    const token = await getAccessToken()
    const startStr = start.toISOString()
    const endStr = end.toISOString()

    const url = `https://graph.microsoft.com/v1.0/users/${userEmail}/calendarView?startDateTime=${startStr}&endDateTime=${endStr}&$select=start,end,showAs&$top=100`

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      console.error('Outlook API error:', await res.text())
      return []
    }

    const data = await res.json()
    return data.value
      .filter((evt: { showAs: string }) => evt.showAs !== 'free')
      .map((evt: { start: { dateTime: string }; end: { dateTime: string } }) => ({
        start: new Date(evt.start.dateTime + 'Z'),
        end: new Date(evt.end.dateTime + 'Z'),
      }))
  } catch (err) {
    console.error('Error fetching Outlook busy times:', err)
    return []
  }
}

export async function createOutlookEvent(booking: BookingData): Promise<string | null> {
  const userEmail = process.env.MICROSOFT_USER_EMAIL
  if (!userEmail || !process.env.MICROSOFT_CLIENT_ID) return null

  try {
    const token = await getAccessToken()
    const body = {
      subject: `Meeting with ${booking.name}: ${booking.reason}`,
      start: {
        dateTime: booking.startTime.toISOString().replace('Z', ''),
        timeZone: 'UTC',
      },
      end: {
        dateTime: booking.endTime.toISOString().replace('Z', ''),
        timeZone: 'UTC',
      },
      attendees: [
        {
          emailAddress: { address: booking.email, name: booking.name },
          type: 'required',
        },
      ],
      body: {
        contentType: 'text',
        content: `Topic: ${booking.reason}\n\nBooked via calendar booking app.`,
      },
    }

    const res = await fetch(
      `https://graph.microsoft.com/v1.0/users/${userEmail}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    if (!res.ok) {
      console.error('Error creating Outlook event:', await res.text())
      return null
    }

    const evt = await res.json()
    return evt.id
  } catch (err) {
    console.error('Error creating Outlook event:', err)
    return null
  }
}
