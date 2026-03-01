'use client'

import { formatSlotPST, formatSlotEST } from '@/lib/availability'

interface TimeSlotsProps {
  dateLabel: string
  slots: Date[]
  loading: boolean
  onSelect: (slot: Date) => void
}

export default function TimeSlots({ dateLabel, slots, loading, onSelect }: TimeSlotsProps) {
  return (
    <div className="flex-1 pl-6">
      <h3 className="text-sm font-bold text-gray-900 mb-4 tracking-wide">{dateLabel}</h3>

      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="text-gray-400 text-sm py-8 text-center">
          No available slots on this day.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {slots.map((slot) => (
            <button
              key={slot.toISOString()}
              onClick={() => onSelect(slot)}
              className="border border-gray-200 rounded-lg px-4 py-3 text-left hover:border-blue-400 hover:bg-blue-50 transition-colors group"
            >
              <div className="text-sm font-medium text-gray-800 group-hover:text-blue-700">
                {formatSlotPST(slot)} PST
              </div>
              <div className="text-xs text-gray-400 group-hover:text-blue-500 mt-0.5">
                {formatSlotEST(slot)} EST
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
