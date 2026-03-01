'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getBusinessDays, formatDateHeader } from '@/lib/availability'
import DateList from './DateList'
import TimeSlots from './TimeSlots'
import BookingModal from './BookingModal'

interface DateEntry {
  date: Date
  count: number | null
}

export default function BookingPage() {
  const router = useRouter()
  const businessDays = getBusinessDays(new Date(), 14)

  const [dates, setDates] = useState<DateEntry[]>(
    businessDays.map((d) => ({ date: d, count: null }))
  )
  const [selectedDate, setSelectedDate] = useState<Date>(businessDays[0])
  const [slots, setSlots] = useState<Date[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null)

  function formatDateParam(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const loadSlots = useCallback(async (date: Date) => {
    setSlotsLoading(true)
    try {
      const res = await fetch(`/api/availability?date=${formatDateParam(date)}`)
      const data = await res.json()
      const parsed: Date[] = (data.slots || []).map((s: string) => new Date(s))
      setSlots(parsed)

      // Update the count in the dates list
      setDates((prev) =>
        prev.map((entry) =>
          entry.date.toDateString() === date.toDateString()
            ? { ...entry, count: parsed.length }
            : entry
        )
      )
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }, [])

  // Load all date counts in background
  useEffect(() => {
    businessDays.forEach((date, i) => {
      setTimeout(() => {
        fetch(`/api/availability?date=${formatDateParam(date)}`)
          .then((r) => r.json())
          .then((data) => {
            const count = (data.slots || []).length
            setDates((prev) =>
              prev.map((entry) =>
                entry.date.toDateString() === date.toDateString()
                  ? { ...entry, count }
                  : entry
              )
            )
          })
          .catch(() => {})
      }, i * 200) // stagger requests
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load slots whenever selected date changes
  useEffect(() => {
    loadSlots(selectedDate)
  }, [selectedDate, loadSlots])

  function handleDateSelect(date: Date) {
    setSelectedDate(date)
    setSelectedSlot(null)
  }

  function handleBooked(bookingId: string) {
    router.push(`/confirm?id=${bookingId}`)
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900">Book a Meeting</h1>
            <p className="text-gray-500 mt-2">
              Pick a time that works for you. Times shown in PST / EST.
            </p>
          </div>

          {/* Calendar picker card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex gap-6">
            {/* Left: date list */}
            <DateList
              dates={dates}
              selectedDate={selectedDate}
              onSelect={handleDateSelect}
            />

            {/* Divider */}
            <div className="w-px bg-gray-100 flex-shrink-0" />

            {/* Right: time slots */}
            <TimeSlots
              dateLabel={formatDateHeader(selectedDate)}
              slots={slots}
              loading={slotsLoading}
              onSelect={(slot) => setSelectedSlot(slot)}
            />
          </div>
        </div>
      </div>

      {/* Booking modal */}
      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onBooked={handleBooked}
        />
      )}
    </>
  )
}
