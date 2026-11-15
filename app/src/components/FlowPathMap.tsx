// SI-assisted (Claude), NASA Space Apps 2026
// Where the water of one lake would run: its flow path (MERIT Hydro, up to 50 km) on the open basemap, with the
// people living within 1 km of the river for the first 10, 25 and 50 km, from flowpaths.geojson.
// Exposure, not risk: the line says who lives along the river, not who would be flooded.
import { useEffect, useRef } from 'react'
import {
  Map as MlMap,
  AttributionControl,
  NavigationControl,
  LngLatBounds,
  Marker,
  setWorkerUrl,
  type StyleSpecification,
} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { num } from '../lib/format'

setWorkerUrl(workerUrl)

export interface FlowPath {
  type: 'Feature'
  geometry: { type: 'LineString'; coordinates: [number, number][] }
  properties: {
    lake_id: string
    path_km: number | null
    people_10km: number | null
    people_25km: number | null
    people_50km: number | null
    stop_reason?: string
    quality?: string
  }
}

const BASEMAP = 'https://tiles.openfreemap.org/styles/positron'
const TERRARIUM = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'

/** The point `km` along a line, measured on the sphere. */
export function pointAlong(coords: [number, number][], km: number): [number, number] | null {
  const R = 6371
  const rad = Math.PI / 180
  let acc = 0
  for (let i = 1; i < coords.length; i++) {
    const [x1, y1] = coords[i - 1]
    const [x2, y2] = coords[i]
    const dLat = (y2 - y1) * rad
    const dLon = (x2 - x1) * rad
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(y1 * rad) * Math.cos(y2 * rad) * Math.sin(dLon / 2) ** 2
    const d = 2 * R * Math.asin(Math.sqrt(a))
    if (acc + d >= km) {
      const t = d === 0 ? 0 : (km - acc) / d
      return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]
    }
    acc += d
  }
  return null
}

export function label(km: number, people: number | null) {
  const el = document.createElement('div')
  el.className = 'flowmark'
  el.innerHTML = ''
  const a = document.createElement('span')
  a.className = 'flowmark__km'
  a.textContent = `first ${km} km`
  const b = document.createElement('span')
  b.className = 'flowmark__n'
  b.textContent = people == null ? 'no count' : `${num(people)} people`
  el.append(a, b)
  return el
}

export function FlowPathMap({ path, lake }: { path: FlowPath; lake: { lon: number; lat: number } }) {
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!box.current) return
    let dead = false
    let map: MlMap | null = null
    const coords = path.geometry.coordinates
    const bounds = coords.reduce((b, c) => b.extend(c), new LngLatBounds(coords[0], coords[0]))
    bounds.extend([lake.lon, lake.lat])

    fetch(BASEMAP)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((style: StyleSpecification | null) => {
        if (dead || !box.current) return
        map = new MlMap({
          container: box.current,
          style: style ?? { version: 8, sources: {}, layers: [{ id: 'g', type: 'background', paint: { 'background-color': '#ece7da' } }] },
          bounds,
          fitBoundsOptions: { padding: 48 },
          attributionControl: false,
          cooperativeGestures: true,
          dragRotate: false,
        })
        map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
        map.addControl(new AttributionControl({ compact: true }), 'bottom-right')
        const m = map
        m.on('load', () => {
          if (dead) return
          m.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
          const firstSymbol = m.getStyle().layers?.find((l) => l.type === 'symbol')?.id
          try {
            m.addSource('relief', { type: 'raster-dem', tiles: [TERRARIUM], tileSize: 256, maxzoom: 12, encoding: 'terrarium', attribution: 'Relief: Terrain Tiles (Mapzen, open data on AWS)' })
            m.addLayer({ id: 'relief', type: 'hillshade', source: 'relief', paint: { 'hillshade-exaggeration': 0.5, 'hillshade-shadow-color': '#5d5a50', 'hillshade-highlight-color': '#fffdf6' } }, firstSymbol)
          } catch {
            /* decoration only */
          }
          m.addSource('path', { type: 'geojson', data: path as never, attribution: 'Flow path derived from MERIT Hydro v1.0.1 (ODbL 1.0)' })
          m.addLayer({ id: 'path-halo', type: 'line', source: 'path', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fbf8f0', 'line-width': 6.5, 'line-opacity': 0.9 } })
          m.addLayer({ id: 'path', type: 'line', source: 'path', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#1c6787', 'line-width': 3 } })
          m.addSource('lake', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Point', coordinates: [lake.lon, lake.lat] }, properties: {} } })
          m.addLayer({ id: 'lake', type: 'circle', source: 'lake', paint: { 'circle-radius': 7, 'circle-color': '#3f93b8', 'circle-stroke-color': '#0c1113', 'circle-stroke-width': 1.5 } })
          const p = path.properties
          for (const [km, n] of [[10, p.people_10km], [25, p.people_25km], [50, p.people_50km]] as const) {
            // the line is simplified, so it can measure a little shorter than the path: the last count sits at its end
            const at = pointAlong(coords, Math.min(km, (p.path_km ?? km) - 0.01)) ?? (km === 50 ? coords[coords.length - 1] : null)
            if (at) new Marker({ element: label(km, n), anchor: 'left', offset: [8, 0] }).setLngLat(at).addTo(m)
          }
        })
      })
    return () => {
      dead = true
      map?.remove()
    }
  }, [path, lake.lon, lake.lat])

  return <div ref={box} className="flowmap" role="img" aria-label="Map of the flow path below the lake, with the number of people living within 1 km of the river at 10, 25 and 50 km." />
}

export default FlowPathMap
