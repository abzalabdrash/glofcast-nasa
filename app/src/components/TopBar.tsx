// SI-assisted (Claude), NASA Space Apps 2026
// Navigation reduced to what is used: the wordmark (start page), the dashboard, the search, and one small menu that
// holds the pages people open rarely.
import { useEffect, useRef, useState } from 'react'
import { href } from '../lib/router'
import { IS_MAC, setPalette } from '../lib/ui'
import { SITE } from '../content/site'
import { Brand } from './Brand'

const MORE = [
  { path: 'results', label: 'Results', note: 'what we guessed, what came out' },
  { path: 'merzbacher', label: 'Merzbacher 2026', note: 'a drainage, eight hours in' },
  { path: 'radar', label: 'How radar sees a lake', note: 'five drawings' },
  { path: 'method', label: 'Method and data', note: 'rules, limits, sources' },
]

interface Props {
  /** current page key (first part of the route) */
  page: string
  /** `night`: over the globe of the start page. `panel`: inside the dashboard panel. `float`: over the map on a phone. */
  variant?: 'page' | 'night' | 'panel' | 'float'
}

export function TopBar({ page, variant = 'page' }: Props) {
  const [menu, setMenu] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const onDash = page === 'map'

  useEffect(() => {
    if (!menu) return
    const down = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setMenu(false)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenu(false)
        wrap.current?.querySelector<HTMLButtonElement>('.topbar__menu')?.focus()
      }
    }
    window.addEventListener('pointerdown', down)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('keydown', key)
    }
  }, [menu])
  // a change of page closes the menu
  useEffect(() => setMenu(false), [page])

  return (
    <div className={`topbar topbar--${variant}`}>
      <a className="topbar__brand" href={href('')} aria-label={`${SITE.name}, start page`}>
        <Brand />
      </a>
      <nav className="topbar__nav" aria-label="Site">
        {!onDash ? (
          <a className="topbar__link" href={href('map')}>Dashboard</a>
        ) : null}
        <button type="button" className="topbar__find" onClick={() => setPalette(true)} aria-label="Find a lake or a page" aria-keyshortcuts={IS_MAC ? 'Meta+K' : 'Control+K'}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.6" /><path d="m10.500 10.500 3.200 3.200" /></svg>
          <span className="topbar__findtext">Find a lake</span>
          <kbd className="topbar__kbd">{IS_MAC ? '⌘K' : 'Ctrl K'}</kbd>
        </button>
        <div className="topbar__more" ref={wrap}>
          <button type="button" className="topbar__menu" aria-expanded={menu} aria-haspopup="true" aria-controls="more-menu" onClick={() => setMenu((v) => !v)} aria-label="More pages">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.500 5h11M2.500 11h11" /></svg>
          </button>
          <div className={`menu glass${menu ? ' is-open' : ''}`} id="more-menu" hidden={!menu}>
            {onDash ? null : (
              <a className="menu__item" href={href('map')}>
                <span>Dashboard</span>
                <small>the map, the week, the passports</small>
              </a>
            )}
            {MORE.map((m) => (
              <a key={m.path} className="menu__item" href={href(m.path)} aria-current={page === m.path ? 'page' : undefined}>
                <span>{m.label}</span>
                <small>{m.note}</small>
              </a>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}
