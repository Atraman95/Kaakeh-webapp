"use client"

import { format } from "date-fns"
import { Plus, Clock, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { CalendarEvent } from "@/lib/calendar-types"
import { EVENT_TYPE_CONFIG } from "@/lib/calendar-types"
import { cn } from "@/lib/utils"

interface DaySidebarProps {
  selectedDate: Date
  events: CalendarEvent[]
  onCreateEvent: () => void
  onEditEvent: (event: CalendarEvent) => void
}

function formatTime(time: string) {
  const [h, m] = time.split(":")
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? "PM" : "AM"
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${hour12}:${m} ${ampm}`
}

export function DaySidebar({
  selectedDate,
  events,
  onCreateEvent,
  onEditEvent,
}: DaySidebarProps) {
  const dateStr = format(selectedDate, "yyyy-MM-dd")
  const dayEvents = events
    .filter((e) => e.date === dateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {format(selectedDate, "EEEE")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(selectedDate, "MMMM d, yyyy")}
          </p>
        </div>
        <Button size="sm" onClick={onCreateEvent} className="gap-1.5">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>

      {/* Events List */}
      <ScrollArea className="flex-1 px-3 py-3">
        {dayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <Clock className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No events scheduled
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Click the Add button to create one
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {dayEvents.map((ev) => {
              const config = EVENT_TYPE_CONFIG[ev.type]
              return (
                <button
                  key={ev.id}
                  onClick={() => onEditEvent(ev)}
                  className={cn(
                    "group relative flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-all hover:shadow-sm",
                    config.bg,
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "mt-0.5 size-2 shrink-0 rounded-full",
                          config.dot,
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-semibold leading-tight",
                          config.color,
                        )}
                      >
                        {ev.title}
                      </span>
                    </div>
                    <Pencil className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="flex items-center gap-1 pl-4 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {formatTime(ev.startTime)} &ndash; {formatTime(ev.endTime)}
                  </div>
                  {ev.description && (
                    <p className="line-clamp-2 pl-4 text-xs text-muted-foreground/80 leading-relaxed">
                      {ev.description}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Legend */}
      <div className="border-t border-border px-4 py-3">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Event Types
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {(Object.keys(EVENT_TYPE_CONFIG) as Array<keyof typeof EVENT_TYPE_CONFIG>).map(
            (key) => (
              <div key={key} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    EVENT_TYPE_CONFIG[key].dot,
                  )}
                />
                <span className="text-xs text-muted-foreground">
                  {EVENT_TYPE_CONFIG[key].label}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
