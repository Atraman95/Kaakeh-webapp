import { useSyncExternalStore, useCallback } from "react"
import type { CalendarEvent } from "./calendar-types"

type Listener = () => void

let events: CalendarEvent[] = getSampleEvents()
let listeners: Set<Listener> = new Set()

function emitChange() {
  listeners.forEach((l) => l())
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return events
}

export function useEvents() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useEventActions() {
  const addEvent = useCallback((event: CalendarEvent) => {
    events = [...events, event]
    emitChange()
  }, [])

  const updateEvent = useCallback((updated: CalendarEvent) => {
    events = events.map((e) => (e.id === updated.id ? updated : e))
    emitChange()
  }, [])

  const deleteEvent = useCallback((id: string) => {
    events = events.filter((e) => e.id !== id)
    emitChange()
  }, [])

  return { addEvent, updateEvent, deleteEvent }
}

function getSampleEvents(): CalendarEvent[] {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, "0")

  return [
    {
      id: "1",
      title: "Team Standup",
      description: "Daily sync with the engineering team",
      date: `${y}-${m}-${String(today.getDate()).padStart(2, "0")}`,
      startTime: "09:00",
      endTime: "09:30",
      type: "meeting",
    },
    {
      id: "2",
      title: "Project Review",
      description: "Q1 project milestone review with stakeholders",
      date: `${y}-${m}-${String(today.getDate()).padStart(2, "0")}`,
      startTime: "14:00",
      endTime: "15:30",
      type: "work",
    },
    {
      id: "3",
      title: "Lunch with Sarah",
      description: "Catch up at the new Italian place downtown",
      date: `${y}-${m}-${String(Math.min(today.getDate() + 1, 28)).padStart(2, "0")}`,
      startTime: "12:00",
      endTime: "13:00",
      type: "social",
    },
    {
      id: "4",
      title: "Gym Session",
      description: "Upper body workout and 20 min cardio",
      date: `${y}-${m}-${String(Math.min(today.getDate() + 2, 28)).padStart(2, "0")}`,
      startTime: "07:00",
      endTime: "08:00",
      type: "health",
    },
    {
      id: "5",
      title: "Read & Journal",
      description: "Evening wind-down routine",
      date: `${y}-${m}-${String(Math.min(today.getDate() + 2, 28)).padStart(2, "0")}`,
      startTime: "20:00",
      endTime: "21:00",
      type: "personal",
    },
    {
      id: "6",
      title: "Sprint Planning",
      description: "Plan next sprint tasks and assign story points",
      date: `${y}-${m}-${String(Math.min(today.getDate() + 4, 28)).padStart(2, "0")}`,
      startTime: "10:00",
      endTime: "11:30",
      type: "meeting",
    },
    {
      id: "7",
      title: "Design Workshop",
      description: "Collaborative session on the new dashboard UI",
      date: `${y}-${m}-${String(Math.min(today.getDate() + 5, 28)).padStart(2, "0")}`,
      startTime: "13:00",
      endTime: "15:00",
      type: "work",
    },
  ]
}
