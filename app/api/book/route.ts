import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createOutlookEvent } from '@/lib/outlook'
import { sendBookingConfirmations } from '@/lib/email'
import { getOutlookBusyTimes } from '@/lib/outlook'
import { getGoogleBusyTimes } from '@/lib/google-calendar'
import { getCohBusyTimes } from '@/lib/coh-calendar'
import { addMinutes } from 'date-fns'

const SLOT_DURATION = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, reason, startTime: startTimeStr } = body

    if (!name || !email || !reason || !startTimeStr) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const startTime = new Date(startTimeStr)
    const endTime = addMinutes(startTime, SLOT_DURATION)

    // Double-check slot is still available
    const [outlookBusy, googleBusy, cohBusy] = await Promise.all([
      getOutlookBusyTimes(startTime, endTime),
      getGoogleBusyTimes(startTime, endTime),
      getCohBusyTimes(startTime, endTime),
    ])

    const allBusy = [...outlookBusy, ...googleBusy, ...cohBusy]
    const isConflict = allBusy.some(
      (b) => b.start < endTime && b.end > startTime
    )

    if (isConflict) {
      return NextResponse.json(
        { error: 'That time slot is no longer available. Please choose another.' },
        { status: 409 }
      )
    }

    // Create Outlook event
    const outlookId = await createOutlookEvent({ name, email, reason, startTime, endTime })

    // Save booking to database
    const booking = await prisma.booking.create({
      data: { name, email, reason, startTime, endTime, outlookId },
    })

    // Send confirmation emails (non-blocking)
    sendBookingConfirmations({ name, email, reason, startTime, endTime }).catch(
      (err) => console.error('Email error:', err)
    )

    return NextResponse.json({ success: true, bookingId: booking.id })
  } catch (err) {
    console.error('Booking error:', err)
    return NextResponse.json({ error: 'Booking failed. Please try again.' }, { status: 500 })
  }
}
