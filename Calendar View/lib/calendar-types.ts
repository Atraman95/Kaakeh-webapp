export type EventType = "work" | "personal" | "meeting" | "social" | "health"

export interface CalendarEvent {
  id: string
  title: string
  description: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  type: EventType
}

export const EVENT_TYPE_CONFIG: Record<
  EventType,
  { label: string; color: string; bg: string; dot: string }
> = {
  work: {
    label: "Work",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  personal: {
    label: "Personal",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  meeting: {
    label: "Meeting",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  social: {
    label: "Social",
    color: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500",
  },
  health: {
    label: "Health",
    color: "text-teal-700 dark:text-teal-300",
    bg: "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800",
    dot: "bg-teal-500",
  },
}
