// SI-assisted (Claude), NASA Space Apps 2026
// The start page. One sentence over the Earth seen from orbit; scrolling brings the camera down to the ranges above
// Almaty, where the lakes on the list of the week are marked and named, with a real radar frame and the reason;
// from there one press opens the dashboard. Everything is read from weeks.json, passport.json, results.json and
// index.json. A still of the globe is shown at once and replaced by the live globe when its tiles are in.
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFile, useIndex, usePassport, useResults, useWeeks, verifiedResults } from '../data/load'
import type { HeroLake } from '../components/HeroGlobe'
import { Portrait } from '../components/Portrait'
import { TopBar } from '../components/TopBar'
import { WeekRuler, weekLong } from '../components/WeekRuler'
import { setWeek, useWeek } from '../lib/weekStore'
import { href } from '../lib/router'
import { num, plural, regionName } from '../lib/format'
import { openingWeek, usePhone, useReducedMotion } from '../lib/ui'

const HeroGlobe = lazy(() => import('../components/HeroGlobe'))

/** Where the camera comes down: between the Ile Alatau, the Terskey and the Zhetysu Alatau, so that all three ranges are in view. */
const TARGET: [number, number] = [78.9, 43.45]
/** How many lakes of the week are shown on the start page; the dashboard has them all. */
const SHOWN = 3

export function Landing() {
  const index = useIndex()
  const weeksFile = useWeeks()
  const passport = usePassport()
  const results = useResults()
  const res = verifiedResults(results)
  const stored = useWeek()
  const reduced = useReducedMotion()
  const phone = usePhone()

  const lakes = index.status === 'ready' ? index.data.lakes : []
  const byId = useMemo(() => new Map(lakes.map((l) => [l.id, l])), [lakes])
  const weeks = weeksFile.status === 'ready' ? weeksFile.data.weeks : []
  const names = passport.status === 'ready' ? passport.data.lakes : null
  const week = weeks.length ? Math.min(weeks.length - 1, Math.max(0, stored ?? openingWeek(weeks))) : 0
  const cur = weeks[week]
  // the opening week is written to the store so that the dashboard opens on the same week
  useEffect(() => {
    if (weeks.length && stored == null) setWeek(openingWeek(weeks))
  }, [weeks, stored])

  // ----- the descent: camera progress follows the scroll, or a press on the week control -----
  const wrap = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const progress = useRef(reduced ? 1 : 0)
  const forced = useRef(0)
  const [down, setDown] = useState(reduced)
  const [globeReady, setGlobeReady] = useState(false)

  useEffect(() => {
    if (reduced) {
      progress.current = 1
      stage.current?.style.setProperty('--p', '1')
      setDown(true)
      return
    }
    let raf = 0
    let last = -1
    const tick = () => {
      const el = wrap.current
      if (el) {
        const r = el.getBoundingClientRect()
        const span = Math.max(1, el.offsetHeight - window.innerHeight)
        const scrolled = Math.max(0, Math.min(1, -r.top / span))
        const p = Math.max(scrolled, forced.current)
        progress.current = p
        if (Math.abs(p - last) > 0.002) {
          last = p
          stage.current?.style.setProperty('--p', p.toFixed(3))
          const d = p > 0.6
          setDown((v) => (v === d ? v : d))
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  const goDown = () => {
    const el = wrap.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY + (el.offsetHeight - window.innerHeight)
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' })
  }

  const listed = useMemo(() => new Set(cur?.listed.map((l) => l.id) ?? []), [cur])
  // flow paths are fetched only once the globe stands, so that they never delay the first view
  const flow = useFile<{ type: 'FeatureCollection'; features: { properties: { lake_id: string } }[] }>(globeReady ? 'flowpaths.geojson' : null)
  const paths = useMemo(() => {
    if (flow.status !== 'ready') return null
    return { type: 'FeatureCollection' as const, features: flow.data.features.filter((f) => listed.has(f.properties.lake_id)) }
  }, [flow, listed])
  const heroLakes: HeroLake[] = useMemo(() => lakes.map((l) => ({ id: l.id, lon: l.lon, lat: l.lat, listed: listed.has(l.id) })), [lakes, listed])

  const n = cur?.listed.length ?? 0
  // lakes with a radar frame come first: the page shows the lake itself, not only its name
  const shown = useMemo(() => {
    if (!cur) return []
    const withFrame = cur.listed.filter((l) => byId.get(l.id)?.showcase)
    const rest = cur.listed.filter((l) => !byId.get(l.id)?.showcase)
    return [...withFrame, ...rest].slice(0, phone ? 2 : SHOWN)
  }, [cur, byId, phone])

  const totals = lakes.reduce(
    (a, l) => {
      a.nisar += l.n_clean.nisar
      a.s1 += l.n_clean.s1
      a.optical += l.n_clean.optical
      return a
    },
    { nisar: 0, s1: 0, optical: 0 },
  )
  const dashLabel = n ? `${plural(n, 'lake')} this week` : 'Every lake, every week'

  return (
    <>
      <section ref={wrap} className={`sky${reduced ? ' sky--still' : ''}${down ? ' is-down' : ''}`} aria-labelledby="hero-h">
        <div className="sky__stage" ref={stage}>
          <div className="sky__globe" aria-hidden="true">
            {lakes.length && !reduced ? (
              <Suspense fallback={null}>
                <HeroGlobe lakes={heroLakes} paths={paths} progress={progress} target={TARGET} reducedMotion={reduced} onReady={() => setGlobeReady(true)} />
              </Suspense>
            ) : null}
            <div className={`sky__still${globeReady ? ' is-gone' : ''}`} />
            <div className="sky__shade" />
          </div>

          <header className="sky__bar wrap">
            <TopBar page="" variant="night" />
          </header>

          <div className="sky__copy wrap">
            <h1 className="sky__title" id="hero-h">
              <span>Which glacial lake</span>
              <span className="sky__look">needs a look</span>
              <span>this week?</span>
            </h1>
            <p className="sky__sub">
              {lakes.length ? `${num(lakes.length)} glacial lakes` : 'The glacial lakes'} of the northern Tien Shan, replayed week
              by week through 2026 from what two radars, NISAR and Sentinel-1, and optics had shown by then.
              A replay of what was known, not a forecast.
            </p>
            <div className="sky__cta">
              <a className="swapbtn" href={href('map')}>
                <span className="swapbtn__a">Open the dashboard</span>
                <span className="swapbtn__b" aria-hidden="true">{dashLabel}</span>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9.500M8.500 4l4 4-4 4" /></svg>
              </a>
              {reduced ? null : (
                <button type="button" className="sky__more" onClick={goDown}>
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v9.500M4 8.500l4 4 4-4" /></svg>
                  Come down to the lakes
                </button>
              )}
            </div>
          </div>

          {cur ? (
            <div className="sky__dock" aria-label="The list of the week" role="region" inert={!down && !reduced}>
              <div className="dock glass">
                <div className="dock__head">
                  <p className="dock__title">
                    <b>{n ? `${plural(n, 'lake')} on the list` : 'No lake on the list'}</b>
                    <span>{weekLong(cur)}</span>
                  </p>
                  <WeekRuler weeks={weeks} week={week} onWeek={setWeek} />
                </div>
                {shown.length ? (
                  <ol className="dock__lakes">
                    {shown.map((item) => {
                      const l = byId.get(item.id)
                      const p = names?.[item.id]
                      const name = p?.name ?? l?.name ?? null
                      return (
                        <li key={item.id}>
                          <a className="dlake" href={href('map', { week: cur.start, lake: item.id })}>
                            <Portrait id={item.id} showcase={!!l?.showcase} until={cur.end} size="card" />
                            <span className="dlake__text">
                              <span className="dlake__name">{name ?? item.id}</span>
                              <span className="dlake__meta">
                                {name ? `${item.id} · ` : ''}
                                {l ? regionName(l.region) : ''}
                              </span>
                              <span className="dlake__why">{item.reasons[0]?.line}</span>
                              {item.reasons.length > 1 ? <span className="dlake__more">and {item.reasons.length - 1} more reason{item.reasons.length > 2 ? 's' : ''}</span> : null}
                            </span>
                          </a>
                        </li>
                      )
                    })}
                  </ol>
                ) : (
                  <p className="dock__none">By the end of this week no lake met a rule of the list.</p>
                )}
                <div className="dock__foot">
                  <a className="btn" href={href('map', { week: cur.start })}>
                    {n > shown.length ? `All ${n} on the map` : 'Open the dashboard'}
                    <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h9.500M8.500 4l4 4-4 4" /></svg>
                  </a>
                  <span className="dock__key"><i /> marked on the terrain behind, with the river below each lake</span>
                </div>
              </div>
            </div>
          ) : weeksFile.status === 'missing' ? (
            <div className="sky__dock">
              <div className="dock glass">
                <p className="dock__none">The weekly list is not available yet. <a href={href('map')}>Open the map of all lakes</a>.</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="paper">
        {res?.facts?.length ? (
          <section className="wrap proof" aria-labelledby="proof-h">
            <h2 className="proof__h" id="proof-h">What the season showed, <em>checked</em></h2>
            <ol className="proof__grid">
              {res.facts.map((f) => (
                <li key={f.value + f.label}>
                  <a href={href(f.link ?? 'results')}>
                    <span className="proof__value">{f.value}</span>
                    <span className="proof__label">{f.label}</span>
                    {f.line ? <span className="proof__line">{f.line}</span> : null}
                    <span className="proof__more">
                      {f.link_text ?? 'How this was measured'}
                      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9.500M8.500 4l4 4-4 4" /></svg>
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="wrap close" aria-labelledby="close-h">
          <h2 className="close__h" id="close-h">
            {lakes.length ? `${num(lakes.length)} lakes` : 'Every lake'}, one season, <em>two radars.</em>
          </h2>
          {index.status === 'ready' ? (
            <p className="close__sub">
              {num(totals.nisar)} clean L-band looks of NISAR, {num(totals.s1)} usable C-band looks of Sentinel-1 and{' '}
              {num(totals.optical)} valid optical scenes, every one listed on the record of its lake.
            </p>
          ) : null}
          <div className="close__go">
            <a className="btn" href={href('map')}>Open the dashboard</a>
            <ul className="close__links">
              <li><a href={href('results')}>What we guessed, and what came out</a></li>
              <li><a href={href('merzbacher')}>Merzbacher 2026, in frames</a></li>
              <li><a href={href('radar')}>How radar sees a lake</a></li>
              <li><a href={href('method')}>Method, limits and data</a></li>
            </ul>
          </div>
        </section>
      </div>
    </>
  )
}
