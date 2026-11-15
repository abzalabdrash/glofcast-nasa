// SI-assisted (Claude), NASA Space Apps 2026
// Find a lake by id or name, or go to a page. Opened with Ctrl/Cmd K or "/" and from the top bar. It appears at once,
// with no animation: it is used often and from the keyboard.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useIndex, usePassport, useWeeks } from '../data/load'
import { getWeek } from '../lib/weekStore'
import { href } from '../lib/router'
import { regionName } from '../lib/format'
import { openingWeek, setPalette, usePalette } from '../lib/ui'

interface Item {
  key: string
  title: string
  meta: string
  to: string
  kind: 'lake' | 'page'
  listed?: boolean
  hay: string
}

/** Lake names are written in Cyrillic; a search typed in Latin letters should still find them. */
const LATIN: Record<string, string> = {
  а: 'a', ә: 'a', б: 'b', в: 'v', г: 'g', ғ: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i', і: 'i', к: 'k', қ: 'k',
  л: 'l', м: 'm', н: 'n', ң: 'n', о: 'o', ө: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ұ: 'u', ү: 'u', ф: 'f', х: 'h', һ: 'h',
  ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}
const latin = (t: string) => t.toLowerCase().replace(/[Ѐ-ӿ]/g, (c) => LATIN[c] ?? c)

const PAGES: Omit<Item, 'hay'>[] = [
  { key: 'p-map', title: 'Dashboard', meta: 'The map, the week and the lake passports', to: 'map', kind: 'page' },
  { key: 'p-results', title: 'Results', meta: 'What we guessed and what came out', to: 'results', kind: 'page' },
  { key: 'p-merz', title: 'Merzbacher 2026', meta: 'The drainage of an ice-dammed lake, in frames', to: 'merzbacher', kind: 'page' },
  { key: 'p-radar', title: 'How radar sees a lake', meta: 'Five drawings', to: 'radar', kind: 'page' },
  { key: 'p-method', title: 'Method and data', meta: 'Rules, limits, sources and credits', to: 'method', kind: 'page' },
  { key: 'p-start', title: 'Start page', meta: 'The season from orbit', to: '', kind: 'page' },
]

export function CommandPalette() {
  const open = usePalette()
  const [q, setQ] = useState('')
  const [at, setAt] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const before = useRef<Element | null>(null)
  const index = useIndex()
  const passport = usePassport()
  const weeksFile = useWeeks()

  // the shortcut works on every page
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPalette(true)
      } else if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        setPalette(true)
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])

  useEffect(() => {
    if (open) {
      before.current = document.activeElement
      setQ('')
      setAt(0)
      // after the dialog is in the document
      requestAnimationFrame(() => input.current?.focus())
    } else if (before.current instanceof HTMLElement) {
      before.current.focus({ preventScroll: true })
      before.current = null
    }
  }, [open])

  const lakes = useMemo<Item[]>(() => {
    if (index.status !== 'ready') return []
    const pass = passport.status === 'ready' ? passport.data.lakes : {}
    const weeks = weeksFile.status === 'ready' ? weeksFile.data.weeks : []
    const w = weeks.length ? weeks[Math.min(weeks.length - 1, Math.max(0, getWeek() ?? openingWeek(weeks)))] : null
    const listed = new Set(w?.listed.map((l) => l.id) ?? [])
    return index.data.lakes.map((l) => {
      const p = pass[l.id]
      const name = p?.name ?? l.name ?? null
      const near = !name && p?.near_name ? `near ${p.near_name}` : null
      return {
        key: l.id,
        title: name ?? l.id,
        meta: [name ? l.id : null, near, regionName(l.region)].filter(Boolean).join(' · '),
        to: `map?lake=${encodeURIComponent(l.id)}`,
        kind: 'lake' as const,
        listed: listed.has(l.id),
        hay: `${l.id} ${l.id.replace('-', ' ')} ${l.id.replace('-', '')} ${name ?? ''} ${latin(name ?? '')} ${p?.near_name ?? ''} ${latin(p?.near_name ?? '')} ${regionName(l.region)}`.toLowerCase(),
      }
    })
    // the palette reads the week when it opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, passport, weeksFile, open])

  const results = useMemo<Item[]>(() => {
    const t = q.trim().toLowerCase()
    const pages = PAGES.map((p) => ({ ...p, hay: `${p.title} ${p.meta}`.toLowerCase() }))
    if (!t) {
      // nothing typed: the lakes of the week first, then the pages
      return [...lakes.filter((l) => l.listed).slice(0, 5), ...pages]
    }
    const words = t.split(/\s+/)
    const hit = (i: Item) => words.every((w) => i.hay.includes(w))
    const found = lakes.filter(hit)
    // a name or an id that starts with the text comes first
    found.sort((a, b) => Number(b.title.toLowerCase().startsWith(t)) - Number(a.title.toLowerCase().startsWith(t)) || Number(b.listed) - Number(a.listed))
    return [...found.slice(0, 8), ...pages.filter(hit)]
  }, [q, lakes])

  useEffect(() => {
    setAt(0)
  }, [q])
  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [at])

  if (!open) return null

  const go = (i: Item | undefined) => {
    if (!i) return
    before.current = null
    setPalette(false)
    window.location.hash = href(i.to.split('?')[0], Object.fromEntries(new URLSearchParams(i.to.split('?')[1] ?? '')))
  }
  const nLakes = lakes.length
  const firstPage = results.findIndex((r) => r.kind === 'page')

  return (
    <div className="palette" role="presentation" onPointerDown={(e) => e.target === e.currentTarget && setPalette(false)}>
      <div className="palette__box" role="dialog" aria-modal="true" aria-label="Find a lake or a page">
        <div className="palette__field">
          <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.6" /><path d="m10.5 10.5 3.2 3.2" /></svg>
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={nLakes ? `Find one of ${nLakes} lakes by id or name` : 'Find a lake by id or name'}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results[at] ? `pal-${results[at].key}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setAt((i) => Math.min(results.length - 1, i + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setAt((i) => Math.max(0, i - 1))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                go(results[at])
              } else if (e.key === 'Escape') {
                e.preventDefault()
                setPalette(false)
              } else if (e.key === 'Tab') {
                e.preventDefault()
              }
            }}
          />
          <button type="button" className="palette__esc" onClick={() => setPalette(false)} aria-label="Close">esc</button>
        </div>
        <ul className="palette__list" id="palette-list" role="listbox" ref={list} aria-label="Results">
          {results.map((r, i) => (
            <li key={r.key} role="presentation">
              {i === firstPage && i > 0 ? <span className="palette__rule" aria-hidden="true" /> : null}
              {i === 0 && !q.trim() && r.kind === 'lake' ? <span className="palette__group">On the list this week</span> : null}
              <div
                id={`pal-${r.key}`}
                role="option"
                aria-selected={i === at}
                className={`palette__item${r.kind === 'page' ? ' palette__item--page' : ''}`}
                onPointerMove={() => i !== at && setAt(i)}
                onClick={() => go(r)}
              >
                <span className={`palette__glyph${r.listed ? ' is-listed' : ''}`} aria-hidden="true">
                  {r.kind === 'lake' ? <i /> : <svg viewBox="0 0 16 16"><path d="M5.500 3.500 10 8l-4.500 4.500" /></svg>}
                </span>
                <span className="palette__title">{r.title}</span>
                <span className="palette__meta">{r.meta}</span>
              </div>
            </li>
          ))}
          {results.length === 0 ? (
            <li className="palette__none" role="presentation">
              No lake or page matches “{q.trim()}”. Lake ids look like ILE-0876, ZHE-0396, TER-0013 or KYR-0264.
            </li>
          ) : null}
        </ul>
        <p className="palette__hint" aria-hidden="true">
          <span><kbd>↑</kbd><kbd>↓</kbd> choose</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </p>
      </div>
    </div>
  )
}
