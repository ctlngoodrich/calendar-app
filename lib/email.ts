import nodemailer from 'nodemailer'
import { formatSlotPST, formatSlotEST } from './availability'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

interface BookingEmailData {
  name: string
  email: string
  reason: string
  startTime: Date
  endTime: Date
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

function formatDateFull(date: Date): string {
  const pst = toZonedTime(date, 'America/Los_Angeles')
  return format(pst, 'EEEE, MMMM d, yyyy')
}

export async function sendBookingConfirmations(booking: BookingEmailData) {
  if (!process.env.SMTP_USER) {
    console.warn('SMTP not configured, skipping emails')
    return
  }

  const transporter = createTransporter()
  const dateFull = formatDateFull(booking.startTime)
  const timePST = formatSlotPST(booking.startTime)
  const timeEST = formatSlotEST(booking.startTime)

  // Email to the booker
  await transporter.sendMail({
    from: `"Meeting Scheduler" <${process.env.SMTP_USER}>`,
    to: booking.email,
    subject: `Your meeting is confirmed – ${dateFull}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2>Meeting Confirmed!</h2>
        <p>Hi ${booking.name},</p>
        <p>Your meeting has been confirmed for:</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <strong>${dateFull}</strong><br/>
          ${timePST} PST / ${timeEST} EST (30 min)
        </div>
        <p><strong>Topic:</strong> ${booking.reason}</p>
        <p>You'll receive a calendar invitation shortly. Looking forward to connecting!</p>
      </div>
    `,
  })

  // Email to the host
  await transporter.sendMail({
    from: `"Meeting Scheduler" <${process.env.SMTP_USER}>`,
    to: process.env.YOUR_EMAIL,
    subject: `New booking: ${booking.name} – ${dateFull} at ${timePST}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2>New Meeting Booked</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; font-weight: bold;">Name</td><td style="padding: 8px;">${booking.name}</td></tr>
          <tr style="background:#f5f5f5;"><td style="padding: 8px; font-weight: bold;">Email</td><td style="padding: 8px;">${booking.email}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Date</td><td style="padding: 8px;">${dateFull}</td></tr>
          <tr style="background:#f5f5f5;"><td style="padding: 8px; font-weight: bold;">Time</td><td style="padding: 8px;">${timePST} PST / ${timeEST} EST</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Topic</td><td style="padding: 8px;">${booking.reason}</td></tr>
        </table>
      </div>
    `,
  })
}
