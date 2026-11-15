// SI-assisted (Claude), NASA Space Apps 2026
// NISAR frames of one orbit as a scrubbable strip, the optical frame nearest to the chosen look, and a
// before/after slider between two looks of the same orbit.
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { LakeEvent, NisarSprite, OpticalFrame } from '../data/types'
import { dayMonth, dayMonthYear, dayTime, db, ms, pct } from '../lib/format'

interface Props {
  sprites: NisarSprite[]
  optical: OpticalFrame[]
  events: LakeEvent[]
  base: string
}

function tileStyle(base: string, s: NisarSprite, i: number): CSSProperties {
  const n = s.dates.length
  return {
    backgroundImage: `url("${base}${s.sprite}")`,
    backgroundSize: `${n * 100}% 100%`,
    backgroundPosition: n > 1 ? `${(i / (n - 1)) * 100}% 0` : '0 0',
    aspectRatio: `${s.tile_w} / ${s.tile_h}`,
  }
}

function Outline({ s }: { s: NisarSprite }) {
  if (!s.outline_px?.length) return null
  return (
    <svg className="frame__outline" viewBox={`0 0 ${s.tile_w} ${s.tile_h}`} preserveAspectRatio="none" aria-hidden="true">
      <polygon points={s.outline_px.map((p) => p.join(',')).join(' ')} />
    </svg>
  )
}

function gapText(h: number): string {
  const a = Math.abs(h)
  const amount = a < 36 ? `${Math.round(a)} h` : `${(a / 24).toFixed(1)} days`
  return h < 0 ? `${amount} before the radar look` : `${amount} after the radar look`
}

export function FrameViewer({ sprites, optical, events, base }: Props) {
  const usable = useMemo(() => sprites.filter((s) => s.dates.length > 0), [sprites])
  // start on the orbit with a NISAR step if there is one, else on the orbit with most frames
  const initialOrbit = useMemo(() => {
    const withStep = events.find((e) => e.sensor === 'nisar' && usable.some((s) => s.orbit === e.orbit))
    if (withStep) return withStep.orbit
    return [...usable].sort((a, b) => b.dates.length - a.dates.length)[0]?.orbit ?? ''
  }, [usable, events])
  const [orbit, setOrbit] = useState(initialOrbit)
  const sprite = usable.find((s) => s.orbit === orbit) ?? usable[0]
  const n = sprite?.dates.length ?? 0

  const defaults = useMemo(() => {
    if (!sprite) return { a: 0, b: 0 }
    const e = events.find((ev) => ev.sensor === 'nisar' && ev.orbit === sprite.orbit)
    if (e) {
      const a = sprite.dates.indexOf(e.before)
      const b = sprite.dates.indexOf(e.after)
      if (a >= 0 && b >= 0) return { a, b }
    }
    return { a: 0, b: sprite.dates.length - 1 }
  }, [sprite, events])

  const [i, setI] = useState(defaults.b)
  const [a, setA] = useState(defaults.a)
  const [b, setB] = useState(defaults.b)
  const [split, setSplit] = useState(50)
  const [outline, setOutline] = useState(true)
  useEffect(() => {
    setI(defaults.b)
    setA(defaults.a)
    setB(defaults.b)
  }, [defaults])

  if (!sprite || n === 0) return <p className="muted">No NISAR frames for this lake.</p>
  const idx = Math.min(i, n - 1)
  const date = sprite.dates[idx]
  const cls = sprite.cls?.[idx]
  // the optical frame that the data file pairs with this look; otherwise the nearest one within three days
  const opt =
    optical.find((o) => o.nearest_nisar === date) ??
    optical
      .filter((o) => Math.abs(ms(o.t) - ms(date)) <= 3 * 86400000)
      .sort((p, q) => Math.abs(ms(p.t) - ms(date)) - Math.abs(ms(q.t) - ms(date)))[0]
  const gap = opt ? (opt.gap_h ?? (ms(opt.t) - ms(date)) / 3600000) : null
  // a tile is shown at most 380 px high, whatever its shape
  const tileW = Math.round((380 * sprite.tile_w) / sprite.tile_h)

  return (
    <div className="frames">
      <div className="frames__bar">
        <div className="seg" role="group" aria-label="NISAR orbit">
          {usable.map((s) => (
            <button key={s.orbit} type="button" aria-pressed={s.orbit === sprite.orbit} onClick={() => setOrbit(s.orbit)}>
              Orbit {s.orbit}
            </button>
          ))}
        </div>
        <label className="check">
          <input type="checkbox" checked={outline} onChange={(e) => setOutline(e.target.checked)} /> Catalogue outline
        </label>
      </div>

      <div className="frames__pair" style={{ maxWidth: 2 * tileW + 12 }}>
        <figure className="frame">
          <div className="frame__img" style={tileStyle(base, sprite, idx)} role="img" aria-label={`NISAR HH backscatter, orbit ${sprite.orbit}, ${dayTime(date)}`}>
            {outline ? <Outline s={sprite} /> : null}
          </div>
          <figcaption>
            <b>L-band, NISAR HH</b>, orbit {sprite.orbit}, {dayTime(date)}
            {cls === 'swath_edge' ? '. Swath-edge look: weaker radiometry, shown but not used as a clean look' : ''}. Grey scale{' '}
            {db(sprite.stretch_db[0], 0).replace(' dB', '')} to {db(sprite.stretch_db[1], 0)}; dark = little signal back to the radar.
          </figcaption>
        </figure>
        <figure className="frame">
          {opt ? (
            <div className="frame__img" style={{ aspectRatio: `${sprite.tile_w} / ${sprite.tile_h}` }}>
              <img src={`${base}${opt.file}`} alt={`Sentinel-2 true colour, ${dayTime(opt.t)}`} loading="lazy" />
              {outline ? <Outline s={sprite} /> : null}
            </div>
          ) : (
            <div className="frame__img frame__img--none" style={{ aspectRatio: `${sprite.tile_w} / ${sprite.tile_h}` }}>
              <span>No Sentinel-2 pass within 3 days of this look</span>
            </div>
          )}
          <figcaption>
            <b>Optics, Sentinel-2</b>
            {opt ? (
              <>
                , {dayTime(opt.t)}{gap != null ? `, ${gapText(gap)}` : ''}. Clear share of the basin {pct(opt.clear)}
                {opt.valid === false ? '; not a valid scene by the fixed rule (cloud or low sun)' : ''}.
              </>
            ) : (
              '. The radar look has no optical companion.'
            )}
          </figcaption>
        </figure>
      </div>

      <div className="frames__scrub" style={{ maxWidth: Math.max(2 * tileW + 12, 420) }}>
        <input
          type="range"
          min={0}
          max={n - 1}
          step={1}
          value={idx}
          onChange={(e) => setI(Number(e.target.value))}
          aria-label={`NISAR look of orbit ${sprite.orbit}`}
          aria-valuetext={dayMonthYear(date)}
        />
        <ol className="filmstrip" aria-label="All frames of this orbit">
          {sprite.dates.map((d, k) => (
            <li key={d}>
              <button type="button" className={k === idx ? 'is-on' : undefined} onClick={() => setI(k)} aria-current={k === idx ? 'true' : undefined}>
                <span className="filmstrip__img" style={tileStyle(base, sprite, k)} />
                <span className={`filmstrip__date${sprite.cls?.[k] === 'swath_edge' ? ' is-edge' : ''}`}>{dayMonth(d)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="compare" style={{ maxWidth: Math.max(tileW, 300) }}>
        <div className="compare__head">
          <h3 className="h3">Before and after, same orbit</h3>
          <div className="compare__pick">
            <label>
              <span className="sr-only">Before</span>
              <select value={a} onChange={(e) => setA(Number(e.target.value))}>
                {sprite.dates.map((d, k) => <option key={d} value={k}>{dayMonth(d)}</option>)}
              </select>
            </label>
            <span aria-hidden="true">→</span>
            <label>
              <span className="sr-only">After</span>
              <select value={b} onChange={(e) => setB(Number(e.target.value))}>
                {sprite.dates.map((d, k) => <option key={d} value={k}>{dayMonth(d)}</option>)}
              </select>
            </label>
          </div>
        </div>
        <div className="compare__stage" style={{ aspectRatio: `${sprite.tile_w} / ${sprite.tile_h}` }}>
          <div className="compare__layer" style={tileStyle(base, sprite, Math.min(b, n - 1))} />
          <div className="compare__layer" style={{ ...tileStyle(base, sprite, Math.min(a, n - 1)), clipPath: `inset(0 ${100 - split}% 0 0)` }} />
          {outline ? <Outline s={sprite} /> : null}
          <span className="compare__tag compare__tag--a">{dayMonth(sprite.dates[Math.min(a, n - 1)])}</span>
          <span className="compare__tag compare__tag--b">{dayMonth(sprite.dates[Math.min(b, n - 1)])}</span>
          <span className="compare__line" style={{ left: `${split}%` }} aria-hidden="true" />
          <input
            className="compare__range"
            type="range"
            min={0}
            max={100}
            value={split}
            onChange={(e) => setSplit(Number(e.target.value))}
            aria-label="Position of the divider between the earlier and the later frame"
          />
        </div>
      </div>
    </div>
  )
}
