"use client"

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from "date-fns"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/lib/calendar-types"
import { EVENT_TYPE_CONFIG } from "@/lib/calendar-types"

interface CalendarGridProps {
  currentMonth: Date
  selectedDate: Date
  events: CalendarEvent[]
  onSelectDate: (date: Date) => void
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function CalendarGrid({
  currentMonth,
  selectedDate,
  events,
  onSelectDate,
}: CalendarGridProps) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  function getEventsForDay(day: Date) {
    const dateStr = format(day, "yyyy-MM-dd")
    return events.filter((e) => e.date === dateStr)
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day Cells */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayEvents = getEventsForDay(day)
          const inCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = isSameDay(day, selectedDate)
          const today = isToday(day)

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(day)}
              className={cn(
                "relative flex min-h-[80px] flex-col items-start gap-1 border-b border-r border-border p-1.5 text-left transition-colors hover:bg-accent/50 md:min-h-[100px] md:p-2",
                !inCurrentMonth && "bg-muted/30",
                isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/20",
                // remove right border on last column
                (idx + 1) % 7 === 0 && "border-r-0",
              )}
              aria-label={`${format(day, "MMMM d, yyyy")}${dayEvents.length > 0 ? `, ${dayEvents.length} events` : ""}`}
              aria-pressed={isSelected}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-sm font-medium",
                  !inCurrentMonth && "text-muted-foreground/50",
                  inCurrentMonth && "text-foreground",
                  today &&
                    "bg-primary text-primary-foreground font-semibold",
                  isSelected && !today && "bg-accent text-accent-foreground",
                )}
              >
                {format(day, "d")}
              </span>

              {/* Event dots for mobile */}
              {dayEvents.length > 0 && (
                <div className="flex items-center gap-0.5 md:hidden">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <span
                      key={ev.id}
                      className={cn(
                        "size-1.5 rounded-full",
                        EVENT_TYPE_CONFIG[ev.type].dot,
                      )}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">
                      {`+${dayEvents.length - 3}`}
                    </span>
                  )}
                </div>
              )}

              {/* Event labels for desktop */}
              <div className="hidden w-full flex-col gap-0.5 md:flex">
                {dayEvents.slice(0, 2).map((ev) => (
                  <div
                    key={ev.id}
                    className={cn(
                      "flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] leading-tight font-medium border",
                      EVENT_TYPE_CONFIG[ev.type].bg,
                      EVENT_TYPE_CONFIG[ev.type].color,
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        EVENT_TYPE_CONFIG[ev.type].dot,
                      )}
                    />
                    <span className="truncate">{ev.title}</span>
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <span className="px-1 text-[10px] text-muted-foreground font-medium">
                    {`+${dayEvents.length - 2} more`}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
