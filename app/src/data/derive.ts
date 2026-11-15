// SI-assisted (Claude), NASA Space Apps 2026
// Values the map derives from timeline.json and index.json. Nothing here invents a number: every value is a
// look of the data file, or a count of such looks.
import type { LakeEvent, LakeSummary, TimelineFile } from './types'
import { DAY_MS, ms } from '../lib/format'

export type RadarMode = 'either' | 'nisar' | 's1'

export interface Look {
  /** day index into timeline.days */
  d: number
  /** basin minus ring, dB (NISAR HH or Sentinel-1 VV) */
  c: number
  sensor: 'nisar' | 's1'
  orbit: string
}

export interface LakeLooks {
  nisar: Look[]
  s1: Look[]
  either: Look[]
  /** days with a valid optical scene, and its water share */
  optical: [number, number][]
  opticalCloudy: number[]
}

function flatten(byOrbit: Record<string, [number, number][]> | undefined, sensor: 'nisar' | 's1'): Look[] {
  const out: Look[] = []
  for (const [orbit, rows] of Object.entries(byOrbit ?? {})) for (const [d, c] of rows) out.push({ d, c, sensor, orbit })
  return out.sort((a, b) => a.d - b.d)
}

export function buildLooks(tl: TimelineFile): Map<string, LakeLooks> {
  const m = new Map<string, LakeLooks>()
  for (const [id, l] of Object.entries(tl.lakes)) {
    const nisar = flatten(l.nisar, 'nisar')
    const s1 = flatten(l.s1, 's1')
    const either = [...nisar, ...s1].sort((a, b) => a.d - b.d)
    m.set(id, { nisar, s1, either, optical: l.optical ?? [], opticalCloudy: l.optical_cloudy ?? [] })
  }
  return m
}

/** The latest look on or before `day` (arrays are sorted by day). */
export function latestAt(looks: Look[], day: number): Look | null {
  let lo = 0
  let hi = looks.length - 1
  let best = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (looks[mid].d <= day) {
      best = mid
      lo = mid + 1
    } else hi = mid - 1
  }
  return best >= 0 ? looks[best] : null
}

export function dayOf(iso: string, day0: string): number {
  return Math.floor((ms(iso) - ms(day0)) / DAY_MS)
}

export interface DatedEvent extends LakeEvent {
  lakeId: string
  /** day index of the "after" look */
  day: number
  dayBefore: number
}

export function datedEvents(lakes: LakeSummary[], day0: string): Map<string, DatedEvent[]> {
  const m = new Map<string, DatedEvent[]>()
  for (const l of lakes) {
    if (!l.events.length) continue
    m.set(
      l.id,
      l.events.map((e) => ({ ...e, lakeId: l.id, day: dayOf(e.after, day0), dayBefore: dayOf(e.before, day0) })),
    )
  }
  return m
}

export function eventsInWindow(ev: DatedEvent[] | undefined, from: number, to: number, mode: RadarMode): DatedEvent[] {
  if (!ev) return []
  return ev.filter((e) => e.day > from && e.day <= to && (mode === 'either' || e.sensor === mode))
}

export interface DayCounts {
  nisar: number[]
  s1: number[]
  optical: number[]
  opticalCloudy: number[]
  /** number of lakes counted */
  n: number
}

/** Per day: how many of the given lakes each sensor looked at. */
export function coverageOf(ids: string[], looks: Map<string, LakeLooks>, nDays: number): DayCounts {
  const z = () => new Array<number>(nDays).fill(0)
  const out: DayCounts = { nisar: z(), s1: z(), optical: z(), opticalCloudy: z(), n: ids.length }
  for (const id of ids) {
    const l = looks.get(id)
    if (!l) continue
    // a lake counts once per day and sensor, however many orbits passed
    let last = -1
    for (const k of l.nisar) if (k.d !== last && k.d >= 0 && k.d < nDays) out.nisar[(last = k.d)]++
    last = -1
    for (const k of l.s1) if (k.d !== last && k.d >= 0 && k.d < nDays) out.s1[(last = k.d)]++
    last = -1
    for (const [d] of l.optical) if (d !== last && d >= 0 && d < nDays) out.optical[(last = d)]++
    const valid = new Set(l.optical.map(([d]) => d))
    last = -1
    for (const d of l.opticalCloudy) if (d !== last && !valid.has(d) && d >= 0 && d < nDays) out.opticalCloudy[(last = d)]++
  }
  return out
}
