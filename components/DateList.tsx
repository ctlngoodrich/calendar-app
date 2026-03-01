'use client'

import { format } from 'date-fns'

interface DateEntry {
  date: Date
  count: number | null // null = loading
}

interface DateListProps {
  dates: DateEntry[]
  selectedDate: Date | null
  onSelect: (date: Date) => void
}

export default function DateList({ dates, selectedDate, onSelect }: DateListProps) {
  return (
    <div className="w-72 flex-shrink-0">
      <h3 className="text-xs font-bold text-gray-500 mb-3 tracking-widest uppercase">
        Select a Date
      </h3>
      <div className="space-y-1">
        {dates.map(({ date, count }) => {
          const isSelected =
            selectedDate?.toDateString() === date.toDateString()
          const dayLabel = format(date, 'EEEE, MMMM d')

          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelect(date)}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-sm font-medium">{dayLabel}</span>
              {count === null ? (
                <span className={`text-xs ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>
                  ...
                </span>
              ) : (
                <span
                  className={`text-xs ${
                    isSelected ? 'text-blue-200' : 'text-gray-400'
                  }`}
                >
                  {count} {count === 1 ? 'slot' : 'slots'}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
