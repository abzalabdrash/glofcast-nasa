// SI-assisted (Claude), NASA Space Apps 2026
// One time axis, three panels: L-band (NISAR), C-band (Sentinel-1), optics. Orbits are never pooled: each orbit
// is its own line. Clean looks are filled marks joined by a line; swath-edge looks are hollow and stand alone;
// looks without a usable value are small crosses on the top edge of the panel.
import { useMemo, useState, type KeyboardEvent } from 'react'
import type { LakeEvent, LakeFile } from '../data/types'
import { dayMonth, dayTime, db, granuleUrl, ms, pct, signedDb } from '../lib/format'
import { linear, monthTicks, ticks } from '../lib/scale'
import { useWidth } from '../lib/useWidth'

export type PolMode = 'co' | 'cross' | 'both'

export interface ChartPoint {
  key: string
  t: number
  iso: string
  sensor: 'nisar' | 's1' | 'optical'
  orbit: string
  /** co-polarised and cross-polarised contrast (dB), or water share for optics */
  co: number | null
  cross: number | null
  quality: 'clean' | 'swath_edge' | 'unusable' | 'valid' | 'not_valid'
  id: string
  platform?: string
  clear?: number | null
}

// L-band orbits in the blues of water, C-band orbits in the browns of contour lines
export const NISAR_COLORS = ['#1c6787', '#4a9cc0', '#0d3c52', '#7fbdd6', '#2c5a78']
export const S1_COLORS = ['#8a6540', '#b98d58', '#5c4024', '#cdab7e', '#77583a']

export function orbitsOf(file: LakeFile) {
  const uniq = (xs: string[]) => [...new Set(xs)].sort()
  return { nisar: uniq(file.series.nisar.map((r) => r.orbit)), s1: uniq(file.series.s1.map((r) => r.orbit)) }
}

export function pointsOf(file: LakeFile): ChartPoint[] {
  const out: ChartPoint[] = []
  file.series.nisar.forEach((r, i) =>
    out.push({ key: `n${i}`, t: ms(r.t), iso: r.t, sensor: 'nisar', orbit: r.orbit, co: r.hh, cross: r.hv, quality: r.cls, id: r.granule }),
  )
  file.series.s1.forEach((r, i) =>
    out.push({
      key: `s${i}`, t: ms(r.t), iso: r.t, sensor: 's1', orbit: r.orbit, co: r.vv, cross: r.vh,
      quality: r.usable ? 'clean' : 'unusable', id: r.image, platform: r.platform,
    }),
  )
  file.series.optical.forEach((r, i) =>
    out.push({
      key: `o${i}`, t: ms(r.t), iso: r.t, sensor: 'optical', orbit: '', co: r.water, cross: null,
      quality: r.valid ? 'valid' : 'not_valid', id: r.image, clear: r.clear,
    }),
  )
  return out.sort((a, b) => a.t - b.t)
}

export function describePoint(p: ChartPoint): string {
  if (p.sensor === 'optical') {
    const w = p.co == null ? 'no water share (too little clear ground)' : `water share ${pct(p.co)}`
    return `${dayTime(p.iso)}. Optics, Sentinel-2: ${w}, clear share ${pct(p.clear)}; ${p.quality === 'valid' ? 'valid scene' : 'not a valid scene (cloud or low sun)'}.`
  }
  const names = p.sensor === 'nisar' ? ['L-band, NISAR', 'HH', 'HV'] : [`C-band, Sentinel-1${p.platform ? ` (${p.platform})` : ''}`, 'VV', 'VH']
  const q = p.quality === 'clean' ? 'clean look' : p.quality === 'swath_edge' ? 'swath-edge look (weaker radiometry)' : 'not usable'
  return `${dayTime(p.iso)}. ${names[0]}, orbit ${p.orbit}: ${names[1]} ${db(p.co)}, ${names[2]} ${db(p.cross)}; ${q}.`
}

interface Props {
  file: LakeFile
  events: LakeEvent[]
  season: [string, string]
  pol: PolMode
  hidden: Set<string>
  selected: string | null
  onSelect: (key: string | null) => void
}

const M = { l: 46, r: 14 }
const RADAR_H = 168
const OPT_H = 84
const HEAD = 26
const GAP = 18
const AXIS = 24

export function SeriesChart({ file, events, season, pol, hidden, selected, onSelect }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>(900)
  const [hover, setHover] = useState<string | null>(null)

  const points = useMemo(() => pointsOf(file), [file])
  const orbits = useMemo(() => orbitsOf(file), [file])
  const colorOf = (sensor: 'nisar' | 's1', orbit: string) =>
    sensor === 'nisar' ? NISAR_COLORS[orbits.nisar.indexOf(orbit) % NISAR_COLORS.length] : S1_COLORS[orbits.s1.indexOf(orbit) % S1_COLORS.length]

  const visible = useMemo(
    () => points.filter((p) => p.sensor === 'optical' || !hidden.has(`${p.sensor}:${p.orbit}`)),
    [points, hidden],
  )

  // ----- scales -----
  const t0 = Math.min(ms(season[0]), ...points.map((p) => p.t))
  const t1 = Math.max(ms(season[1]) + 86400000, ...points.map((p) => p.t))
  const plotW = Math.max(120, width - M.l - M.r)
  const narrow = width < 560
  const x = linear(t0, t1, M.l, M.l + plotW)

  const radarVals = points.flatMap((p) => (p.sensor === 'optical' ? [] : [p.co, p.cross])).filter((v): v is number => v != null)
  const lo = Math.min(-6, Math.floor(Math.min(0, ...radarVals) / 2) * 2)
  const hi = Math.max(2, Math.ceil(Math.max(0, ...radarVals) / 2) * 2)
  const yTicks = ticks(lo, hi, 5)

  const top = { nisar: HEAD, s1: HEAD + RADAR_H + GAP + HEAD, optical: 2 * (HEAD + RADAR_H + GAP) + HEAD }
  const yN = linear(hi, lo, top.nisar + 6, top.nisar + RADAR_H - 6)
  const yS = linear(hi, lo, top.s1 + 6, top.s1 + RADAR_H - 6)
  const yO = linear(1, 0, top.optical + 6, top.optical + OPT_H - 8)
  const height = top.optical + OPT_H + AXIS
  const months = monthTicks(t0, t1)
  const yOf = (p: ChartPoint, which: 'co' | 'cross') => {
    const v = which === 'co' ? p.co : p.cross
    if (v == null) return null
    return p.sensor === 'nisar' ? yN(v) : p.sensor === 's1' ? yS(v) : yO(v)
  }

  // ----- marks -----
  const showCo = pol !== 'cross'
  const showCross = pol !== 'co'

  function linesFor(sensor: 'nisar' | 's1') {
    const out: { key: string; d: string; color: string; dashed: boolean; label: string; lx: number; ly: number }[] = []
    for (const orbit of orbits[sensor]) {
      if (hidden.has(`${sensor}:${orbit}`)) continue
      const rows = points.filter((p) => p.sensor === sensor && p.orbit === orbit && p.quality === 'clean')
      for (const which of ['co', 'cross'] as const) {
        if ((which === 'co' && !showCo) || (which === 'cross' && !showCross)) continue
        const pts = rows.map((p) => [x(p.t), yOf(p, which)] as const).filter((q): q is readonly [number, number] => q[1] != null)
        if (!pts.length) continue
        out.push({
          key: `${sensor}-${orbit}-${which}`,
          d: pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' '),
          color: colorOf(sensor, orbit),
          dashed: which === 'cross',
          label: orbit,
          lx: pts[pts.length - 1][0],
          ly: pts[pts.length - 1][1],
        })
      }
    }
    return out
  }

  const optValid = points.filter((p) => p.sensor === 'optical' && p.quality === 'valid' && p.co != null)
  const optPath = optValid.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)} ${yO(p.co!).toFixed(1)}`).join(' ')

  // ----- interaction -----
  const hit = useMemo(() => {
    const list: { key: string; x: number; y: number }[] = []
    for (const p of visible) {
      const px = x(p.t)
      if (p.sensor === 'optical') {
        list.push({ key: p.key, x: px, y: p.co != null && p.quality === 'valid' ? yO(p.co) : top.optical + OPT_H - 3 })
        continue
      }
      const edge = (p.sensor === 'nisar' ? top.nisar : top.s1) + 5
      const yc = showCo ? yOf(p, 'co') : null
      const yx = showCross ? yOf(p, 'cross') : null
      if (yc == null && yx == null) list.push({ key: p.key, x: px, y: edge })
      if (yc != null) list.push({ key: p.key, x: px, y: yc })
      if (yx != null) list.push({ key: p.key, x: px, y: yx })
    }
    return list
    // scales depend on width and data only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, width, showCo, showCross, lo, hi, t0, t1])

  const nearest = (mx: number, my: number) => {
    let best: string | null = null
    let bd = 22 * 22
    for (const h of hit) {
      const d = (h.x - mx) ** 2 + (h.y - my) ** 2
      if (d < bd) {
        bd = d
        best = h.key
      }
    }
    return best
  }
  const active = hover ?? selected
  const activePoint = active ? points.find((p) => p.key === active) : undefined

  const onKey = (e: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].includes(e.key)) return
    e.preventDefault()
    if (e.key === 'Escape') return onSelect(null)
    const i = visible.findIndex((p) => p.key === selected)
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? visible.length - 1 : i < 0 ? 0 : Math.min(visible.length - 1, Math.max(0, i + (e.key === 'ArrowRight' ? 1 : -1)))
    if (visible[next]) onSelect(visible[next].key)
  }

  const panelFrame = (y: number, h: number, title: string, sub: string, color: string) => (
    <g>
      <text className="chart__title" x={M.l} y={y - 9}>
        <tspan fill={color}>{title}</tspan>
        <tspan className="chart__sub" dx="8">{sub}</tspan>
      </text>
      <rect className="chart__panel" x={M.l} y={y} width={plotW} height={h} />
    </g>
  )

  const radarAxis = (yScale: (v: number) => number) =>
    yTicks.map((v) => (
      <g key={v}>
        <line className={v === 0 ? 'chart__zero' : 'chart__grid'} x1={M.l} x2={M.l + plotW} y1={yScale(v)} y2={yScale(v)} />
        <text className="chart__ytick" x={M.l - 8} y={yScale(v) + 3.5} textAnchor="end">{v === 0 ? '0' : signedDb(v, 0).replace(' dB', '')}</text>
      </g>
    ))

  const eventBands = (sensor: 'nisar' | 's1', y: number) => {
    // labels of steps that end close to each other are stacked, so that none is drawn over another
    let lastX = -1e9
    let level = 0
    return events
      .filter((e) => e.sensor === sensor && !hidden.has(`${sensor}:${e.orbit}`))
      .sort((p, q) => ms(p.after) - ms(q.after))
      .map((e, i) => {
        const xa = x(ms(e.before))
        const xb = x(ms(e.after))
        level = xb - lastX < 92 ? level + 1 : 0
        lastX = xb
        return (
          <g key={`${sensor}${i}`}>
            <rect className="chart__event" x={xa} y={y} width={Math.max(2, xb - xa)} height={RADAR_H} />
            <line className="chart__eventline" x1={xb} x2={xb} y1={y} y2={y + RADAR_H} />
            <text className="chart__eventlabel" x={xb - 4} y={y + RADAR_H - 6 - (level % 4) * 12} textAnchor="end">
              {signedDb(e.step_db)} {e.orbit}
            </text>
          </g>
        )
      })
  }

  const mark = (p: ChartPoint, which: 'co' | 'cross') => {
    if (p.sensor === 'optical') return null
    const y = yOf(p, which)
    const color = colorOf(p.sensor, p.orbit)
    const px = x(p.t)
    const on = p.key === active
    if (y == null) return null
    const r = which === 'co' ? 3.4 : 2.6
    if (p.quality === 'swath_edge') return <circle key={`${p.key}${which}`} cx={px} cy={y} r={r} fill="var(--surface)" stroke={color} strokeWidth={1.4} strokeDasharray="2 1.5" />
    if (p.quality === 'unusable') return null
    return <circle key={`${p.key}${which}`} cx={px} cy={y} r={on ? r + 1 : r} fill={which === 'co' ? color : 'var(--surface)'} stroke={color} strokeWidth={which === 'co' ? 0 : 1.4} />
  }
  const cross = (p: ChartPoint) => {
    // a look with no usable value in the polarisation shown
    if (p.sensor === 'optical') return null
    const missing = (showCo && p.co == null) || (showCross && p.cross == null && pol === 'cross') || p.quality === 'unusable'
    if (!missing) return null
    const y = (p.sensor === 'nisar' ? top.nisar : top.s1) + 6
    const px = x(p.t)
    const c = colorOf(p.sensor, p.orbit)
    return <path key={`x${p.key}`} d={`M${px - 2.6} ${y - 2.6}l5.2 5.2M${px + 2.6} ${y - 2.6}l-5.2 5.2`} stroke={c} strokeWidth={1.3} />
  }

  const hx = activePoint ? x(activePoint.t) : null
  const co = pol === 'cross' ? 'cross-polarised' : pol === 'co' ? 'co-polarised' : 'both polarisations'

  return (
    <div className="chart" ref={ref}>
      <svg
        width={width}
        height={height}
        tabIndex={0}
        role="group"
        aria-label={`Series of the lake on one time axis, ${dayMonth(t0)} to ${dayMonth(t1)}: L-band and C-band contrast (${co}) per orbit, and the optical water share. Use the left and right arrow keys to step through the looks; the look is described under the chart.`}
        onKeyDown={onKey}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setHover(nearest(e.clientX - r.left, e.clientY - r.top))
        }}
        onMouseLeave={() => setHover(null)}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          onSelect(nearest(e.clientX - r.left, e.clientY - r.top))
        }}
      >
        {panelFrame(top.nisar, RADAR_H, 'L-band', `NISAR, ${pol === 'cross' ? 'HV' : pol === 'co' ? 'HH' : 'HH solid, HV dashed'}${narrow ? ', dB' : ', basin minus ring in dB'}`, 'var(--nisar)')}
        {panelFrame(top.s1, RADAR_H, 'C-band', `Sentinel-1, ${pol === 'cross' ? 'VH' : pol === 'co' ? 'VV' : 'VV solid, VH dashed'}${narrow ? ', dB' : ', basin minus ring in dB'}`, 'var(--s1)')}
        {panelFrame(top.optical, OPT_H, 'Optics', narrow ? 'Sentinel-2, water share' : 'Sentinel-2, share of the basin under water in valid scenes', 'var(--optical)')}

        {months.map((m) => (
          <g key={m.t}>
            <line className="chart__grid" x1={x(m.t)} x2={x(m.t)} y1={top.nisar} y2={top.optical + OPT_H} />
            <text className="chart__xtick" x={x(m.t) + 4} y={height - 7}>{m.label}</text>
          </g>
        ))}
        {/* season of NISAR data */}
        <line className="chart__season" x1={x(ms(season[0]))} x2={x(ms(season[1]) + 86400000)} y1={top.optical + OPT_H + 4} y2={top.optical + OPT_H + 4} />

        {radarAxis(yN)}
        {radarAxis(yS)}
        {[0, 0.5, 1].map((v) => (
          <g key={`o${v}`}>
            <line className="chart__grid" x1={M.l} x2={M.l + plotW} y1={yO(v)} y2={yO(v)} />
            <text className="chart__ytick" x={M.l - 8} y={yO(v) + 3.5} textAnchor="end">{pct(v)}</text>
          </g>
        ))}
        <text className="chart__hint" x={M.l + 6} y={top.nisar + RADAR_H - 7}>darker basin, more likely water</text>

        {eventBands('nisar', top.nisar)}
        {eventBands('s1', top.s1)}

        {(['nisar', 's1'] as const).map((sensor) =>
          linesFor(sensor).map((l) => (
            <g key={l.key}>
              <path d={l.d} fill="none" stroke={l.color} strokeWidth={1.5} strokeDasharray={l.dashed ? '4 3' : undefined} strokeLinejoin="round" />
            </g>
          )),
        )}
        {visible.map((p) => (showCross ? mark(p, 'cross') : null))}
        {visible.map((p) => (showCo ? mark(p, 'co') : null))}
        {visible.map(cross)}

        {/* optics */}
        {points.filter((p) => p.sensor === 'optical' && p.quality !== 'valid').map((p) => (
          <line key={p.key} className="chart__cloud" x1={x(p.t)} x2={x(p.t)} y1={top.optical + OPT_H - 6} y2={top.optical + OPT_H - 1} />
        ))}
        {optPath ? <path d={optPath} fill="none" stroke="var(--optical)" strokeWidth={1.5} /> : null}
        {optValid.map((p) => {
          const px = x(p.t)
          const py = yO(p.co!)
          const s = p.key === active ? 4.6 : 3.6
          return <path key={p.key} d={`M${px} ${py - s}L${px + s} ${py}L${px} ${py + s}L${px - s} ${py}Z`} fill="var(--optical)" />
        })}

        {hx != null ? <line className="chart__cursor" x1={hx} x2={hx} y1={top.nisar} y2={top.optical + OPT_H} /> : null}
      </svg>
      <p className="chart__readout" aria-live="polite">
        {activePoint ? (
          <>
            {describePoint(activePoint)}{' '}
            {activePoint.sensor !== 'optical' && granuleUrl(activePoint.sensor, activePoint.id) ? (
              <a href={granuleUrl(activePoint.sensor, activePoint.id)!} target="_blank" rel="noreferrer">
                <span className="mono chart__id">{activePoint.id}</span>
              </a>
            ) : (
              <span className="mono chart__id">{activePoint.id}</span>
            )}
          </>
        ) : (
          <span className="muted">Point at a mark, or focus the chart and use the arrow keys, to read one look and its granule or image id.</span>
        )}
      </p>
    </div>
  )
}
