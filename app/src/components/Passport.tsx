// SI-assisted (Claude), NASA Space Apps 2026
// The lake passport, one object: a portrait (the NISAR frame of the lake up to the chosen week), the name, one
// sentence, then seven lines in a fixed order, like the fields of a form. A line that asks for a look is inked,
// marked in the red pencil and shows its sentence; the others stay one quiet line; what could not be measured is
// pale. The evidence of a line (facts, images, sources, how far it was checked) opens under it.
// Every sentence and number is text of passport.json; the app adds none.
import { lazy, Suspense, useState, type ReactNode } from 'react'
import { useDamMeta, useFile } from '../data/load'
import type { FlowPath } from './FlowPathMap'
import type { LakeSummary, PassportFile, PassportIndicator, PassportIndicatorDef, PassportLake } from '../data/types'
import { href } from '../lib/router'
import { dayMonth, num, regionName, sizeClass } from '../lib/format'
import { Linked } from './Prose'
import { Portrait } from './Portrait'

export type Tone = 'attention' | 'neutral' | 'unknown'

export function toneOf(ind: PassportIndicator | undefined): Tone {
  if (!ind || ind.state === 'pending') return 'unknown'
  return ind.tone === 'attention' ? 'attention' : ind.tone === 'unknown' ? 'unknown' : 'neutral'
}

/** What the mark of a line says to a screen reader. These words name the tone of the data file; they carry no number. */
const TONE_WORD: Record<Tone, string> = {
  attention: 'asks for a look',
  neutral: 'measured, nothing unusual',
  unknown: 'could not be measured',
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const full = (s: string) => `${s.replace(/[.\s]+$/, '')}.`

function Figures({ title, children, note }: { title: string; children: ReactNode; note?: (string | undefined)[] }) {
  return (
    <div className="pfig">
      <p className="pfig__title">{title}</p>
      <div className="pfig__row">{children}</div>
      {note?.filter(Boolean).map((n, i) => <p key={i} className="pline__check">{n}</p>)}
    </div>
  )
}

function DamImages({ id }: { id: string }) {
  const meta = useDamMeta(id)
  if (meta.status !== 'ready') return null
  const m = meta.data
  const pair = m.phase_png?.pair
  return (
    <Figures title="NISAR interferometry of the ground around the lake" note={[m.product]}>
      {m.stack_png ? (
        <figure>
          <img src={`${meta.base}dam/${m.stack_png.file}`} alt={`Mean line-of-sight motion around ${id} over the season, NISAR orbit ${m.orbit ?? ''}`} loading="lazy" />
          <figcaption>
            Mean of {m.stack_png.pairs?.length ?? 'all'} twelve-day pairs, orbit {m.orbit}. {m.sign ? full(cap(m.sign)) : ''}
          </figcaption>
        </figure>
      ) : null}
      {m.phase_png ? (
        <figure>
          <img src={`${meta.base}dam/${m.phase_png.file}`} alt={`One twelve-day interferogram around ${id}`} loading="lazy" />
          <figcaption>
            One pair{pair ? `, ${dayMonth(pair[0])} to ${dayMonth(pair[1])}` : ''}.{' '}
            {m.phase_png.grey_where ? `Grey where ${m.phase_png.grey_where}. ` : ''}
            {m.quantity ? `Shown: ${full(m.quantity)}` : ''}
          </figcaption>
        </figure>
      ) : null}
    </Figures>
  )
}

interface IceMeta {
  product?: string
  orbit?: string
  quantity?: string
  unit?: string
  range_m_per_day?: [number, number]
  lines?: string
  limits?: string
  images?: Record<string, { file: string; n_pairs?: number }>
}

/** The NISAR offset image of the glacier beside the lake, where the ice session made one. */
function IceImages({ id }: { id: string }) {
  const meta = useFile<IceMeta>(`ice/${encodeURIComponent(id)}.json`)
  if (meta.status !== 'ready') return null
  const m = meta.data
  const img = m.images?.layer1 ?? Object.values(m.images ?? {})[0]
  if (!img) return null
  return (
    <Figures title="NISAR pixel offsets of the glacier beside the lake" note={[m.limits, m.product]}>
      <figure>
        <img src={`${meta.base}ice/${img.file}`} alt={`Apparent glacier speed beside ${id} from NISAR pixel offsets, orbit ${m.orbit ?? ''}`} loading="lazy" />
        <figcaption>
          {m.quantity ? `${full(cap(m.quantity))} ` : ''}
          {m.range_m_per_day ? `Colour scale ${m.range_m_per_day[0]} to ${m.range_m_per_day[1]} ${m.unit ?? ''}. ` : ''}
          {img.n_pairs ? `Median over ${img.n_pairs} pairs, orbit ${m.orbit}. ` : ''}
          {m.lines ? full(cap(m.lines)) : ''}
        </figcaption>
      </figure>
    </Figures>
  )
}

const FlowPathMap = lazy(() => import('./FlowPathMap'))

/** The flow path of the lake on a small map: only on the page of the lake, where no large map is next to the passport. */
function PeoplePath({ id, at }: { id: string; at: { lon: number; lat: number } }) {
  const flow = useFile<{ features: FlowPath[] }>('flowpaths.geojson')
  if (flow.status === 'loading') return <div className="flowmap flowmap--wait" aria-hidden="true" />
  if (flow.status !== 'ready') return null
  const f = flow.data.features.find((x) => x.properties.lake_id === id)
  if (!f || f.geometry.coordinates.length < 2) return null
  return (
    <figure className="pfig pfig--map">
      <Suspense fallback={<div className="flowmap flowmap--wait" />}>
        <FlowPathMap path={f} lake={at} />
      </Suspense>
      <figcaption>
        Where the water of the lake would run, traced down the valley for {f.properties.path_km != null ? `${Math.round(f.properties.path_km)} km` : 'up to 50 km'}.
        The numbers count people living within 1 km of the river below the lake: exposure, not risk.
      </figcaption>
    </figure>
  )
}

interface LineProps {
  def: PassportIndicatorDef
  ind: PassportIndicator | undefined
  lakeId: string
  at?: { lon: number; lat: number }
  onMap: boolean
  open: boolean
  onToggle: () => void
}

function Line({ def, ind, lakeId, at, onMap, open, onToggle }: LineProps) {
  const tone = toneOf(ind)
  const panelId = `pp-${def.key}-more`
  const hasImages = !!(ind as { images?: string[] } | undefined)?.images?.length
  return (
    <li className={`pline pline--${tone}${open ? ' is-open' : ''}`}>
      <button type="button" className="pline__row" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
        <span className={`tone tone--${tone}`} aria-hidden="true" />
        <span className="pline__name">{def.title}</span>
        <span className="pline__state">
          <span className="sr-only">{TONE_WORD[tone]}: </span>
          {ind ? cap(ind.state) : 'Being measured'}
        </span>
        <svg className="pline__chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg>
      </button>
      {/* the sentence of a line that asks for a look is part of the passport's face, not of the fold */}
      {tone === 'attention' && ind?.line ? <p className="pline__why">{ind.line}</p> : null}
      <div className="pline__fold" id={panelId} hidden={!open}>
        <div className="pline__more">
          {def.question ? <p className="pline__q">{def.question}</p> : null}
          {tone !== 'attention' && ind?.line ? <p className="pline__line">{ind.line}</p> : null}
          {def.key === 'dam' && hasImages ? <DamImages id={lakeId} /> : null}
          {def.key === 'ice' && hasImages ? <IceImages id={lakeId} /> : null}
          {def.key === 'people' && at && !onMap ? <PeoplePath id={lakeId} at={at} /> : null}
          {def.key === 'people' && onMap ? <p className="pline__q">The river below the lake is drawn on the map, with the count at 10, 25 and 50 km.</p> : null}
          {ind?.facts?.length ? (
            <dl className="pfacts">
              {ind.facts.map(([k, v], n) => (
                <div key={n}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {ind?.links?.length ? (
            <ul className="plinks">
              {ind.links.map((l) => <li key={l}><Linked text={l} /></li>)}
            </ul>
          ) : null}
          <p className="pline__check">
            {ind?.checked ? <>How far it was checked: {full(ind.checked)} </> : null}
            {def.source ? <>Source: {full(def.source)} </> : null}
            <a href={href('method')}>Method</a>
          </p>
        </div>
      </div>
    </li>
  )
}

interface Props {
  file: PassportFile
  lake: PassportLake
  summary?: LakeSummary
  lakeId: string
  /** the frame of the portrait is the latest one up to this day */
  until?: string | null
  /** the passport lies beside the large map (the dashboard) and not on a page of its own */
  onMap?: boolean
  /** element of the title: h1 on the page of the lake, h2 in the panel */
  as?: 'h1' | 'h2'
  /** whatever follows the lines, inside the same object (a link to the full record) */
  children?: ReactNode
}

export function Passport({ file, lake, summary, lakeId, until, onMap = false, as = 'h2', children }: Props) {
  // indicators that exist only for some lakes (agency reports) are left out where the lake has none
  const defs = file.indicators.filter((d) => d.key !== 'agency' || lake.indicators[d.key])
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (k: string) =>
    setOpen((s) => {
      const next = new Set(s)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  const asks = defs.filter((d) => toneOf(lake.indicators[d.key]) === 'attention').length
  const blind = defs.filter((d) => toneOf(lake.indicators[d.key]) === 'unknown').length
  const Title = as
  const title = lake.name ?? summary?.name ?? null

  return (
    <article className={`passport${onMap ? ' passport--panel' : ' passport--page'}`} aria-labelledby="passport-title">
      <header className="passport__head">
        <Portrait id={lakeId} showcase={!!summary?.showcase} until={until} size="card" stamp />
        <div className="passport__id">
          <Title className="passport__title" id="passport-title">
            {title ?? lakeId}
          </Title>
          <p className="passport__meta">
            {title ? <span>{lakeId}</span> : null}
            {!title && lake.near_name ? <span>near {lake.near_name}</span> : null}
            {summary ? <span>{regionName(summary.region)}</span> : null}
            {summary?.elev_m != null ? <span>{num(summary.elev_m)} m</span> : null}
            {summary ? <span>{sizeClass(summary.area_ha).label}</span> : null}
          </p>
        </div>
      </header>

      {lake.summary ? <p className="passport__lede">{lake.summary}</p> : null}

      <p className="passport__tally">
        {asks > 0 ? <><b>{asks} of {defs.length}</b> lines ask for a look</> : <>None of the {defs.length} lines asks for a look</>}
        {blind > 0 ? <>, {blind} could not be measured</> : null}.
      </p>

      <ol className="plines">
        {defs.map((d) => (
          <Line key={d.key} def={d} ind={lake.indicators[d.key]} lakeId={lakeId} at={summary ? { lon: summary.lon, lat: summary.lat } : undefined} onMap={onMap} open={open.has(d.key)} onToggle={() => toggle(d.key)} />
        ))}
      </ol>

      {lake.unknowns?.length ? (
        <section className="passport__cannot" aria-label="What this passport cannot tell">
          <h3>What this passport cannot tell</h3>
          <ul>
            {lake.unknowns.map((u, n) => <li key={n}>{u}</li>)}
          </ul>
        </section>
      ) : null}
      {children}
    </article>
  )
}
