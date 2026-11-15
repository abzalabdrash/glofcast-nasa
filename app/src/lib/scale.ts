// SI-assisted (Claude), NASA Space Apps 2026
// The few scale helpers the charts need; no chart library.
import { DAY_MS, monthName } from './format'

export type Scale = (v: number) => number

export function linear(d0: number, d1: number, r0: number, r1: number): Scale {
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0)
  return (v) => r0 + (v - d0) * k
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

/** "Nice" ticks for a value axis. */
export function ticks(lo: number, hi: number, count = 5): number[] {
  const span = hi - lo
  if (span <= 0) return [lo]
  const raw = span / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6)
  return out
}

/** First day of each month inside [t0, t1], with labels. */
export function monthTicks(t0: number, t1: number): { t: number; label: string }[] {
  const out: { t: number; label: string }[] = []
  const d = new Date(t0)
  let y = d.getUTCFullYear()
  let m = d.getUTCMonth()
  for (;;) {
    const t = Date.UTC(y, m, 1)
    if (t > t1) break
    if (t >= t0) out.push({ t, label: monthName(m) })
    m += 1
    if (m > 11) {
      m = 0
      y += 1
    }
  }
  return out
}

/** Contrast (basin minus ring, dB) to colour: the darker the basin, the darker the dot. */
const RAMP: [number, [number, number, number]][] = [
  [0, [233, 228, 216]],
  [-2, [198, 211, 210]],
  [-4, [141, 176, 184]],
  [-6, [79, 135, 153]],
  [-8, [31, 90, 114]],
  [-10, [12, 50, 70]],
]
export const RAMP_STOPS = RAMP.map(([v]) => v)
export function contrastColor(c: number | null | undefined): string {
  if (c == null || Number.isNaN(c)) return 'transparent'
  const v = clamp(c, -10, 0)
  for (let i = 1; i < RAMP.length; i++) {
    const [a, ca] = RAMP[i - 1]
    const [b, cb] = RAMP[i]
    if (v >= b) {
      const t = (a - v) / (a - b)
      const mix = ca.map((x, k) => Math.round(x + (cb[k] - x) * t))
      return `rgb(${mix[0]} ${mix[1]} ${mix[2]})`
    }
  }
  return 'rgb(12 50 70)'
}

export function daysBetween(a: number, b: number): number {
  return (b - a) / DAY_MS
}
