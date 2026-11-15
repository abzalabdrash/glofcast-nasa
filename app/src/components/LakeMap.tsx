// SI-assisted (Claude), NASA Space Apps 2026
// The map of the dashboard: MapLibre GL on an open basemap (OpenFreeMap vector tiles of OpenStreetMap data, relief
// shading from the open Terrain Tiles data set, optionally EOX Sentinel-2 cloudless imagery). No key, no login.
// If the basemap cannot be fetched the lakes are still drawn on plain paper.
//
// Marks: a lake on the list of the chosen week is filled in the red pencil and circled; a lake whose passport has a
// line that asks for a look (over the whole season) keeps its water blue and gets a red outline; every other lake is
// water blue with an ink outline. The flow path of the pointed or chosen lake is drawn as a river, in blue.
import { useEffect, useRef } from 'react'
import {
  Map as MlMap,
  NavigationControl,
  AttributionControl,
  Marker,
  setWorkerUrl,
  type GeoJSONSource,
  type StyleSpecification,
  type MapMouseEvent,
} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { label as flowLabel, pointAlong, type FlowPath } from './FlowPathMap'

setWorkerUrl(workerUrl)

export interface MapLake {
  id: string
  lon: number
  lat: number
  /** on the list of the chosen week */
  listed: boolean
  /** a line of the passport asks for a look (whole season) */
  attention: boolean
  /** size factor of the dot */
  size: number
  /** fill of the dot when it is not on the list (water blue, or the radar contrast ramp) */
  color: string
  /** draw the dot pale (radar mode: no look yet) */
  faded?: boolean
}

export interface MapTip {
  title: string
  meta: string
  line: string
  listed: boolean
}

export interface MapPadding {
  top: number
  right: number
  bottom: number
  left: number
}

interface Props {
  lakes: MapLake[]
  selected: string | null
  onSelect: (id: string | null) => void
  tooltip: (id: string) => MapTip
  /** flow paths by lake id; the path of the pointed, else the chosen, lake is drawn */
  paths?: Map<string, FlowPath> | null
  /** the part of the map hidden under panels, so that a chosen lake lands in the free part */
  padding: MapPadding
  basemap: 'relief' | 'satellite'
  label: string
}

const BASEMAP = 'https://tiles.openfreemap.org/styles/positron'
const HILLSHADE_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
const EOX = 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg'
const PAPER = '#ece7da'
const PLAIN: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'ground', type: 'background', paint: { 'background-color': PAPER } }],
}
const LOOK = '#c8391f'
const INK = '#0c1113'

async function basemapStyle(): Promise<StyleSpecification> {
  try {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), 7000)
    const res = await fetch(BASEMAP, { signal: ctl.signal })
    clearTimeout(timer)
    if (!res.ok) return PLAIN
    return (await res.json()) as StyleSpecification
  } catch {
    return PLAIN
  }
}

/** The grey basemap is warmed to the paper of the interface: bone ground, water in map blue. */
function tintBasemap(m: MlMap) {
  for (const l of m.getStyle().layers ?? []) {
    try {
      if (l.type === 'background') m.setPaintProperty(l.id, 'background-color', PAPER)
      else if (l.type === 'fill' && /water/.test(l.id)) m.setPaintProperty(l.id, 'fill-color', '#a9cbd9')
      else if (l.type === 'line' && /water/.test(l.id)) m.setPaintProperty(l.id, 'line-color', '#8bb7c9')
      else if (l.type === 'fill' && /(park|landcover|wood|grass)/.test(l.id)) m.setPaintProperty(l.id, 'fill-color', '#dfdcc6')
      else if (l.type === 'fill' && /(ice|glacier)/.test(l.id)) m.setPaintProperty(l.id, 'fill-color', '#f6f6f1')
      else if (l.type === 'symbol') {
        m.setPaintProperty(l.id, 'text-color', /water/.test(l.id) ? '#3b7b96' : '#2a3133')
        m.setPaintProperty(l.id, 'text-halo-color', 'rgba(240,235,223,0.9)')
      }
    } catch {
      /* a layer without that property: left as it is */
    }
  }
}

type PointCollection = Parameters<GeoJSONSource['setData']>[0]

function collection(lakes: MapLake[], selected: string | null): PointCollection {
  return {
    type: 'FeatureCollection' as const,
    features: lakes.map((l) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [l.lon, l.lat] },
      properties: {
        id: l.id,
        listed: l.listed ? 1 : 0,
        attn: l.attention && !l.listed ? 1 : 0,
        size: l.size,
        color: l.color,
        faded: l.faded ? 1 : 0,
        sel: l.id === selected ? 1 : 0,
        // drawn last = on top: the chosen lake, then the list of the week, then lakes whose passport asks for a look
        rank: (l.id === selected ? 1000 : 0) + (l.listed ? 500 : 0) + (l.attention ? 100 : 0),
      },
    })),
  }
}

const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function LakeMap({ lakes, selected, onSelect, tooltip, label, paths, padding, basemap }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const map = useRef<MlMap | null>(null)
  const ready = useRef(false)
  const latest = useRef({ lakes, selected, onSelect, tooltip, paths, padding, basemap })
  latest.current = { lakes, selected, onSelect, tooltip, paths, padding, basemap }
  const hovered = useRef<string | null>(null)
  const shownPath = useRef<string | null>(null)
  const pathMarkers = useRef<Marker[]>([])
  const allBounds = useRef<[number, number, number, number]>([73.5, 41.5, 81.5, 45.5])

  /** draw the flow path of the pointed lake, else of the chosen one */
  const drawPath = useRef(() => {})
  drawPath.current = () => {
    const m = map.current
    if (!m || !ready.current) return
    const id = hovered.current ?? latest.current.selected
    if (id === shownPath.current) return
    shownPath.current = id
    pathMarkers.current.forEach((k) => k.remove())
    pathMarkers.current = []
    const f = id ? latest.current.paths?.get(id) : undefined
    const src = m.getSource('flowpath') as GeoJSONSource | undefined
    src?.setData((f ?? { type: 'FeatureCollection', features: [] }) as never)
    // the counts along the river are shown for the chosen lake only: pointing at a dot should not litter the map
    if (!f || id !== latest.current.selected) return
    const c = f.geometry.coordinates
    const p = f.properties
    for (const [km, n] of [[10, p.people_10km], [25, p.people_25km], [50, p.people_50km]] as const) {
      const at = pointAlong(c, Math.min(km, (p.path_km ?? km) - 0.01)) ?? (km === 50 ? c[c.length - 1] : null)
      if (at) pathMarkers.current.push(new Marker({ element: flowLabel(km, n), anchor: 'left', offset: [10, 0] }).setLngLat(at).addTo(m))
    }
  }

  const applyBasemap = useRef(() => {})
  applyBasemap.current = () => {
    const m = map.current
    if (!m || !ready.current) return
    const sat = latest.current.basemap === 'satellite'
    if (m.getLayer('imagery')) m.setLayoutProperty('imagery', 'visibility', sat ? 'visible' : 'none')
    if (m.getLayer('relief')) m.setLayoutProperty('relief', 'visibility', sat ? 'none' : 'visible')
    m.getContainer().classList.toggle('is-satellite', sat)
  }

  useEffect(() => {
    let dead = false
    const first = latest.current.lakes
    if (first.length) {
      const lons = first.map((l) => l.lon)
      const lats = first.map((l) => l.lat)
      allBounds.current = [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)]
    }
    const pad = () => {
      const p = latest.current.padding
      return { top: p.top + 36, bottom: p.bottom + 36, left: p.left + 36, right: p.right + 36 }
    }

    basemapStyle().then((style) => {
      if (dead || !box.current) return
      const m = new MlMap({
        container: box.current,
        style,
        bounds: allBounds.current,
        fitBoundsOptions: { padding: pad() },
        attributionControl: false,
        maxZoom: 15,
        minZoom: 3.5,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      })
      map.current = m
      m.touchZoomRotate.disableRotation()
      m.addControl(new NavigationControl({ showCompass: false }), 'top-right')
      m.addControl(new AttributionControl({ compact: true }), 'bottom-right')
      m.getCanvas().setAttribute('aria-label', label)

      m.on('load', () => {
        if (dead) return
        // credits stay one press away, folded, so that they never cover a control
        m.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
        m.resize()
        tintBasemap(m)
        const firstSymbol = m.getStyle().layers?.find((l) => l.type === 'symbol')?.id
        try {
          m.addSource('imagery', {
            type: 'raster',
            tiles: [EOX],
            tileSize: 256,
            maxzoom: 14,
            attribution:
              'Sentinel-2 cloudless 2024 by <a href="https://eox.at/" target="_blank" rel="noopener">EOX</a> ' +
              '(<a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a>), ' +
              'contains modified Copernicus Sentinel data',
          })
          m.addLayer({ id: 'imagery', type: 'raster', source: 'imagery', layout: { visibility: 'none' }, paint: { 'raster-saturation': -0.2, 'raster-fade-duration': 150 } }, firstSymbol)
          m.addSource('relief', {
            type: 'raster-dem',
            tiles: [HILLSHADE_TILES],
            tileSize: 256,
            maxzoom: 12,
            encoding: 'terrarium',
            attribution: 'Relief: Terrain Tiles (Mapzen, open data on AWS)',
          })
          m.addLayer(
            {
              id: 'relief',
              type: 'hillshade',
              source: 'relief',
              paint: {
                'hillshade-exaggeration': 0.62,
                'hillshade-shadow-color': '#5d5a50',
                'hillshade-highlight-color': '#fffdf6',
                'hillshade-accent-color': '#8a8576',
              },
            },
            firstSymbol,
          )
        } catch {
          /* relief and imagery are background; the map works without them */
        }

        m.addSource('flowpath', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          attribution: 'Flow paths derived from MERIT Hydro v1.0.1 (ODbL 1.0)',
        })
        m.addLayer({ id: 'flowpath-case', type: 'line', source: 'flowpath', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fbf8f0', 'line-width': 6.5, 'line-opacity': 0.9 } })
        m.addLayer({ id: 'flowpath', type: 'line', source: 'flowpath', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#1c6787', 'line-width': 2.8 } })

        m.addSource('lakes', { type: 'geojson', data: collection(latest.current.lakes, latest.current.selected) })
        const radius = (extra: number, listedExtra = 0): unknown[] => [
          'interpolate', ['linear'], ['zoom'],
          5, ['+', ['*', 2.6, ['get', 'size']], extra * 0.6, ['*', listedExtra * 0.6, ['get', 'listed']]],
          9, ['+', ['*', 5.2, ['get', 'size']], extra, ['*', listedExtra, ['get', 'listed']]],
          13, ['+', ['*', 10, ['get', 'size']], extra * 1.4, ['*', listedExtra * 1.4, ['get', 'listed']]],
        ]
        const fade = { duration: 320, delay: 0 }

        // the red pencil circle around a lake on the list of the week
        m.addLayer({
          id: 'lake-circle',
          type: 'circle',
          source: 'lakes',
          filter: ['==', ['get', 'listed'], 1],
          layout: { 'circle-sort-key': ['get', 'rank'] },
          paint: {
            'circle-radius': radius(6.5, 1.5) as never,
            'circle-color': 'rgba(200,57,31,0.1)',
            'circle-stroke-color': LOOK,
            'circle-stroke-width': 1.6,
          },
        })
        m.addLayer({
          id: 'lake-dot',
          type: 'circle',
          source: 'lakes',
          layout: { 'circle-sort-key': ['get', 'rank'] },
          paint: {
            'circle-radius': radius(0, 1.5) as never,
            'circle-radius-transition': fade,
            'circle-color': ['case', ['==', ['get', 'listed'], 1], LOOK, ['get', 'color']],
            'circle-color-transition': fade,
            'circle-opacity': ['case', ['==', ['get', 'faded'], 1], 0.35, 1],
            'circle-stroke-color': ['case', ['==', ['get', 'attn'], 1], LOOK, INK],
            'circle-stroke-width': ['case', ['==', ['get', 'attn'], 1], 1.7, ['==', ['get', 'listed'], 1], 1.2, 0.9],
            'circle-stroke-opacity': ['case', ['==', ['get', 'faded'], 1], 0.4, 0.92],
          },
        })
        m.addLayer({
          id: 'lake-selected',
          type: 'circle',
          source: 'lakes',
          filter: ['==', ['get', 'sel'], 1],
          paint: {
            'circle-radius': radius(10, 1.5) as never,
            'circle-color': 'rgba(0,0,0,0)',
            'circle-stroke-color': INK,
            'circle-stroke-width': 2.2,
          },
        })

        /** the dot nearest to the pointer, within a finger's width */
        const hitAt = (e: MapMouseEvent, reach: number): string | undefined => {
          const { x, y } = e.point
          const f = m.queryRenderedFeatures([[x - reach, y - reach], [x + reach, y + reach]], { layers: ['lake-dot'] })
          if (!f.length) return undefined
          let best: string | undefined
          let bestD = Infinity
          for (const k of f) {
            const g = k.geometry as { type: string; coordinates: [number, number] }
            if (g.type !== 'Point') continue
            const p = m.project(g.coordinates)
            const d = (p.x - x) ** 2 + (p.y - y) ** 2 - (k.properties?.listed ? 60 : 0)
            if (d < bestD) {
              bestD = d
              best = k.properties?.id as string
            }
          }
          return best
        }
        m.on('click', (e) => {
          const touch = (e.originalEvent as PointerEvent | MouseEvent & { pointerType?: string }).pointerType === 'touch' || 'ontouchstart' in window
          const id = hitAt(e, touch ? 16 : 6)
          latest.current.onSelect(id ?? null)
        })
        m.on('mousemove', (e) => {
          const id = hitAt(e, 5)
          const el = tip.current
          if (!id || !el) {
            if (hovered.current) {
              m.getCanvas().style.cursor = ''
              if (el) el.hidden = true
              hovered.current = null
              drawPath.current()
            }
            return
          }
          m.getCanvas().style.cursor = 'pointer'
          if (hovered.current !== id) {
            hovered.current = id
            drawPath.current()
            const t = latest.current.tooltip(id)
            el.innerHTML = ''
            el.classList.toggle('is-listed', t.listed)
            const a = document.createElement('span')
            a.className = 'maptip__title'
            a.textContent = t.title
            const b = document.createElement('span')
            b.className = 'maptip__meta'
            b.textContent = t.meta
            const c = document.createElement('span')
            c.className = 'maptip__line'
            c.textContent = t.line
            el.append(a, b, c)
          }
          const w = m.getContainer().clientWidth
          const flip = e.point.x > w - 300
          el.style.transform = `translate(${Math.round(e.point.x + (flip ? -14 : 14))}px, ${Math.round(e.point.y + 14)}px)${flip ? ' translateX(-100%)' : ''}`
          el.hidden = false
        })
        m.on('mouseout', () => {
          m.getCanvas().style.cursor = ''
          if (tip.current) tip.current.hidden = true
          hovered.current = null
          drawPath.current()
        })
        ready.current = true
        applyBasemap.current()
        if (latest.current.selected) focusSelected.current(false)
        drawPath.current()
      })
    })

    return () => {
      dead = true
      ready.current = false
      map.current?.remove()
      map.current = null
    }
    // the map is created once; later data goes through setData below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!ready.current || !map.current) return
    const src = map.current.getSource('lakes') as GeoJSONSource | undefined
    src?.setData(collection(lakes, selected))
  }, [lakes, selected])

  useEffect(() => {
    applyBasemap.current()
  }, [basemap])

  // bring a chosen lake, and the river below it, into the free part of the map
  const focusSelected = useRef((_animate: boolean) => {})
  focusSelected.current = (animate: boolean) => {
    const m = map.current
    if (!m || !ready.current) return
    const p = latest.current.padding
    const padding = { top: p.top + 56, bottom: p.bottom + 56, left: p.left + 56, right: p.right + 56 }
    const duration = !animate || still() ? 0 : 1100
    const l = latest.current.lakes.find((x) => x.id === latest.current.selected)
    if (!l) return
    const f = latest.current.paths?.get(l.id)
    if (f && f.geometry.coordinates.length > 1) {
      const xs = [l.lon, ...f.geometry.coordinates.map((c) => c[0])]
      const ys = [l.lat, ...f.geometry.coordinates.map((c) => c[1])]
      m.fitBounds([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], { padding, maxZoom: 11.5, duration, essential: true })
      return
    }
    m.easeTo({ center: [l.lon, l.lat], zoom: Math.max(m.getZoom(), 10), padding, duration, essential: true })
  }
  const lastSelected = useRef<string | null>(selected)
  useEffect(() => {
    const m = map.current
    if (selected) focusSelected.current(true)
    else if (lastSelected.current && m && ready.current) {
      // back to the list: back to all lakes
      const p = latest.current.padding
      m.fitBounds(allBounds.current, {
        padding: { top: p.top + 36, bottom: p.bottom + 36, left: p.left + 36, right: p.right + 36 },
        duration: still() ? 0 : 900,
        essential: true,
      })
    }
    lastSelected.current = selected
    shownPath.current = null
    drawPath.current()
  }, [selected])
  useEffect(() => {
    shownPath.current = null
    drawPath.current()
    if (paths && latest.current.selected) focusSelected.current(true)
  }, [paths])

  return (
    <div className="lakemap">
      <div ref={box} className="lakemap__canvas" />
      <div ref={tip} className="maptip glass" hidden />
    </div>
  )
}
