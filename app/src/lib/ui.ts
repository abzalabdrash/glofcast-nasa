// SI-assisted (Claude), NASA Space Apps 2026
// Small shared pieces of interface state: the width class of the screen, the command palette, the opening week.
import { useEffect, useState, useSyncExternalStore } from 'react'
import type { PassportFile, Week } from '../data/types'

function useMedia(query: string): boolean {
  const [on, setOn] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const q = window.matchMedia(query)
    const f = () => setOn(q.matches)
    f()
    q.addEventListener('change', f)
    return () => q.removeEventListener('change', f)
  }, [query])
  return on
}

/** One hand, a sheet instead of a side panel. */
export const usePhone = () => useMedia('(max-width: 899px)')
export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)')

// ----- the command palette is opened from the top bar, from the keyboard and from the landing page -----
let paletteOpen = false
const listeners = new Set<() => void>()
export function setPalette(open: boolean) {
  if (open === paletteOpen) return
  paletteOpen = open
  listeners.forEach((f) => f())
}
export function usePalette(): boolean {
  return useSyncExternalStore(
    (f) => {
      listeners.add(f)
      return () => listeners.delete(f)
    },
    () => paletteOpen,
  )
}

/** The week the replay opens on: the earliest week with the most lakes listed for more than one reason. */
export function openingWeek(weeks: Week[]): number {
  const strong = (w: Week) => w.listed.filter((l) => l.reasons.length > 1).length
  let best = 0
  weeks.forEach((w, i) => {
    if (strong(w) > strong(weeks[best]) || (strong(w) === strong(weeks[best]) && w.listed.length > weeks[best].listed.length && strong(w) > 0)) best = i
  })
  return best
}

/** The name a lake is shown under: a name from the passport file (agency report or OpenStreetMap), else its id. */
export function lakeName(id: string, pass: PassportFile['lakes'] | null | undefined, fallback?: string | null): string {
  return pass?.[id]?.name ?? fallback ?? id
}

/** Apple platforms show the Command key, the others Ctrl. */
export const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '')
