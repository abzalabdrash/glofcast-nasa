// SI-assisted (Claude), NASA Space Apps 2026
// "How radar sees a lake": five short interactive drawings. They are schematics that explain the physics; the
// only project numbers on this page are read from the data files (smallest lake, longest NISAR gap).
import { useMemo, useState } from 'react'
import { useIndex, useTimeline } from '../data/load'
import { BANDS, INCIDENCE_DEG, smoothLimitCm } from '../content/physics'
import { dayMonth, num } from '../lib/format'
import { href } from '../lib/router'

const INK = 'var(--ink)'
const SOFT = 'var(--ink-3)'

function Arrow({ x1, y1, x2, y2, color = INK, w = 1.6, dash }: { x1: number; y1: number; x2: number; y2: number; color?: string; w?: number; dash?: string }) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const h = 7
  const p = (d: number) => `${x2 - h * Math.cos(a + d)},${y2 - h * Math.sin(a + d)}`
  return (
    <g stroke={color} fill="none" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={dash} />
      <polyline points={`${p(0.45)} ${x2},${y2} ${p(-0.45)}`} />
    </g>
  )
}

function Satellite({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(-28)`} fill={INK}>
      <rect x={-7} y={-5} width={14} height={10} rx={2} />
      <rect x={-27} y={-3} width={17} height={6} rx={1} opacity={0.55} />
      <rect x={10} y={-3} width={17} height={6} rx={1} opacity={0.55} />
    </g>
  )
}

/** 1. Smooth water sends the pulse away; rough ground sends part of it back. */
function FigSurface() {
  const [rough, setRough] = useState(8)
  const r = rough / 100
  const hit = { x: 300, y: 196 }
  const surface = useMemo(() => {
    const pts: string[] = []
    for (let x = 40; x <= 560; x += 4) {
      const y = 196 + r * 10 * (Math.sin(x * 0.21) + 0.6 * Math.sin(x * 0.53 + 1) + 0.4 * Math.sin(x * 1.1 + 2))
      pts.push(`${x},${y.toFixed(1)}`)
    }
    return pts.join(' ')
  }, [r])
  const back = 16 + r * 120
  const away = 150 * (1 - 0.75 * r)
  const grey = Math.round(18 + r * 210)
  const scatter = [-1.9, -1.35, -0.75].map((a) => ({ a, len: 22 + r * 70 }))
  return (
    <figure className="card step__fig fig">
      <svg viewBox="0 0 600 260" role="img" aria-label={`Schematic. A radar pulse meets a surface at an angle. ${r < 0.3 ? 'The surface is smooth: almost all of the pulse bounces away and the radar records a dark pixel.' : r < 0.65 ? 'The surface is slightly rough: part of the pulse returns.' : 'The surface is rough: much of the pulse scatters back and the radar records a bright pixel.'}`}>
        <Satellite x={86} y={36} />
        <Arrow x1={104} y1={52} x2={hit.x - 6} y2={hit.y - 6} color={INK} w={2} />
        <text x={150} y={74} transform="rotate(36 150 74)">pulse from the radar</text>
        {/* mirror bounce, away from the radar */}
        <Arrow x1={hit.x + 4} y1={hit.y - 6} x2={hit.x + 4 + away * 0.81} y2={hit.y - 6 - away * 0.59} color={SOFT} w={1 + 2.2 * (1 - r)} />
        <text x={470} y={86} textAnchor="middle">bounces away</text>
        {/* scatter */}
        {scatter.map((s) => (
          <Arrow key={s.a} x1={hit.x} y1={hit.y - 8} x2={hit.x + s.len * Math.cos(s.a)} y2={hit.y - 8 + s.len * Math.sin(s.a)} color={SOFT} w={1} dash="2 3" />
        ))}
        {/* return to the radar */}
        <Arrow x1={hit.x - 30} y1={hit.y - 10} x2={hit.x - 30 - back * 0.81} y2={hit.y - 10 - back * 0.59} color="var(--ember)" w={1 + 2.4 * r} />
        <text x={hit.x - 44} y={hit.y + 22} textAnchor="end" style={{ fill: 'var(--event-ink)' }}>comes back to the radar</text>
        <polyline points={surface} fill="none" stroke={r < 0.3 ? 'var(--cyan)' : INK} strokeWidth={2} />
        <text x={44} y={244} className="fig__strong">{r < 0.3 ? 'calm water' : r < 0.65 ? 'rippled water, fine gravel' : 'rock, moraine, broken ice'}</text>
        <rect x={500} y={206} width={56} height={40} rx={4} fill={`rgb(${grey} ${grey} ${grey})`} stroke={INK} strokeWidth={0.8} />
        <text x={492} y={224} textAnchor="end">the pixel the</text>
        <text x={492} y={240} textAnchor="end">radar records</text>
      </svg>
      <div className="fig__controls">
        <label>
          Surface: from mirror-smooth to rough
          <input type="range" min={0} max={100} value={rough} onChange={(e) => setRough(Number(e.target.value))} aria-valuetext={r < 0.3 ? 'smooth' : r < 0.65 ? 'slightly rough' : 'rough'} />
        </label>
      </div>
      <p className="fig__note">Schematic, not data.</p>
    </figure>
  )
}

/** 2. HH against HV: which grounds turn the wave. */
function FigPol() {
  const [pol, setPol] = useState<'co' | 'cross'>('co')
  // relative strength of the return, schematic only: [same polarisation, turned polarisation]
  const grounds = [
    { name: 'calm water', co: 0.08, cross: 0.04, note: 'dark in both' },
    { name: 'smooth ground, snow-free', co: 0.55, cross: 0.14, note: 'bright in one, dim in the other' },
    { name: 'blocks, shrubs, broken ice', co: 0.85, cross: 0.6, note: 'bright in both' },
  ]
  return (
    <figure className="card step__fig fig">
      <svg viewBox="0 0 600 230" role="img" aria-label={`Schematic. Strength of the return in the ${pol === 'co' ? 'same polarisation as sent (HH or VV)' : 'turned polarisation (HV or VH)'} for three kinds of ground: ${grounds.map((g) => `${g.name}, ${g.note}`).join('; ')}.`}>
        <text x={20} y={22} className="fig__strong">{pol === 'co' ? 'Sent horizontal, heard horizontal (HH; Sentinel-1: VV)' : 'Sent horizontal, heard vertical (HV; Sentinel-1: VH)'}</text>
        {grounds.map((g, i) => {
          const v = pol === 'co' ? g.co : g.cross
          const y = 58 + i * 56
          const grey = Math.round(20 + v * 225)
          return (
            <g key={g.name}>
              <text x={20} y={y + 4}>{g.name}</text>
              <rect x={232} y={y - 12} width={300} height={22} rx={3} fill={pol === 'co' ? 'var(--nisar)' : 'var(--s1)'} style={{ transform: `scaleX(${v})`, transformOrigin: '232px 0', transformBox: 'view-box', transition: 'transform 0.35s cubic-bezier(0.23, 1, 0.32, 1)' }} />
              <rect x={232} y={y - 12} width={300} height={22} rx={3} fill="none" stroke="var(--line-strong)" />
              <rect x={548} y={y - 12} width={32} height={22} rx={3} fill={`rgb(${grey} ${grey} ${grey})`} stroke={INK} strokeWidth={0.6} />
              <text x={232} y={y + 26} className="fig__mono">{g.note}</text>
            </g>
          )
        })}
        <text x={564} y={36} textAnchor="middle" className="fig__mono">pixel</text>
      </svg>
      <div className="fig__controls">
        <div className="seg" role="group" aria-label="Polarisation">
          <button type="button" aria-pressed={pol === 'co'} onClick={() => setPol('co')}>Same way back (HH, VV)</button>
          <button type="button" aria-pressed={pol === 'cross'} onClick={() => setPol('cross')}>Turned (HV, VH)</button>
        </div>
      </div>
      <p className="fig__note">Schematic, not data: bar lengths show the order of the returns, not measured values.</p>
    </figure>
  )
}

/** 3. L-band against C-band: rough or smooth depends on the wavelength. */
function FigBands() {
  const [h, setH] = useState(1.5)
  const scale = 22 // pixels per centimetre
  const surface = (x0: number, w: number) => {
    const pts: string[] = []
    for (let x = 0; x <= w; x += 3) {
      const y = (h * scale * 0.5) * (Math.sin(x * 0.085) * 0.6 + Math.sin(x * 0.19 + 1) * 0.4)
      pts.push(`${x0 + x},${(150 + y).toFixed(1)}`)
    }
    return pts.join(' ')
  }
  const wave = (x0: number, w: number, lambdaCm: number) => {
    const pts: string[] = []
    const L = lambdaCm * scale
    for (let x = 0; x <= w; x += 2) pts.push(`${x0 + x},${(70 + 14 * Math.sin((x / L) * 2 * Math.PI)).toFixed(1)}`)
    return pts.join(' ')
  }
  return (
    <figure className="card step__fig fig">
      <svg viewBox="0 0 600 236" role="img" aria-label={`Two wavelengths over the same surface with bumps ${h.toFixed(1)} centimetres high. ${BANDS.map((b) => `${b.band} (${b.lambdaCm} cm): the surface ${h < smoothLimitCm(b.lambdaCm) ? 'still acts as a mirror, so water stays dark' : 'is rough, so it returns signal and looks brighter'}`).join('. ')}.`}>
        {BANDS.map((b, i) => {
          const x0 = 20 + i * 300
          const limit = smoothLimitCm(b.lambdaCm)
          const smooth = h < limit
          return (
            <g key={b.band}>
              <text x={x0} y={20} className="fig__strong" fill={b.color}>{b.band}, {b.mission}</text>
              <text x={x0} y={38} className="fig__mono">wavelength {b.lambdaCm} cm, drawn to scale</text>
              <polyline points={wave(x0, 260, b.lambdaCm)} fill="none" stroke={b.color} strokeWidth={1.8} />
              <polyline points={surface(x0, 260)} fill="none" stroke={INK} strokeWidth={2} />
              <line x1={x0} x2={x0 + 260} y1={150} y2={150} stroke="var(--line-strong)" strokeDasharray="2 3" />
              <rect x={x0} y={188} width={260} height={30} rx={4} fill={smooth ? '#000' : 'var(--bone)'} stroke={INK} strokeWidth={0.6} style={{ transition: 'fill 0.3s' }} />
              <text x={x0 + 130} y={207} textAnchor="middle" style={{ fill: smooth ? 'var(--bone)' : '#05080a' }}>
                {smooth ? 'acts as a mirror: stays dark' : 'rough at this wavelength: brighter'}
              </text>
              <text x={x0} y={232} className="fig__mono">mirror-like below about {limit.toFixed(1)} cm of relief</text>
            </g>
          )
        })}
      </svg>
      <div className="fig__controls">
        <label>
          Height of ripples and stones: <span className="num">{h.toFixed(1)} cm</span>
          <input type="range" min={0.2} max={6} step={0.1} value={h} onChange={(e) => setH(Number(e.target.value))} aria-valuetext={`${h.toFixed(1)} centimetres`} />
        </label>
      </div>
      <p className="fig__note">
        Rule of thumb (Rayleigh criterion): a surface acts as a mirror while its relief stays below the wavelength divided by
        8 cos θ, here with θ = {INCIDENCE_DEG}°. Wavelengths are mission constants, not project data.
      </p>
    </figure>
  )
}

/** 4. What can look like water, or hide it. */
const TRAPS = [
  { key: 'shadow', label: 'Radar shadow', text: 'A slope that faces away from the radar gets no pulse at all. It is as dark as water, in every pass of that orbit. Another orbit, looking from the other side, may see the same ground well.' },
  { key: 'layover', label: 'Layover', text: 'A steep slope that faces the radar piles its echoes onto the valley floor in front of it. A lake under that bright smear cannot be read from that orbit.' },
  { key: 'snow', label: 'Wet snow', text: 'Melting snow absorbs the pulse and can look dark, like water. In June a dry hollow under wet snow can pass for a full basin.' },
  { key: 'ice', label: 'Ice and wind', text: 'Floating ice and wind ripples make water bright. A lake that is full can look half empty, so a dark area is always a lower bound of the water, never its area.' },
] as const

function FigTraps() {
  const [k, setK] = useState<(typeof TRAPS)[number]['key']>('shadow')
  const t = TRAPS.find((x) => x.key === k)!
  const on = (key: string) => (k === key ? 1 : 0.16)
  return (
    <figure className="card step__fig fig">
      <svg viewBox="0 0 600 250" role="img" aria-label={`Schematic of a mountain valley seen by a radar from the left. ${t.label}: ${t.text}`}>
        <Satellite x={52} y={28} />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={66} y1={40} x2={170 + i * 95} y2={i === 0 ? 150 : i === 1 ? 196 : i === 2 ? 200 : i === 3 ? 84 : 200} stroke="var(--line-strong)" strokeWidth={1} strokeDasharray="3 4" />
        ))}
        {/* terrain: valley floor, a lake, a ridge, a second valley */}
        <path d="M0 210 L120 180 L190 200 L330 200 L400 60 L470 205 L600 190 L600 250 L0 250 Z" fill="var(--surface-2)" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
        {/* lake */}
        <path d="M212 200 L300 200" stroke="var(--cyan)" strokeWidth={5} strokeLinecap="round" opacity={k === 'ice' ? 1 : 0.9} />
        <text x={256} y={222} textAnchor="middle">lake</text>
        {/* shadow behind the ridge */}
        <g opacity={on('shadow')}>
          <path d="M400 60 L470 205 L560 194 Z" fill="#000" opacity={0.75} />
          <text x={520} y={150} className="fig__strong">no pulse here</text>
        </g>
        {/* layover in front of the ridge */}
        <g opacity={on('layover')}>
          <path d="M306 200 L330 200 L400 60 Z" fill="#fff" stroke="var(--ember)" strokeWidth={1.4} />
          <path d="M300 196 L334 196" stroke="var(--ember)" strokeWidth={5} strokeLinecap="round" />
          <text x={318} y={122} textAnchor="end" className="fig__strong">echoes pile up</text>
        </g>
        {/* wet snow in a hollow */}
        <g opacity={on('snow')}>
          <path d="M92 187 L120 180 L164 192" stroke="#fff" strokeWidth={7} strokeLinecap="round" fill="none" />
          <path d="M92 187 L120 180 L164 192" stroke="var(--cyan)" strokeWidth={2} strokeDasharray="1 5" strokeLinecap="round" fill="none" />
          <text x={124} y={166} textAnchor="middle" className="fig__strong">wet snow</text>
        </g>
        {/* ice on the lake */}
        <g opacity={on('ice')}>
          {[222, 240, 262, 284].map((x) => (
            <rect key={x} x={x} y={195} width={9} height={5} fill="#fff" stroke={INK} strokeWidth={0.7} />
          ))}
          <text x={256} y={184} textAnchor="middle" className="fig__strong">floes, ripples</text>
        </g>
      </svg>
      <div className="fig__controls">
        <div className="seg" role="group" aria-label="Case">
          {TRAPS.map((x) => (
            <button key={x.key} type="button" aria-pressed={k === x.key} onClick={() => setK(x.key)}>{x.label}</button>
          ))}
        </div>
      </div>
      <p aria-live="polite" style={{ fontSize: 14, color: 'var(--ink-2)', minHeight: '4.4em' }}>{t.text}</p>
      <p className="fig__note">Schematic, not data.</p>
    </figure>
  )
}

export default function ExplainerPage() {
  const index = useIndex()
  const timeline = useTimeline()
  const minArea = index.status === 'ready' && index.data.lakes.length ? Math.min(...index.data.lakes.map((l) => l.area_ha)) : null
  // the longest run of days without any clean NISAR look in the whole catalogue
  const gap = useMemo(() => {
    if (timeline.status !== 'ready') return null
    const c = timeline.data.coverage.nisar
    let best: [number, number] | null = null
    let start = -1
    for (let d = 0; d <= c.length; d++) {
      const empty = d < c.length && c[d] === 0
      if (empty && start < 0) start = d
      if (!empty && start >= 0) {
        if (start > 0 && d < c.length && (!best || d - start > best[1] - best[0])) best = [start, d]
        start = -1
      }
    }
    return best ? { from: timeline.data.days[best[0]], to: timeline.data.days[best[1] - 1], days: best[1] - best[0] } : null
  }, [timeline])

  return (
    <div className="wrap">
      <header className="page-head">
        <h1 className="h1">How radar sees a lake</h1>
        <p className="lead">
          A camera needs sunlight and a clear sky. A radar brings its own light: it sends a pulse of radio waves and
          records what comes back, by day and by night, with cloud or without. What comes back depends on the surface.
        </p>
      </header>

      <div className="explain">
        <section className="step">
          <div className="step__text">
            <p className="step__n">1</p>
            <h2 className="h2">Water is dark</h2>
            <p>
              The radar looks sideways. Calm water is a mirror tilted away from it: the pulse bounces off and never
              returns, so the lake is a dark patch. Rock, moraine and grass are rough, scatter the pulse in all
              directions, and some of it comes back.
            </p>
            <p>
              This app does not ask whether a basin is dark, but whether it is darker than a ring of ground around it.
              That difference, in decibels, is the number behind every dot on the map.
            </p>
          </div>
          <FigSurface />
        </section>

        <section className="step">
          <div className="step__text">
            <p className="step__n">2</p>
            <h2 className="h2">Two ways of listening: HH and HV</h2>
            <p>
              NISAR sends a wave that swings horizontally and records two answers: the part that returns swinging the
              same way (HH) and the part that returns turned upright (HV). A flat surface gives the wave back as it came.
              Only blocky, leafy or broken ground turns it.
            </p>
            <p>
              Water is dark in both, which makes the second channel a check on the other. Sentinel-1 does the same with
              a vertical wave: VV and VH.
            </p>
          </div>
          <FigPol />
        </section>

        <section className="step">
          <div className="step__text">
            <p className="step__n">3</p>
            <h2 className="h2">Two wavelengths: L-band and C-band</h2>
            <p>
              Smooth and rough are not properties of a surface alone. They depend on the wave that meets it. Ripples of
              a centimetre are already rough for the short C-band wave of Sentinel-1 and still a mirror for the long
              L-band wave of NISAR. The same holds for gravel, for snow crust and for small plants.
            </p>
            <p>
              So the two radars do not see the same lake the same way, and neither is simply the better one. That is why
              this project measures the difference on every lake rather than assuming it.{' '}
              <a href={href('results')}>What the season measured</a>.
            </p>
          </div>
          <FigBands />
        </section>

        <section className="step">
          <div className="step__text">
            <p className="step__n">4</p>
            <h2 className="h2">What can pass for water, or hide it</h2>
            <p>
              In the mountains a dark patch is not always a lake, and a lake is not always dark. Four effects matter
              most. The method answers each of them with a rule fixed in advance: the basin is compared with its own
              ring, dry control patches of the same shape show how often plain ground looks dark, orbits are never
              mixed, and a single dark look is not counted as a change.
            </p>
          </div>
          <FigTraps />
        </section>

        <section>
          <p className="step__n">5</p>
          <h2 className="h2" style={{ margin: '12px 0 16px' }}>What this method cannot see</h2>
          <ul className="cannot">
            <li className="card">
              <h3 className="h3">Lakes smaller than the catalogue</h3>
              <p>
                {minArea != null ? <>The smallest lake in the catalogue is <span className="num">{num(minArea, 2)}</span> ha. </> : null}
                Nothing is said about smaller water, and a 20 m radar pixel would hold only a few cells of it.
              </p>
            </li>
            <li className="card">
              <h3 className="h3">Depth and volume</h3>
              <p>Radar reads the surface. It cannot tell how much water a basin holds or how fast it would leave.</p>
            </li>
            <li className="card">
              <h3 className="h3">The cause</h3>
              <p>A step says that a basin changed between two passes. It does not say whether the lake drained by itself, was pumped down by engineers, froze, or lost its snow.</p>
            </li>
            <li className="card">
              <h3 className="h3">The time between passes</h3>
              <p>
                A lake can empty between two looks.
                {gap ? <> The NISAR record of this season has a gap of <span className="num">{gap.days}</span> days with no clean look of any lake, {dayMonth(gap.from)} to {dayMonth(gap.to)}.</> : null}
              </p>
            </li>
            <li className="card">
              <h3 className="h3">Lake area</h3>
              <p>Ice floes and wind brighten parts of the water, so the dark area is smaller than the lake. The app shows contrast and dark area, and never calls either one the area of the lake.</p>
            </li>
            <li className="card">
              <h3 className="h3">Hidden basins</h3>
              <p>A basin in radar shadow or under layover cannot be read from that orbit. Some lakes are seen well from one direction only, which is why each orbit is drawn as its own line.</p>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
