// SI-assisted (Claude), NASA Space Apps 2026
// The dashboard: the map, one control (the week) and one panel. The panel shows the list of the chosen week; choosing
// a lake turns the same panel into its passport. On a phone the panel is a bottom sheet.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFile, useIndex, usePassport, useWeeks } from '../data/load'
import type { FlowPath } from '../components/FlowPathMap'
import type { TimelineFile, Week, WeekAfter, WeekListed } from '../data/types'
import { buildLooks, dayOf, latestAt, type Look } from '../data/derive'
import { LakeMap, type MapLake, type MapPadding, type MapTip } from '../components/LakeMap'
import { Panel, type Detent } from '../components/Panel'
import { Passport } from '../components/Passport'
import { Portrait } from '../components/Portrait'
import { TopBar } from '../components/TopBar'
import { WeekRuler, weekLong } from '../components/WeekRuler'
import { ContrastLegend } from '../components/ContrastLegend'
import { contrastColor } from '../lib/scale'
import { getWeek, setWeek, useWeek } from '../lib/weekStore'
import { href, replaceQuery } from '../lib/router'
import { SENSOR_LABEL, dayMonth, db, num, plural, regionName } from '../lib/format'
import { lakeName, openingWeek, usePhone } from '../lib/ui'

const WATER = '#3f93b8'
type Dots = 'list' | 'nisar' | 's1'
const DOTS: { key: Dots; label: string }[] = [
  { key: 'list', label: 'The list' },
  { key: 'nisar', label: 'L-band' },
  { key: 's1', label: 'C-band' },
]

const AFTER_LABEL: Record<string, string> = {
  emptied: 'Emptied',
  kept_water: 'Kept its water',
  lost_water_late: 'Lost water late',
  unknown: 'Not known',
}

function lookText(l: Look | null, days: string[]): string {
  if (!l) return 'No clean look of this radar yet.'
  const s = SENSOR_LABEL[l.sensor]
  const dark = l.c < 0 ? `basin ${db(Math.abs(l.c))} darker than its ring` : `basin ${db(Math.abs(l.c))} brighter than its ring`
  return `${dayMonth(days[l.d])}, ${s.band} ${s.co}, orbit ${l.orbit}: ${dark}.`
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function After({ after }: { after: WeekAfter }) {
  return (
    <p className={`after after--${after.kind}`}>
      <b>{AFTER_LABEL[after.kind] ?? after.kind}.</b> {after.line}
      {after.checked ? <span className="after__checked"> {cap(after.checked)}.</span> : null}
    </p>
  )
}

/** A folded part of the panel: things that are needed rarely stay one line until asked for. */
function Fold({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <details className="fold">
      <summary>
        <span>{title}</span>
        {count != null ? <span className="fold__n">{num(count)}</span> : null}
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg>
      </summary>
      <div className="fold__body">{children}</div>
    </details>
  )
}

export default function MapPage({ query }: { query: URLSearchParams }) {
  const index = useIndex()
  const weeksFile = useWeeks()
  const passport = usePassport()
  const flow = useFile<{ features: FlowPath[] }>('flowpaths.geojson')
  const phone = usePhone()

  const [selected, setSelected] = useState<string | null>(() => query.get('lake'))
  const [reveal, setReveal] = useState(false)
  const [dots, setDots] = useState<Dots>('list')
  const [basemap, setBasemap] = useState<'relief' | 'satellite'>('relief')
  const [layers, setLayers] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [detent, setDetent] = useState<Detent>(() => (query.get('lake') ? 'half' : 'peek'))
  const [sheetPx, setSheetPx] = useState(150)
  const timeline = useFile<TimelineFile>(dots === 'list' ? null : 'timeline.json')

  const weeks: Week[] = weeksFile.status === 'ready' ? weeksFile.data.weeks : []
  const counts = weeksFile.status === 'ready' ? weeksFile.data.counts : undefined
  const stored = useWeek()

  // the week comes from the address when it names one, else from the place the visitor left it, else the opening week
  const qWeek = query.get('week')
  useEffect(() => {
    if (!weeks.length) return
    const i = qWeek ? weeks.findIndex((w) => w.start === qWeek) : -1
    if (i >= 0) setWeek(i)
    else if (getWeek() == null) setWeek(openingWeek(weeks))
  }, [weeks, qWeek])
  const week = weeks.length ? Math.min(weeks.length - 1, Math.max(0, stored ?? openingWeek(weeks))) : 0
  const cur: Week | undefined = weeks[week]

  // a lake named by the address after the page is open (the command palette, a link)
  const qLake = query.get('lake')
  useEffect(() => {
    setSelected(qLake)
    if (qLake) setDetent((d) => (d === 'peek' ? 'half' : d))
  }, [qLake])

  useEffect(() => {
    if (!cur) return
    replaceQuery('map', { week: cur.start, lake: selected })
  }, [cur, selected])

  // the season plays week by week, and stops at its end or when the visitor takes the control
  useEffect(() => {
    if (!playing || !weeks.length) return
    const id = window.setInterval(() => {
      const w = getWeek() ?? 0
      if (w >= weeks.length - 1) setPlaying(false)
      else setWeek(w + 1)
    }, 1400)
    return () => window.clearInterval(id)
  }, [playing, weeks.length])
  const chooseWeek = useCallback((w: number) => {
    setPlaying(false)
    setWeek(w)
  }, [])
  const play = () => {
    if (!playing && week >= weeks.length - 1) setWeek(0)
    setPlaying((p) => !p)
  }

  const lakes = index.status === 'ready' ? index.data.lakes : []
  const byId = useMemo(() => new Map(lakes.map((l) => [l.id, l])), [lakes])
  const pass = passport.status === 'ready' ? passport.data.lakes : null
  const nameOf = useCallback((id: string) => lakeName(id, pass, byId.get(id)?.name), [pass, byId])
  const paths = useMemo(() => (flow.status === 'ready' ? new Map(flow.data.features.map((f) => [f.properties.lake_id, f])) : null), [flow])
  const listed = useMemo(() => new Map<string, WeekListed>((cur?.listed ?? []).map((l) => [l.id, l])), [cur])

  /** season-wide: does any line of the passport ask for a look? */
  const attention = useMemo(() => {
    const s = new Set<string>()
    if (pass) for (const [id, p] of Object.entries(pass)) if (Object.values(p.indicators).some((i) => i.tone === 'attention')) s.add(id)
    return s
  }, [pass])

  const days = timeline.status === 'ready' ? timeline.data.days : null
  const looks = useMemo(() => (timeline.status === 'ready' ? buildLooks(timeline.data) : null), [timeline])
  const day = days && cur ? Math.min(days.length - 1, Math.max(0, dayOf(cur.end, days[0]))) : 0

  const mapLakes = useMemo<MapLake[]>(() => {
    return lakes.map((l) => {
      const radar = dots !== 'list' && looks
      const look = radar ? latestAt(looks.get(l.id)?.[dots] ?? [], day) : null
      return {
        id: l.id,
        lon: l.lon,
        lat: l.lat,
        listed: dots === 'list' && listed.has(l.id),
        attention: dots === 'list' && attention.has(l.id),
        size: l.area_ha >= 10 ? 1.3 : l.area_ha >= 2 ? 1 : 0.82,
        color: radar ? (look ? contrastColor(look.c) : '#f4f1e8') : WATER,
        faded: !!radar && !look,
      }
    })
  }, [lakes, listed, attention, dots, looks, day])

  const refs = useRef({ listed, dots, looks, day, days })
  refs.current = { listed, dots, looks, day, days }
  const tooltip = useCallback(
    (id: string): MapTip => {
      const l = byId.get(id)
      const r = refs.current
      const item = r.listed.get(id)
      const name = nameOf(id)
      let line: string
      if (r.dots !== 'list') line = r.looks ? lookText(latestAt(r.looks.get(id)?.[r.dots] ?? [], r.day), r.days ?? []) : ''
      else if (item) line = item.reasons[0]?.line ?? ''
      else line = pass?.[id]?.summary ?? ''
      return {
        title: name,
        meta: [name !== id ? id : null, l ? regionName(l.region) : null].filter(Boolean).join(' · '),
        line,
        listed: !!item && r.dots === 'list',
      }
    },
    [byId, nameOf, pass],
  )

  const select = useCallback(
    (id: string | null) => {
      setSelected(id)
      if (id) setDetent((d) => (d === 'peek' ? 'half' : d))
    },
    [],
  )

  // lakes that were on the list in an earlier week and are not on it now, with what happened to them
  const earlier = useMemo(() => {
    if (!cur) return []
    const now = new Set(cur.listed.map((l) => l.id))
    const seen = new Map<string, { id: string; last: number; after?: WeekAfter | null }>()
    for (let i = 0; i < week; i++) for (const l of weeks[i].listed) if (!now.has(l.id)) seen.set(l.id, { id: l.id, last: i, after: l.after })
    return [...seen.values()].sort((a, b) => b.last - a.last || a.id.localeCompare(b.id))
  }, [weeks, week, cur])

  const padding: MapPadding = phone
    ? { top: 56, right: 0, bottom: Math.min(sheetPx, Math.round(window.innerHeight * 0.5)), left: 0 }
    : { top: 8, right: 48, bottom: 104, left: 456 }

  // close the layer popover on a press outside it
  const layerBox = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!layers) return
    const down = (e: PointerEvent) => {
      if (!layerBox.current?.contains(e.target as Node)) setLayers(false)
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setLayers(false)
    window.addEventListener('pointerdown', down)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('keydown', key)
    }
  }, [layers])

  // Escape closes the passport and returns to the list
  useEffect(() => {
    if (!selected) return
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented && !document.querySelector('.palette, .menu.is-open, .layers.is-open')) select(null)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [selected, select])

  if (index.status === 'loading' || weeksFile.status === 'loading') {
    return (
      <div className="dash dash--wait" role="status">
        <p>Loading the lakes and the season…</p>
      </div>
    )
  }
  if (index.status === 'missing') {
    return (
      <div className="dash dash--wait">
        <p>The lake catalogue is not available yet.</p>
      </div>
    )
  }

  const selLake = selected ? byId.get(selected) : undefined
  const selPass = selected && pass ? pass[selected] : undefined
  const n = cur?.listed.length ?? 0
  const title = n ? `${plural(n, 'lake')} on the list` : 'No lake on the list'

  const ruler = cur ? <WeekRuler weeks={weeks} week={week} onWeek={chooseWeek} playing={playing} onPlay={play} /> : null

  const head = (
    <>
      {phone ? ruler : <TopBar page="map" variant="panel" />}
      {selected ? (
        <div className="phead phead--lake">
          <button type="button" className="phead__back" onClick={() => select(null)}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.500 5.500 8l4.500 4.500" /></svg>
            <span>{title}</span>
          </button>
          {phone ? <span className="phead__now">{selLake ? nameOf(selLake.id) : selected}</span> : null}
        </div>
      ) : (
        <div className="phead">
          <h1 className="phead__title">{title}</h1>
          {cur ? <p className="phead__sub">{weekLong(cur)}</p> : null}
        </div>
      )}
    </>
  )

  const row = (item: WeekListed) => {
    const l = byId.get(item.id)
    const p = pass?.[item.id]
    const name = p?.name ?? l?.name ?? null
    return (
      <li key={item.id}>
        <button type="button" className="wrow" onClick={() => select(item.id)}>
          <Portrait id={item.id} showcase={!!l?.showcase} until={cur?.end} size="thumb" />
          <span className="wrow__text">
            <span className="wrow__name">{name ?? item.id}</span>
            <span className="wrow__meta">
              {name ? `${item.id} · ` : ''}
              {l ? regionName(l.region) : ''}
              {!name && p?.near_name ? `, near ${p.near_name}` : ''}
            </span>
            {item.reasons.map((r) => (
              <span key={r.key} className="wrow__why">{r.line}</span>
            ))}
            {reveal && item.after ? <After after={item.after} /> : null}
          </span>
        </button>
      </li>
    )
  }

  const body = selected ? (
    selLake && selPass && passport.status === 'ready' ? (
      <Passport key={selLake.id} file={passport.data} lake={selPass} summary={selLake} lakeId={selLake.id} until={cur?.end} onMap as={phone ? 'h2' : 'h1'}>
        <a className="passport__full" href={href(`lake/${selLake.id}`)}>
          <span>
            <b>The full record</b>
            <small>every look of both radars, the frames, the tables</small>
          </span>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9.500M8.500 4l4 4-4 4" /></svg>
        </a>
      </Passport>
    ) : passport.status === 'loading' ? (
      <p className="panel__note" role="status">Loading the passport…</p>
    ) : (
      <div className="panel__note">
        <p>There is no lake with the id {selected} in the catalogue.</p>
        <button type="button" className="btn btn--sm btn--quiet" onClick={() => select(null)}>Back to the list</button>
      </div>
    )
  ) : cur ? (
    <div className="wk">
      <p className="wk__note">A replay of what was known by the end of that week, not a forecast.</p>
      {n ? (
        <>
          <label className="switch">
            <input type="checkbox" checked={reveal} onChange={(e) => setReveal(e.target.checked)} />
            <span className="switch__track" aria-hidden="true"><i /></span>
            <span>Show what happened next</span>
          </label>
          <ol className="wrows">{cur.listed.map(row)}</ol>
        </>
      ) : (
        <p className="wk__empty">
          By {dayMonth(cur.end)} no lake met a rule of the list: no record fill, no lake inside its usual emptying window,
          no step seen by both radars.
        </p>
      )}

      {cur.one_radar.length ? (
        <Fold title="One radar only, not confirmed" count={cur.one_radar.length}>
          <p className="fold__lead">A step seen by one radar only does not put a lake on the list.</p>
          <ul className="minilist">
            {cur.one_radar.map((o, i) => (
              <li key={`${o.id}-${o.sensor}-${i}`}>
                <button type="button" onClick={() => select(o.id)}>{nameOf(o.id)}</button>
                <span>{o.line}</span>
                {reveal && o.after ? <After after={o.after} /> : null}
              </li>
            ))}
          </ul>
        </Fold>
      ) : null}
      {earlier.length ? (
        <Fold title="Listed in earlier weeks, and what happened" count={earlier.length}>
          <ul className="minilist">
            {earlier.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => select(e.id)}>{nameOf(e.id)}</button>
                <span>last listed {weekLong(weeks[e.last])}</span>
                {e.after ? <After after={e.after} /> : <p className="after">No outcome in the data file.</p>}
              </li>
            ))}
          </ul>
        </Fold>
      ) : null}
      {counts?.called_lakes != null ? (
        <Fold title="How the list did over the season">
          <p className="fold__lead">
            Over {num(counts.weeks ?? weeks.length)} weeks the list named <b>{num(counts.lakes_ever_listed)}</b> lakes.{' '}
            <b>{num(counts.called_lakes)}</b> of them were calls, made before the outcome: fuller than ever, or due by their
            earlier summers. Of these, <b>{num(counts.called_that_emptied)}</b> emptied,{' '}
            <b>{num(counts.called_that_lost_water_late)}</b> lost water late in the season,{' '}
            <b>{num(counts.called_that_kept_water)}</b> kept their water (there the list was wrong), and for{' '}
            <b>{num(counts.called_unknown)}</b> the outcome is not known.
          </p>
          {counts.observed_lakes != null ? (
            <p className="fold__lead">
              The other <b>{num(counts.observed_lakes)}</b> were listed because both radars saw the change that week: an
              observation, not a call, and not counted as right.
              {counts.one_radar_steps != null ? <> Steps seen by one radar only, never listed: <b>{num(counts.one_radar_steps)}</b>.</> : null}{' '}
              <a href={href('results')}>All results</a>
            </p>
          ) : null}
        </Fold>
      ) : null}
    </div>
  ) : (
    <p className="panel__note">The weekly list is not available yet. The map shows every lake of the catalogue.</p>
  )

  return (
    <div className={`dash${phone ? ' dash--phone' : ''}`}>
      {phone ? null : <h2 className="sr-only">Map</h2>}
      <section className="dash__map" aria-label="Map of the lakes">
        <LakeMap
          lakes={mapLakes}
          selected={selected}
          onSelect={select}
          tooltip={tooltip}
          paths={paths}
          padding={padding}
          basemap={basemap}
          label="Map of the lakes. The list of the week in the panel gives the same lakes as text."
        />
      </section>

      {phone ? (
        <div className="dash__top">
          <TopBar page="map" variant="float" />
        </div>
      ) : null}

      <div className={`layers${layers ? ' is-open' : ''}`} ref={layerBox}>
        <button type="button" className="layers__btn glass" aria-expanded={layers} aria-controls="layers-pop" onClick={() => setLayers((v) => !v)} aria-label="Map layers and legend">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 2 6 3.200-6 3.200-6-3.200L8 2Z" /><path d="m2.800 8.300 5.200 2.800 5.200-2.800M2.800 11.200 8 14l5.200-2.800" /></svg>
        </button>
        <div className="layers__pop glass" id="layers-pop" hidden={!layers}>
          <p className="layers__h">Ground</p>
          <div className="seg" role="group" aria-label="Ground of the map">
            <button type="button" aria-pressed={basemap === 'relief'} onClick={() => setBasemap('relief')}>Relief</button>
            <button type="button" aria-pressed={basemap === 'satellite'} onClick={() => setBasemap('satellite')}>Satellite</button>
          </div>
          <p className="layers__h">Dots</p>
          <div className="seg" role="group" aria-label="What the dots show">
            {DOTS.map((d) => (
              <button key={d.key} type="button" aria-pressed={dots === d.key} onClick={() => setDots(d.key)}>{d.label}</button>
            ))}
          </div>
          {dots === 'list' ? (
            <ul className="legend">
              <li><i className="legend__dot legend__dot--listed" /> on the list of the chosen week</li>
              <li><i className="legend__dot legend__dot--attn" /> a line of its passport asks for a look, over the whole season</li>
              <li><i className="legend__dot" /> every other lake of the catalogue</li>
              <li><i className="legend__line" /> where the water of the chosen lake would run, with people living within 1 km of the river: exposure, not risk</li>
            </ul>
          ) : (
            <div className="legend legend--radar">
              <ContrastLegend />
              <p>
                {dots === 'nisar' ? 'NISAR L-band HH' : 'Sentinel-1 C-band VV'}: the latest clean look of each lake up to the end of
                the chosen week. {timeline.status === 'loading' ? 'Loading the looks…' : timeline.status === 'missing' ? 'The file of looks is not available.' : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {phone ? null : <div className="dash__ruler glass">{ruler}</div>}

      <Panel
        phone={phone}
        header={head}
        detent={detent}
        onDetent={setDetent}
        onVisible={setSheetPx}
        contentKey={selected ?? `week-${week}`}
        label={selected ? 'Lake passport' : 'The list of the week'}
      >
        {body}
      </Panel>
    </div>
  )
}
