"use client"

import { format } from "date-fns"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CalendarHeaderProps {
  currentMonth: Date
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

export function CalendarHeader({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 pb-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-lg bg-primary p-2">
          <CalendarDays className="size-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground text-balance">
            {format(currentMonth, "MMMM yyyy")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>
        <Button variant="ghost" size="icon" onClick={onPrevMonth} className="size-8">
          <ChevronLeft className="size-4" />
          <span className="sr-only">Previous month</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={onNextMonth} className="size-8">
          <ChevronRight className="size-4" />
          <span className="sr-only">Next month</span>
        </Button>
      </div>
    </header>
  )
}
