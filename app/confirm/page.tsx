import { prisma } from '@/lib/db'
import { formatSlotPST, formatSlotEST } from '@/lib/availability'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import Link from 'next/link'

interface ConfirmPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const { id } = await searchParams
  let booking = null

  if (id) {
    booking = await prisma.booking.findUnique({ where: { id } })
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking not found</h1>
          <Link href="/book" className="text-blue-600 hover:underline">
            Back to booking
          </Link>
        </div>
      </div>
    )
  }

  const pst = toZonedTime(booking.startTime, 'America/Los_Angeles')
  const dateLabel = format(pst, 'EEEE, MMMM d, yyyy')
  const timePST = formatSlotPST(booking.startTime)
  const timeEST = formatSlotEST(booking.startTime)

  // Google Calendar add link
  const gcStart = format(toZonedTime(booking.startTime, 'UTC'), "yyyyMMdd'T'HHmmss'Z'")
  const gcEnd = format(toZonedTime(booking.endTime, 'UTC'), "yyyyMMdd'T'HHmmss'Z'")
  const gcUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Meeting')}&dates=${gcStart}/${gcEnd}`

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        {/* Checkmark */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re booked!</h1>
        <p className="text-gray-500 mb-6">
          A confirmation has been sent to {booking.email}.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Date</p>
            <p className="text-sm font-medium text-gray-800">{dateLabel}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Time</p>
            <p className="text-sm font-medium text-gray-800">
              {timePST} PST &nbsp;/&nbsp; {timeEST} EST (30 min)
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Topic</p>
            <p className="text-sm font-medium text-gray-800">{booking.reason}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <a
            href={gcUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2.5 text-sm font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Add to Google Calendar
          </a>
          <Link
            href="/book"
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors text-center"
          >
            Book another
          </Link>
        </div>
      </div>
    </div>
  )
}
