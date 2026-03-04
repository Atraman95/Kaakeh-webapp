"use client"

import { useState, useCallback } from "react"
import { addMonths, subMonths, startOfMonth } from "date-fns"
import { CalendarHeader } from "@/components/calendar-header"
import { CalendarGrid } from "@/components/calendar-grid"
import { DaySidebar } from "@/components/day-sidebar"
import { EventFormDialog } from "@/components/event-form-dialog"
import { useEvents, useEventActions } from "@/lib/calendar-store"
import type { CalendarEvent } from "@/lib/calendar-types"

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  const events = useEvents()
  const { addEvent, updateEvent, deleteEvent } = useEventActions()

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((m) => subMonths(m, 1))
  }, [])

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((m) => addMonths(m, 1))
  }, [])

  const handleToday = useCallback(() => {
    const today = new Date()
    setCurrentMonth(startOfMonth(today))
    setSelectedDate(today)
  }, [])

  const handleSelectDate = useCallback((date: Date) => {
    setSelectedDate(date)
  }, [])

  const handleCreateEvent = useCallback(() => {
    setEditingEvent(null)
    setDialogOpen(true)
  }, [])

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    setEditingEvent(event)
    setDialogOpen(true)
  }, [])

  const handleSaveEvent = useCallback(
    (event: CalendarEvent) => {
      if (editingEvent) {
        updateEvent(event)
      } else {
        addEvent(event)
      }
    },
    [editingEvent, updateEvent, addEvent],
  )

  return (
    <main className="mx-auto flex min-h-screen max-w-[1440px] flex-col p-4 md:p-6 lg:p-8">
      <CalendarHeader
        currentMonth={currentMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        {/* Calendar Grid */}
        <div className="flex-1 min-w-0">
          <CalendarGrid
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            events={events}
            onSelectDate={handleSelectDate}
          />
        </div>

        {/* Day Detail Sidebar */}
        <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0">
          <DaySidebar
            selectedDate={selectedDate}
            events={events}
            onCreateEvent={handleCreateEvent}
            onEditEvent={handleEditEvent}
          />
        </div>
      </div>

      {/* Event Create / Edit Dialog */}
      <EventFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveEvent}
        onDelete={deleteEvent}
        event={editingEvent}
        defaultDate={selectedDate}
      />
    </main>
  )
}
