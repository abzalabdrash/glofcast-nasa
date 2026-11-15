// SI-assisted (Claude), NASA Space Apps 2026
// One loader for every data file. Real files live in data/. When a real file is missing and the build allows it
// (dev server, or `vite build --mode mock`), the synthetic file of the same name in mock/ is used and the app
// says so on screen. A production build never falls back to mock data.
import { useEffect, useState } from 'react'
import type { DamMeta, IndexFile, LakeFile, Loaded, MerzFile, PassportFile, ResultsFile, Source, TimelineFile, WeeksFile } from './types'

declare const __ALLOW_MOCK__: boolean

const BASE = import.meta.env.BASE_URL
/** In a build that allows mock data, `?mock` in the address shows the synthetic set even when real files exist. */
const FORCE_MOCK = __ALLOW_MOCK__ && new URLSearchParams(window.location.search).has('mock')
const cache = new Map<string, Promise<Loaded<unknown> | null>>()
const mockListeners = new Set<() => void>()
const mockedFiles = new Set<string>()

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const type = res.headers.get('content-type') ?? ''
    // A dev server answers unknown paths with index.html: that is "missing", not JSON.
    if (type.includes('text/html')) return null
    return await res.json()
  } catch {
    return null
  }
}

export function loadFile<T>(rel: string): Promise<Loaded<T> | null> {
  let p = cache.get(rel)
  if (!p) {
    p = (async () => {
      const real = FORCE_MOCK ? null : await fetchJson(`${BASE}data/${rel}`)
      if (real != null) return { data: real, mock: false, base: `${BASE}data/` }
      if (__ALLOW_MOCK__) {
        const mock = await fetchJson(`${BASE}mock/${rel}`)
        if (mock != null) {
          mockedFiles.add(rel.startsWith('lakes/') ? 'lakes/<id>.json' : rel)
          mockListeners.forEach((f) => f())
          return { data: mock, mock: true, base: `${BASE}mock/` }
        }
      }
      return null
    })()
    cache.set(rel, p)
  }
  return p as Promise<Loaded<T> | null>
}

export type Resource<T> =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; data: T; mock: boolean; base: string }

export function useFile<T>(rel: string | null): Resource<T> {
  const [state, setState] = useState<Resource<T>>({ status: 'loading' })
  useEffect(() => {
    if (rel == null) return
    let alive = true
    setState({ status: 'loading' })
    loadFile<T>(rel).then((r) => {
      if (!alive) return
      setState(r ? { status: 'ready', data: r.data, mock: r.mock, base: r.base } : { status: 'missing' })
    })
    return () => {
      alive = false
    }
  }, [rel])
  return state
}

export const useIndex = () => useFile<IndexFile>('index.json')
export const useTimeline = () => useFile<TimelineFile>('timeline.json')
export const useLake = (id: string | null) => useFile<LakeFile>(id ? `lakes/${encodeURIComponent(id)}.json` : null)
export const useMerzbacher = () => useFile<MerzFile>('merzbacher.json')
export const useResults = () => useFile<ResultsFile>('results.json')
export const useWeeks = () => useFile<WeeksFile>('weeks.json')
export const usePassport = () => useFile<PassportFile>('passport.json')
export const useDamMeta = (id: string) => useFile<DamMeta>(`dam/${encodeURIComponent(id)}_meta.json`)

export function useSources(): Resource<Source[]> {
  const r = useFile<Source[] | { sources: Source[] }>('sources.json')
  if (r.status !== 'ready') return r
  const list = Array.isArray(r.data) ? r.data : (r.data.sources ?? [])
  return { ...r, data: list }
}

/** Names of the files currently served from mock/ (empty on a published build). */
export function useMockedFiles(): string[] {
  const [, tick] = useState(0)
  useEffect(() => {
    const f = () => tick((n) => n + 1)
    mockListeners.add(f)
    return () => {
      mockListeners.delete(f)
    }
  }, [])
  return [...mockedFiles].sort()
}

/** Results count as present only when the main session marked them verified. */
export function verifiedResults(r: Resource<ResultsFile>): ResultsFile | null {
  if (r.status !== 'ready' || r.mock) return null
  if (r.data.verified !== true || !r.data.hypotheses?.length) return null
  return r.data
}
