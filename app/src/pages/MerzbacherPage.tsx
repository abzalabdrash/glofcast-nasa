// SI-assisted (Claude), NASA Space Apps 2026
// Merzbacher 2026: the drainage of an ice-dammed lake as frames, as a curve and as the bracket each sensor set
// puts around it. Every date and number is read from merzbacher.json.
import { useEffect, useMemo, useState } from 'react'
import { useMerzbacher } from '../data/load'
import type { MerzFile } from '../data/types'
import { DAY_MS, dayMonth, dayTime, ms, num } from '../lib/format'
import { linear, monthTicks, ticks } from '../lib/scale'
import { useWidth } from '../lib/useWidth'
import { MERZBACHER_TEXT } from '../content/blocks'
import { Prose } from '../components/Prose'

type Extra = MerzFile & {
  earlier_years?: { year: number; database?: [string, string] | null }[]
  frames: MerzFile['frames'] & { size_px?: number; basin_polygon_px?: [number, number][] }
}

const STATE_LABEL: Record<string, string> = { full: 'full', partial: 'draining', empty: 'empty', unclear: 'unclear' }
const ORBIT_COLORS: Record<number, string> = { 0: '#1c6787', 1: '#4a9cc0', 2: '#0d3c52' }
const S1_COLORS = ['#8a6540', '#b98d58', '#5c4024']

function days(v: number): string {
  return `${v.toFixed(v < 2 ? 2 : 1)} days`
}

function gapText(h: number): string {
  const a = Math.abs(h)
  const amount = a < 36 ? `${Math.round(a)} h` : `${(a / 24).toFixed(1)} days`
  return `${amount} ${h < 0 ? 'before' : 'after'} the radar look`
}

/** One bar per sensor set, from the last look that saw the lake full to the earliest look that saw it empty. */
function Brackets({ m }: { m: MerzFile }) {
  const [ref, width] = useWidth<HTMLDivElement>(800)
  const rows = m.intervals
  if (!rows.length) return null
  const labelW = width < 560 ? 0 : 230
  const t0 = Math.min(...rows.map((r) => ms(r.last_full))) - 1.5 * DAY_MS
  const t1 = Math.max(...rows.map((r) => ms(r.first_empty))) + 1.5 * DAY_MS
  const x = linear(t0, t1, labelW + 8, width - 64)
  const rowH = labelW ? 30 : 46
  const top = 8
  const h = top + rows.length * rowH + 22
  const dayTicks: number[] = []
  for (let t = Math.ceil(t0 / DAY_MS) * DAY_MS; t <= t1; t += DAY_MS) dayTicks.push(t)
  const every = dayTicks.length > 14 ? 2 : 1
  const best = Math.min(...rows.map((r) => r.full_to_empty_days))
  return (
    <div ref={ref}>
      <svg width={width} height={h} role="img" aria-label={`Width of the bracket around the drainage, per sensor set: ${rows.map((r) => `${r.set}, ${days(r.full_to_empty_days)}`).join('; ')}.`}>
        {dayTicks.map((t, i) => (
          <g key={t}>
            <line className="chart__grid" x1={x(t)} x2={x(t)} y1={top} y2={h - 20} />
            {i % every === 0 ? <text className="chart__xtick" x={x(t) + 3} y={h - 6}>{dayMonth(t)}</text> : null}
          </g>
        ))}
        {rows.map((r, i) => {
          const y = top + i * rowH + (labelW ? rowH / 2 : rowH - 12)
          const xa = x(ms(r.last_full))
          const xb = x(ms(r.first_empty))
          const tight = r.full_to_empty_days === best
          return (
            <g key={r.set}>
              <text className="bracket__label" x={labelW ? labelW : 8} y={labelW ? y + 4 : y - 14} textAnchor={labelW ? 'end' : 'start'}>{r.set}</text>
              <line className={tight ? 'bracket__bar bracket__bar--tight' : 'bracket__bar'} x1={xa} x2={Math.max(xb, xa + 2)} y1={y} y2={y} />
              <circle className="bracket__full" cx={xa} cy={y} r={4.5} />
              <circle className="bracket__empty" cx={xb} cy={y} r={4.5} />
              <text className="bracket__days" x={xb + 10} y={y + 4}>{days(r.full_to_empty_days)}</text>
            </g>
          )
        })}
      </svg>
      <p className="small muted bracket__key">
        <span><i className="bracket__dot bracket__dot--full" /> last look that saw the lake full</span>
        <span><i className="bracket__dot bracket__dot--empty" /> earliest look that saw it empty</span>
      </p>
    </div>
  )
}

/** Radar-dark area inside the basin per look, each orbit its own line; optical states as a row of marks. */
function Curve({ m }: { m: MerzFile }) {
  const [ref, width] = useWidth<HTMLDivElement>(900)
  const nisarOrbits = [...new Set(m.curve.nisar.map((r) => r.orbit))].sort()
  const s1Orbits = [...new Set(m.curve.s1.map((r) => r.orbit))].sort()
  const all = [...m.curve.nisar.map((r) => r.t), ...m.curve.s1.map((r) => r.t), ...m.curve.optical.map((r) => r.t)].map(ms)
  if (!all.length) return null
  const t0 = Math.min(...all)
  const t1 = Math.max(...all)
  const vals = [...m.curve.nisar.map((r) => r.hh_ha), ...m.curve.s1.map((r) => r.vv_ha)].filter((v): v is number => v != null)
  const vmax = Math.max(10, ...vals)
  const L = 46
  const plotW = Math.max(120, width - L - 14)
  const x = linear(t0, t1, L, L + plotW)
  const optY = 22
  const top = 74
  const H = 220
  const y = linear(0, vmax * 1.08, top + H, top)
  const path = (rows: { t: string; v: number | null }[]) =>
    rows.filter((r) => r.v != null).map((r, i) => `${i ? 'L' : 'M'}${x(ms(r.t)).toFixed(1)} ${y(r.v!).toFixed(1)}`).join(' ')
  const tight = [...m.intervals].sort((a, b) => a.full_to_empty_days - b.full_to_empty_days)[0]
  return (
    <div ref={ref}>
      <svg width={width} height={top + H + 26} role="img" aria-label="Radar-dark area inside the basin per look and orbit for NISAR HH and Sentinel-1 VV, with the state seen in each optical scene along the top.">
        <text className="chart__title" x={L} y={12}>
          <tspan fill="var(--optical)">Optics</tspan>
          <tspan className="chart__sub" dx="8">{width < 600 ? 'filled full, hollow empty' : 'state seen in each scene: filled = full, hollow = empty, tick = unclear'}</tspan>
        </text>
        {m.curve.optical.map((r, i) => {
          const px = x(ms(r.t))
          if (r.state === 'unclear') return <line key={i} className="chart__cloud" x1={px} x2={px} y1={optY + 4} y2={optY + 10} />
          return <circle key={i} cx={px} cy={optY + 7} r={3.4} fill={r.state === 'full' ? 'var(--optical)' : r.state === 'partial' ? 'rgb(85 99 58 / 0.4)' : 'var(--surface)'} stroke="var(--optical)" strokeWidth={1.3} />
        })}
        <text className="chart__title" x={L} y={top - 8}>
          <tspan>Radar-dark area inside the basin</tspan>
          <tspan className="chart__sub" dx="8">{width < 600 ? 'ha, not lake area' : 'hectares; NISAR HH and Sentinel-1 VV, each orbit its own line; this is not lake area'}</tspan>
        </text>
        <rect className="chart__panel" x={L} y={top} width={plotW} height={H} />
        {tight ? (
          <rect className="chart__event" x={x(ms(tight.last_full))} y={optY} width={Math.max(2, x(ms(tight.first_empty)) - x(ms(tight.last_full)))} height={top + H - optY} />
        ) : null}
        {ticks(0, vmax, 5).map((v) => (
          <g key={v}>
            <line className="chart__grid" x1={L} x2={L + plotW} y1={y(v)} y2={y(v)} />
            <text className="chart__ytick" x={L - 8} y={y(v) + 3.5} textAnchor="end">{v}</text>
          </g>
        ))}
        {monthTicks(t0, t1).map((t) => (
          <g key={t.t}>
            <line className="chart__grid" x1={x(t.t)} x2={x(t.t)} y1={top} y2={top + H} />
            <text className="chart__xtick" x={x(t.t) + 4} y={top + H + 16}>{t.label}</text>
          </g>
        ))}
        {s1Orbits.map((o, i) => {
          const rows = m.curve.s1.filter((r) => r.orbit === o)
          return (
            <g key={`s${o}`}>
              <path d={path(rows.map((r) => ({ t: r.t, v: r.vv_ha })))} fill="none" stroke={S1_COLORS[i % 3]} strokeWidth={1.4} strokeDasharray="5 3" />
              {rows.map((r, k) => (r.vv_ha != null ? <rect key={k} x={x(ms(r.t)) - 3} y={y(r.vv_ha) - 3} width={6} height={6} fill={S1_COLORS[i % 3]} /> : null))}
            </g>
          )
        })}
        {nisarOrbits.map((o, i) => {
          const rows = m.curve.nisar.filter((r) => r.orbit === o)
          return (
            <g key={`n${o}`}>
              <path d={path(rows.map((r) => ({ t: r.t, v: r.hh_ha })))} fill="none" stroke={ORBIT_COLORS[i % 3]} strokeWidth={1.6} />
              {rows.map((r, k) => (r.hh_ha != null ? <circle key={k} cx={x(ms(r.t))} cy={y(r.hh_ha)} r={3.6} fill={ORBIT_COLORS[i % 3]} /> : null))}
            </g>
          )
        })}
      </svg>
      <ul className="curve__key small">
        {nisarOrbits.map((o, i) => (
          <li key={o}><i style={{ background: ORBIT_COLORS[i % 3] }} /> L-band {o}{m.orbit_note?.[o] ? <span className="muted">: {m.orbit_note[o]}</span> : null}</li>
        ))}
        {s1Orbits.map((o, i) => (
          <li key={o}><i className="sq" style={{ background: S1_COLORS[i % 3] }} /> C-band {o}</li>
        ))}
        {tight ? <li><i className="band" /> bracket of {tight.set}: {dayTime(tight.last_full)} to {dayTime(tight.first_empty)}</li> : null}
      </ul>
    </div>
  )
}

function EarlierYears({ m }: { m: Extra }) {
  const [ref, width] = useWidth<HTMLDivElement>(700)
  const rows = (m.earlier_years ?? []).filter((r) => r.database?.length === 2)
  const tight = [...m.intervals].sort((a, b) => a.full_to_empty_days - b.full_to_empty_days)[0]
  if (!rows.length) return null
  const doy = (iso: string) => (ms(iso) - Date.UTC(Number(iso.slice(0, 4)), 0, 1)) / DAY_MS
  const list = rows.map((r) => ({ year: r.year, a: doy(r.database![0]), b: doy(r.database![1]), now: false }))
  if (tight) list.push({ year: Number(tight.last_full.slice(0, 4)), a: doy(tight.last_full), b: doy(tight.first_empty), now: true })
  const lo = Math.min(...list.map((r) => r.a)) - 8
  const hi = Math.max(...list.map((r) => r.b)) + 8
  const x = linear(lo, hi, 52, width - 12)
  const rowH = 20
  const h = list.length * rowH + 26
  // month starts of a non-leap year, as day of year
  const months = [['Jun', 151], ['Jul', 181], ['Aug', 212], ['Sep', 243], ['Oct', 273]].filter(([, d]) => (d as number) > lo && (d as number) < hi) as [string, number][]
  return (
    <div ref={ref}>
      <svg width={width} height={h} role="img" aria-label={`Dates of the drainage by year: ${list.map((r) => r.year).join(', ')}.`}>
        {months.map(([name, d]) => (
          <g key={name}>
            <line className="chart__grid" x1={x(d)} x2={x(d)} y1={0} y2={h - 20} />
            <text className="chart__xtick" x={x(d) + 4} y={h - 6}>{name}</text>
          </g>
        ))}
        {list.map((r, i) => {
          const y = i * rowH + rowH / 2
          return (
            <g key={r.year}>
              <text className={r.now ? 'years__label years__label--now' : 'years__label'} x={0} y={y + 4}>{r.year}</text>
              <line className={r.now ? 'years__bar years__bar--now' : 'years__bar'} x1={x(r.a)} x2={Math.max(x(r.b), x(r.a) + 3)} y1={y} y2={y} />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function Frames({ m, base }: { m: Extra; base: string }) {
  const looks = useMemo(() => [...m.frames.nisar].sort((p, q) => ms(p.t) - ms(q.t)), [m])
  const orbits = useMemo(() => [...new Set(looks.map((f) => f.orbit))].sort(), [looks])
  const [orbit, setOrbit] = useState<string>('all')
  const [layer, setLayer] = useState<'hh' | 'rgb'>('hh')
  const [outline, setOutline] = useState(true)
  const list = useMemo(() => (orbit === 'all' ? looks : looks.filter((f) => f.orbit === orbit)), [looks, orbit])
  // open on the first look that is neither full nor empty, the one that caught the lake while it fell
  const start = useMemo(() => {
    const k = list.findIndex((f) => f.state === 'partial')
    return k >= 0 ? k : Math.max(0, list.findIndex((f) => f.state === 'empty') - 1)
  }, [list])
  const [i, setI] = useState(start)
  useEffect(() => setI(start), [start])
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => setI((k) => (k + 1) % list.length), 900)
    return () => window.clearInterval(id)
  }, [playing, list.length])

  if (!list.length) return <p className="muted">No frames in the data file.</p>
  const f = list[Math.min(i, list.length - 1)]
  const src = layer === 'rgb' && f.rgb ? f.rgb : f.hh
  const size = m.frames.size_px
  const poly = m.frames.basin_polygon_px
  const Overlay = () =>
    outline && size && poly ? (
      <svg className="frame__outline" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <polygon points={poly.map((p) => p.join(',')).join(' ')} />
      </svg>
    ) : null
  const gap = f.s2_gap_hours

  return (
    <div className="frames">
      <div className="frames__bar">
        <button type="button" className="playbtn playbtn--sm" aria-pressed={playing} aria-label={playing ? 'Pause the frames' : 'Play the frames'} onClick={() => setPlaying((p) => !p)}>
          {playing ? (
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="3" width="3" height="10" rx="0.8" /><rect x="9.5" y="3" width="3" height="10" rx="0.8" /></svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2v9.6a.6.6 0 0 0 .92.5l7.3-4.8a.6.6 0 0 0 0-1L5.92 2.7A.6.6 0 0 0 5 3.2Z" /></svg>
          )}
        </button>
        <div className="seg" role="group" aria-label="NISAR orbit">
          <button type="button" aria-pressed={orbit === 'all'} onClick={() => setOrbit('all')}>All orbits</button>
          {orbits.map((o) => (
            <button key={o} type="button" aria-pressed={orbit === o} onClick={() => setOrbit(o)}>{o}</button>
          ))}
        </div>
        <div className="seg" role="group" aria-label="Radar image">
          <button type="button" aria-pressed={layer === 'hh'} onClick={() => setLayer('hh')}>HH</button>
          <button type="button" aria-pressed={layer === 'rgb'} onClick={() => setLayer('rgb')}>HH + HV colour</button>
        </div>
        <label className="check">
          <input type="checkbox" checked={outline} onChange={(e) => setOutline(e.target.checked)} /> Basin outline
        </label>
      </div>

      <div className="frames__pair frames__pair--wide">
        <figure className="frame">
          <div className="frame__img frame__img--smooth" style={{ aspectRatio: '1 / 1' }}>
            <img src={`${base}${src}`} alt={`NISAR ${layer === 'hh' ? 'HH backscatter' : 'HH and HV colour composite'}, orbit ${f.orbit}, ${dayTime(f.t)}`} />
            <Overlay />
            <span className={`frame__state frame__state--${f.state}`}>{STATE_LABEL[f.state] ?? f.state}</span>
          </div>
          <figcaption>
            <b>L-band, NISAR</b>, orbit {f.orbit}, {dayTime(f.t)}. Radar-dark area inside the basin: HH <span className="num">{num(f.water_ha_hh, 1)}</span> ha, HV{' '}
            <span className="num">{num(f.water_ha_hv, 1)}</span> ha{m.basin_ha ? <> of a basin of <span className="num">{num(m.basin_ha, 0)}</span> ha</> : null}. Dark area is not lake area: ice floes and wind
            brighten water.{m.orbit_note?.[f.orbit] ? ` Orbit ${f.orbit}: ${m.orbit_note[f.orbit]}.` : ''}
          </figcaption>
        </figure>
        <figure className="frame">
          {f.s2 ? (
            <div className="frame__img frame__img--smooth" style={{ aspectRatio: '1 / 1' }}>
              <img src={`${base}${f.s2}`} alt="Nearest Sentinel-2 true-colour image" loading="lazy" />
              <Overlay />
            </div>
          ) : (
            <div className="frame__img frame__img--none" style={{ aspectRatio: '1 / 1' }}><span>No optical image paired with this look</span></div>
          )}
          <figcaption>
            <b>Optics, Sentinel-2</b>, the nearest usable image{gap != null ? `, ${gapText(gap)}` : ''}.
          </figcaption>
        </figure>
      </div>

      <div className="frames__scrub" style={{ maxWidth: 900 }}>
        <input type="range" min={0} max={list.length - 1} step={1} value={Math.min(i, list.length - 1)} onChange={(e) => { setPlaying(false); setI(Number(e.target.value)) }} aria-label="NISAR look" aria-valuetext={`${dayMonth(f.t)}, orbit ${f.orbit}, ${STATE_LABEL[f.state] ?? f.state}`} />
        <ol className="dates" aria-label="All looks">
          {list.map((g, k) => (
            <li key={g.t}>
              <button type="button" className={`dates__btn dates__btn--${g.state}${k === i ? ' is-on' : ''}`} onClick={() => { setPlaying(false); setI(k) }} aria-current={k === i ? 'true' : undefined}>
                {dayMonth(g.t)}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default function MerzbacherPage() {
  const r = useMerzbacher()
  if (r.status === 'loading') return <div className="wrap state" role="status">Loading…</div>
  if (r.status === 'missing') return <div className="wrap state">The Merzbacher data file is not available yet.</div>
  const m = r.data as Extra
  const tight = [...m.intervals].sort((a, b) => a.full_to_empty_days - b.full_to_empty_days)[0]
  const radar = m.intervals.find((x) => /both radars/i.test(x.set))
  const during = m.curve.nisar.find((x) => x.state === 'partial')

  return (
    <div className="wrap">
      <header className="page-head">
        <h1 className="h1">Merzbacher 2026</h1>
        <div className="prose">
          <Prose text={MERZBACHER_TEXT} className="prose prose--lead" />
          <p>
            {tight ? (
              <>From the data file: the last look that saw the lake full was on {dayTime(tight.last_full)} and the earliest that saw it empty on {dayTime(tight.first_empty)}, {days(tight.full_to_empty_days)} apart, by {tight.set}. </>
            ) : null}
            {during ? <>NISAR orbit {during.orbit} passed on {dayTime(during.t)}. </> : null}
            {radar ? <>The two radars alone bracket the drainage within {days(radar.full_to_empty_days)}. </> : null}
            The states of the optical scenes are visual labels; the radar states follow a fixed rule on the dark area.
          </p>
        </div>
      </header>

      <section aria-labelledby="mz-frames">
        <h2 className="h2" id="mz-frames" style={{ marginBottom: 14 }}>The drainage in frames</h2>
        <Frames m={m} base={r.base} />
      </section>

      <section className="section" aria-labelledby="mz-bracket">
        <h2 className="h2" id="mz-bracket">How tightly each set of sensors dates it</h2>
        <p className="prose small muted" style={{ marginBottom: 12, maxWidth: '72ch' }}>
          A sensor dates the drainage only as well as its passes fall around it. The shorter the bar, the tighter the date.
        </p>
        <div className="card pad"><Brackets m={m} /></div>
      </section>

      <section className="section" aria-labelledby="mz-curve">
        <h2 className="h2" id="mz-curve">One curve, every look</h2>
        <div className="card pad"><Curve m={m} /></div>
      </section>

      {m.earlier_years?.length ? (
        <section className="section" aria-labelledby="mz-years">
          <h2 className="h2" id="mz-years">The same lake in earlier years</h2>
          <p className="prose small muted" style={{ marginBottom: 12, maxWidth: '72ch' }}>
            Drainage dates of earlier years as listed in the data file (an outburst database); the last row is 2026 from this project.
          </p>
          <div className="card pad" style={{ maxWidth: 760 }}><EarlierYears m={m} /></div>
        </section>
      ) : null}

    </div>
  )
}
