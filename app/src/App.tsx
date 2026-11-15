// SI-assisted (Claude), NASA Space Apps 2026
import { lazy, Suspense, useEffect, useRef } from 'react'
import { useRoute, href } from './lib/router'
import { useMockedFiles } from './data/load'
import { SITE } from './content/site'
import { Landing } from './pages/Landing'
import { TopBar } from './components/TopBar'
import { CommandPalette } from './components/CommandPalette'
import { Mark } from './components/Brand'

const MapPage = lazy(() => import('./pages/MapPage'))
const LakePage = lazy(() => import('./pages/LakePage'))
const MerzbacherPage = lazy(() => import('./pages/MerzbacherPage'))
const ExplainerPage = lazy(() => import('./pages/ExplainerPage'))
const MethodPage = lazy(() => import('./pages/MethodPage'))
const ResultsPage = lazy(() => import('./pages/ResultsPage'))
const BrandPage = lazy(() => import('./pages/BrandPage'))

const TITLES: Record<string, string> = {
  '': 'GLOFcast: which glacial lake needs a look this week?',
  map: 'Dashboard · GLOFcast',
  lake: 'Lake record · GLOFcast',
  results: 'Results · GLOFcast',
  merzbacher: 'Merzbacher 2026 · GLOFcast',
  radar: 'How radar sees a lake · GLOFcast',
  method: 'Method and data · GLOFcast',
  brand: 'The mark · GLOFcast',
}

export function App() {
  const route = useRoute()
  const page = route.parts[0] ?? ''
  const mocked = useMockedFiles()
  const mainRef = useRef<HTMLElement>(null)
  const first = useRef(true)

  // On a change of page: back to the top, and focus goes to the content for keyboard and screen-reader users.
  const pageKey = page === 'lake' ? `lake/${route.parts[1]}` : page
  useEffect(() => {
    document.title = page === 'lake' && route.parts[1] ? `${route.parts[1]} · GLOFcast` : TITLES[page] ?? 'GLOFcast'
    // the dashboard is one fixed screen; every other page scrolls
    document.documentElement.classList.toggle('is-dash', page === 'map')
    document.documentElement.classList.toggle('is-night', page === '')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', page === '' ? '#05080a' : '#f0ebdf')
    if (first.current) {
      first.current = false
      return
    }
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey])

  let view
  if (page === '') view = <Landing />
  else if (page === 'map') view = <MapPage query={route.query} />
  else if (page === 'lake' && route.parts[1]) view = <LakePage id={route.parts[1]} key={route.parts[1]} />
  else if (page === 'merzbacher') view = <MerzbacherPage />
  else if (page === 'radar') view = <ExplainerPage />
  else if (page === 'method') view = <MethodPage />
  else if (page === 'results') view = <ResultsPage />
  else if (page === 'brand') view = <BrandPage />
  else
    view = (
      <div className="wrap state">
        <h1 className="h2">This page does not exist.</h1>
        <p style={{ marginTop: 12 }}>
          <a href={href('map')}>Open the dashboard</a> or go <a href={href('')}>back to the start</a>.
        </p>
      </div>
    )

  const fixed = page === 'map'
  return (
    <div className={`shell${fixed ? ' shell--fixed' : ''}`}>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus() }}>
        Skip to content
      </a>
      {mocked.length > 0 && (
        <div className="mockbar" role="status">
          <div className="wrap">
            <strong>Synthetic data.</strong> The numbers and images on this screen are generated placeholders, not
            measurements ({mocked.join(', ')}).
          </div>
        </div>
      )}
      {/* the dashboard carries the bar in its panel, the start page in its sky */}
      {fixed || page === '' ? null : (
        <header className="sitehead">
          <div className="wrap sitehead__in">
            <TopBar page={page} variant="page" />
          </div>
        </header>
      )}
      <main id="main" ref={mainRef} tabIndex={-1} style={{ outline: 'none' }}>
        <Suspense fallback={<div className="wrap state" role="status">Loading…</div>}>{view}</Suspense>
      </main>
      {fixed ? null : (
        <footer className="sitefoot">
          <div className="wrap sitefoot__in">
            <span className="sitefoot__brand">
              <Mark size={18} />
              <span>{SITE.name}. {SITE.challenge}.</span>
            </span>
            <span>
              Open source, {SITE.licence}. <a href={href('method')}>Method, limits, data and credits</a>
            </span>
          </div>
        </footer>
      )}
      <CommandPalette />
    </div>
  )
}
