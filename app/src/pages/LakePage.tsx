// SI-assisted (Claude), NASA Space Apps 2026
import { useMemo, useState } from 'react'
import { useIndex, useLake, usePassport } from '../data/load'
import { Passport } from '../components/Passport'
import { SeriesChart, NISAR_COLORS, S1_COLORS, orbitsOf, pointsOf, type PolMode } from '../components/SeriesChart'
import { FrameViewer } from '../components/FrameViewer'
import { lakeCaption } from '../lib/captions'
import { href } from '../lib/router'
import { dayMonth, dayTime, db, granuleUrl, num, pct, signedDb } from '../lib/format'

const POLS: { key: PolMode; label: string }[] = [
  { key: 'co', label: 'HH and VV' },
  { key: 'cross', label: 'HV and VH' },
  { key: 'both', label: 'Both' },
]

export default function LakePage({ id }: { id: string }) {
  const index = useIndex()
  const lakeFile = useLake(id)
  const passport = usePassport()
  const pass = passport.status === 'ready' ? passport.data.lakes[id] : undefined
  const [pol, setPol] = useState<PolMode>('co')
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<string | null>(null)

  const lake = index.status === 'ready' ? index.data.lakes.find((l) => l.id === id) : undefined
  const file = lakeFile.status === 'ready' ? lakeFile.data : null
  const orbits = useMemo(() => (file ? orbitsOf(file) : { nisar: [], s1: [] }), [file])
  const points = useMemo(() => (file ? pointsOf(file) : []), [file])

  if (index.status === 'loading' || lakeFile.status === 'loading') {
    return <div className="wrap state" role="status">Loading the lake…</div>
  }
  if (!lake || !file || index.status !== 'ready' || lakeFile.status !== 'ready') {
    return (
      <div className="wrap state">
        <p>No data for a lake with the id {id}. <a href={href('map')}>Back to the map</a>.</p>
      </div>
    )
  }

  const caption = lakeCaption(lake, file)
  const toggle = (key: string) => {
    const next = new Set(hidden)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setHidden(next)
  }
  const counts = (sensor: 'nisar' | 's1', orbit: string) => {
    const rows = points.filter((p) => p.sensor === sensor && p.orbit === orbit)
    return { all: rows.length, clean: rows.filter((p) => p.quality === 'clean').length }
  }
  const hasEdge = file.series.nisar.some((r) => r.cls === 'swath_edge')
  const hasUnusable = file.series.nisar.some((r) => r.cls === 'unusable' || r.hh == null) || file.series.s1.some((r) => !r.usable)

  return (
    <div className="wrap lake">
      <p className="lake__back">
        <a href={href('map', { lake: lake.id })}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.500 5.500 8l4.500 4.500" /></svg>
          On the map
        </a>
      </p>
      <div className="lake__top">
        {passport.status === 'ready' && pass ? (
          <Passport file={passport.data} lake={pass} summary={lake} lakeId={id} as="h1" />
        ) : (
          <h1 className="h1">{lake.name ?? lake.id}</h1>
        )}
        <aside className="lake__aside" aria-labelledby="counts">
          <h2 className="lake__asideh" id="counts">The season in numbers</h2>
          <div className="lake__caption">
            {caption.map((c, i) => (
              <p key={i}>{c}</p>
            ))}
          </div>
          <dl className="lake__where">
            <div><dt>Position</dt><dd>{lake.lat.toFixed(4)}°N {lake.lon.toFixed(4)}°E</dd></div>
            <div><dt>Control patch</dt><dd>{lake.has_control ? 'has a dry control patch' : 'none'}</dd></div>
            {pass?.name && pass.name_source ? <div><dt>Name</dt><dd>{pass.name_source === 'osm' ? 'OpenStreetMap' : 'agency report'}</dd></div> : null}
          </dl>
        </aside>
      </div>

      <section aria-labelledby="series" className="section">
        <div className="lake__bar">
          <h2 className="h2" id="series">The season, look by look</h2>
          <div className="seg" role="group" aria-label="Polarisation">
            {POLS.map((p) => (
              <button key={p.key} type="button" aria-pressed={pol === p.key} onClick={() => setPol(p.key)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="orbits" role="group" aria-label="Orbits shown">
          {(['nisar', 's1'] as const).map((sensor) =>
            orbits[sensor].map((o, i) => {
              const c = counts(sensor, o)
              const color = (sensor === 'nisar' ? NISAR_COLORS : S1_COLORS)[i % 5]
              const key = `${sensor}:${o}`
              return (
                <button key={key} type="button" className="orbit" aria-pressed={!hidden.has(key)} onClick={() => toggle(key)}>
                  <i style={{ background: color }} aria-hidden="true" />
                  {sensor === 'nisar' ? 'L' : 'C'} {o}
                  <span className="orbit__n num">{c.clean}/{c.all}</span>
                </button>
              )
            }),
          )}
        </div>

        <div className="card lake__chart">
          <SeriesChart file={file} events={lake.events} season={index.data.season} pol={pol} hidden={hidden} selected={selected} onSelect={setSelected} />
        </div>

        <ul className="keys small">
          <li><svg width="22" height="10" aria-hidden="true"><line x1="0" x2="22" y1="5" y2="5" stroke="var(--ink-2)" strokeWidth="1.5" /><circle cx="11" cy="5" r="3.4" fill="var(--ink-2)" /></svg> clean look; each orbit is its own line, orbits are never averaged</li>
          {hasEdge ? <li><svg width="12" height="10" aria-hidden="true"><circle cx="6" cy="5" r="3.4" fill="none" stroke="var(--ink-2)" strokeWidth="1.4" strokeDasharray="2 1.5" /></svg> swath-edge look: the lake lies at the edge of the radar swath, where the calibration is weaker; shown, not joined, not used by the step rule</li> : null}
          {hasUnusable ? <li><svg width="12" height="10" aria-hidden="true"><path d="M3 2l6 6M9 2l-6 6" stroke="var(--ink-2)" strokeWidth="1.3" /></svg> a pass with no usable value (too few valid pixels over the basin or its ring)</li> : null}
          {lake.events.length ? <li><i className="keys__band" aria-hidden="true" /> radar step: the band spans the look before and the look after; the label gives the change and the orbit</li> : null}
          <li><svg width="12" height="10" aria-hidden="true"><path d="M6 0.5L10.5 5L6 9.5L1.5 5Z" fill="var(--optical)" /></svg> valid optical scene; short grey ticks are passes lost to cloud or low sun</li>
          <li>The number on each orbit button is clean looks out of all looks. Contrast depends on the viewing direction, so one orbit can see a lake that another cannot.</li>
        </ul>
      </section>

      {file.frames?.nisar?.length ? (
        <section className="section" aria-labelledby="frames">
          <h2 className="h2" id="frames">What the radar and the camera saw</h2>
          <FrameViewer sprites={file.frames.nisar} optical={file.frames.optical ?? []} events={lake.events} base={lakeFile.base} />
        </section>
      ) : null}

      {lake.events.length ? (
        <section className="section" aria-labelledby="steps">
          <h2 className="h2" id="steps">Radar steps</h2>
          <p className="small muted" style={{ maxWidth: '72ch', marginBottom: 10 }}>
            Raw output of the fixed rule, per radar and orbit. A step is not a confirmed change of the lake: melting snow, lake ice
            and wind on the water produce steps too.
          </p>
          <div className="scroll-x">
            <table className="data" style={{ minWidth: 620 }}>
              <thead>
                <tr>
                  <th scope="col">Radar, orbit</th>
                  <th scope="col">Look before</th>
                  <th scope="col">Look after</th>
                  <th scope="col">Change</th>
                  <th scope="col">Pattern</th>
                </tr>
              </thead>
              <tbody>
                {lake.events.map((e, i) => (
                  <tr key={i}>
                    <td>{e.sensor === 'nisar' ? 'L-band' : 'C-band'} {e.orbit}</td>
                    <td className="num">{dayTime(e.before)}</td>
                    <td className="num">{dayTime(e.after)}</td>
                    <td className="num">{signedDb(e.step_db)}</td>
                    <td>{e.kind === 'emptying' ? 'basin brightened, as when water leaves' : 'basin darkened, as when water arrives'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="looks">
        <h2 className="h2" id="looks">Every look, with its granule or image</h2>
        <details className="looks">
          <summary>Show the table of {num(points.length)} looks</summary>
          <div className="scroll-x">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Time (UTC)</th>
                  <th scope="col">Sensor</th>
                  <th scope="col">Orbit</th>
                  <th scope="col">Values</th>
                  <th scope="col">Class</th>
                  <th scope="col">Granule or image id</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => {
                  const url = p.sensor === 'optical' ? null : granuleUrl(p.sensor, p.id)
                  return (
                    <tr key={p.key}>
                      <td className="num" style={{ whiteSpace: 'nowrap' }}>{dayMonth(p.iso)} {p.iso.slice(11, 16)}</td>
                      <td>{p.sensor === 'nisar' ? 'NISAR' : p.sensor === 's1' ? `Sentinel-1${p.platform ? ` ${p.platform.slice(-1)}` : ''}` : 'Sentinel-2'}</td>
                      <td className="num">{p.orbit}</td>
                      <td className="num" style={{ whiteSpace: 'nowrap' }}>
                        {p.sensor === 'optical'
                          ? `water ${pct(p.co)}, clear ${pct(p.clear)}`
                          : `${p.sensor === 'nisar' ? 'HH' : 'VV'} ${db(p.co)}, ${p.sensor === 'nisar' ? 'HV' : 'VH'} ${db(p.cross)}`}
                      </td>
                      <td>{p.quality.replace('_', ' ')}</td>
                      <td className="mono looks__id">{url ? <a href={url} target="_blank" rel="noreferrer">{p.id}</a> : p.id}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </details>
      </section>
    </div>
  )
}
