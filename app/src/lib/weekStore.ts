// SI-assisted (Claude), NASA Space Apps 2026
// The week of the season that the visitor is looking at. One value shared by the landing page and the map,
// kept for the browser session so that going to the map and back does not lose the place.
import { useSyncExternalStore } from 'react'

const KEY = 'lakes.week'
let week: number | null = null
try {
  const v = window.sessionStorage.getItem(KEY)
  if (v != null && v !== '') week = Number(v)
} catch {
  /* storage can be blocked; the value then lives in memory only */
}
const listeners = new Set<() => void>()

export function setWeek(w: number) {
  if (w === week) return
  week = w
  try {
    window.sessionStorage.setItem(KEY, String(w))
  } catch {
    /* see above */
  }
  listeners.forEach((f) => f())
}

/** The chosen week index, or null when the visitor has not chosen one yet. */
export function useWeek(): number | null {
  return useSyncExternalStore(
    (f) => {
      listeners.add(f)
      return () => listeners.delete(f)
    },
    () => week,
  )
}

export function getWeek(): number | null {
  return week
}
