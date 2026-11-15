// SI-assisted (Claude), NASA Space Apps 2026
// The portrait of a lake: a real NISAR L-band frame with the catalogue outline, the latest one taken up to the end of
// the chosen week. Frames exist for the 117 lakes that have image tiles; the others have no portrait.
import type { CSSProperties } from 'react'
import { useLake } from '../data/load'
import type { NisarSprite } from '../data/types'
import { dayMonth, dayMonthYear, ms } from '../lib/format'

/** The orbit with the most clean frames, and in it the latest frame taken up to `until` (or the latest clean one). */
export function frameFor(sprites: NisarSprite[] | undefined, until?: string | null): { s: NisarSprite; i: number } | null {
  const usable = (sprites ?? []).filter((s) => s.dates.length > 0)
  if (!usable.length) return null
  const clean = (s: NisarSprite) => (s.cls ? s.cls.filter((c) => c === 'clean').length : s.dates.length)
  const s = [...usable].sort((a, b) => clean(b) - clean(a) || b.dates.length - a.dates.length)[0]
  let i = -1
  if (until) {
    const end = ms(until) + 86400000
    s.dates.forEach((d, k) => {
      if (ms(d) < end) i = k
    })
    i = Math.max(0, i)
  } else {
    i = s.dates.length - 1
    if (s.cls) for (let k = s.dates.length - 1; k >= 0; k--) if (s.cls[k] === 'clean') { i = k; break }
  }
  return { s, i }
}

export function tileStyle(base: string, s: NisarSprite, i: number): CSSProperties {
  const n = s.dates.length
  return {
    backgroundImage: `url("${base}${s.sprite}")`,
    backgroundSize: `${n * 100}% 100%`,
    backgroundPosition: n > 1 ? `${(i / (n - 1)) * 100}% 0` : '0 0',
  }
}

interface Props {
  id: string
  /** the lake has image frames */
  showcase: boolean
  /** ISO date: the frame shown is the latest one up to this day */
  until?: string | null
  size?: 'thumb' | 'card' | 'hero'
  /** print the date of the frame under it */
  stamp?: boolean
}

export function Portrait({ id, showcase, until, size = 'card', stamp }: Props) {
  const file = useLake(showcase ? id : null)
  if (!showcase) return null
  const f = file.status === 'ready' ? frameFor(file.data.frames?.nisar, until) : null
  const base = file.status === 'ready' ? file.base : ''
  if (file.status === 'ready' && !f) return null
  return (
    <figure className={`portrait portrait--${size}`}>
      <div
        className={`portrait__img${f ? '' : ' is-wait'}`}
        role="img"
        aria-label={f ? `NISAR L-band image of the lake, orbit ${f.s.orbit}, ${dayMonthYear(f.s.dates[f.i])}` : 'NISAR image of the lake, loading'}
        style={f ? { ...tileStyle(base, f.s, f.i), aspectRatio: `${f.s.tile_w} / ${f.s.tile_h}` } : undefined}
      >
        {f?.s.outline_px?.length ? (
          <svg viewBox={`0 0 ${f.s.tile_w} ${f.s.tile_h}`} preserveAspectRatio="none" aria-hidden="true">
            <polygon points={f.s.outline_px.map((p) => p.join(',')).join(' ')} />
          </svg>
        ) : null}
      </div>
      {stamp && f ? <figcaption>NISAR, {dayMonth(f.s.dates[f.i])}</figcaption> : null}
    </figure>
  )
}
