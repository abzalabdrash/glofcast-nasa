// SI-assisted (Claude), NASA Space Apps 2026
// A hash router: the site works from any sub-path of a static host with no server rules.
import { useEffect, useState } from 'react'

export interface Route {
  /** Path segments after "#/", for example ["lake", "ZHE-0518"] */
  parts: string[]
  query: URLSearchParams
}

function parse(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [path, qs] = raw.split('?')
  return { parts: path.split('/').filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(qs ?? '') }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const on = () => setRoute(parse())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export function href(path: string, query?: Record<string, string | null | undefined>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(query ?? {})) if (v != null && v !== '') q.set(k, v)
  const qs = q.toString()
  return `#/${path.replace(/^\//, '')}${qs ? `?${qs}` : ''}`
}

/** Update the query of the current route without adding a history entry or re-rendering the router. */
export function replaceQuery(path: string, query: Record<string, string | null | undefined>) {
  const url = href(path, query)
  if (window.location.hash !== url) window.history.replaceState(null, '', url)
}
