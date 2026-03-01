import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import ical from 'ical-generator'
import { format } from 'date-fns'

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { startTime: 'asc' },
    })

    const calendar = ical({
      name: 'My Booked Meetings',
      description: 'Auto-generated feed of booked meetings — subscribe in your calendar app',
      prodId: { company: 'CalendarBooking', product: 'BookingFeed' },
    })

    for (const booking of bookings) {
      calendar.createEvent({
        id: booking.id,
        start: booking.startTime,
        end: booking.endTime,
        summary: `Meeting: ${booking.name}`,
        description: `Booked by: ${booking.name} (${booking.email})\nTopic: ${booking.reason}`,
        created: booking.createdAt,
      })
    }

    return new NextResponse(calendar.toString(), {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="bookings.ics"',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('ICS feed error:', err)
    return NextResponse.json({ error: 'Failed to generate feed' }, { status: 500 })
  }
}
