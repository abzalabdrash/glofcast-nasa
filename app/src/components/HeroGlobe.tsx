// SI-assisted (Claude), NASA Space Apps 2026
// The globe of the landing page, in the spirit of glofcast.org but from open sources only:
// MapLibre GL in globe projection, NASA GIBS Blue Marble imagery for the whole Earth, EOX Sentinel-2 cloudless for the
// mountains, open Terrarium elevation tiles for the relief. No key, no closed licence.
// The camera follows `progress` (0 = the whole globe, 1 = the ranges above Almaty). With reduced motion the globe
// does not turn and the camera jumps instead of flying.
import { useEffect, useRef } from 'react'
import {
  Map as MlMap,
  AttributionControl,
  setWorkerUrl,
  type GeoJSONSource,
  type StyleSpecification,
} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'

setWorkerUrl(workerUrl)

export interface HeroLake {
  id: string
  lon: number
  lat: number
  listed: boolean
}

interface Props {
  lakes: HeroLake[]
  /** flow paths of the listed lakes (LineStrings) */
  paths?: { type: 'FeatureCollection'; features: unknown[] } | null
  /** 0 = whole globe, 1 = down at the lakes; read every frame */
  progress: { current: number }
  /** centre of the descent */
  target: [number, number]
  reducedMotion: boolean
  onReady?: () => void
}

const GIBS =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg'
const EOX = 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg'
const TERRARIUM = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'

const STYLE: StyleSpecification = {
  version: 8,
  projection: { type: 'globe' },
  sky: {
    'sky-color': '#05080a',
    'horizon-color': '#1b3a44',
    'sky-horizon-blend': 0.6,
    'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0],
  },
  sources: {
    gibs: {
      type: 'raster',
      tiles: [GIBS],
      tileSize: 256,
      maxzoom: 8,
      attribution:
        'Imagery: <a href="https://earthdata.nasa.gov/gibs" target="_blank" rel="noopener">NASA GIBS</a>, Blue Marble shaded relief (NASA Earth Observatory)',
    },
    eox: {
      type: 'raster',
      tiles: [EOX],
      tileSize: 256,
      minzoom: 5,
      maxzoom: 14,
      attribution:
        'Sentinel-2 cloudless 2024 by <a href="https://eox.at/" target="_blank" rel="noopener">EOX</a> ' +
        '(<a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a>), ' +
        'contains modified Copernicus Sentinel data',
    },
    relief: {
      type: 'raster-dem',
      tiles: [TERRARIUM],
      tileSize: 256,
      maxzoom: 12,
      encoding: 'terrarium',
      attribution: 'Elevation: Terrain Tiles (Mapzen, open data on AWS)',
    },
    lakes: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
    paths: {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      attribution: 'Flow paths derived from MERIT Hydro v1.0.1 (ODbL 1.0)',
    },
  },
  layers: [
    { id: 'space', type: 'background', paint: { 'background-color': '#05080a' } },
    { id: 'gibs', type: 'raster', source: 'gibs', paint: { 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 5.5, 1, 7, 0], 'raster-fade-duration': 200 } },
    {
      id: 'eox',
      type: 'raster',
      source: 'eox',
      minzoom: 5,
      paint: {
        'raster-opacity': ['interpolate', ['linear'], ['zoom'], 5.5, 0, 7, 1],
        'raster-saturation': -0.3,
        'raster-brightness-max': 0.8,
        'raster-contrast': 0.08,
        'raster-fade-duration': 200,
      },
    },
    {
      id: 'paths',
      type: 'line',
      source: 'paths',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#8fd3ec',
        'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.8, 8, 2],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 4.5, 0, 6, 0.85],
      },
    },
    {
      id: 'lakes-all',
      type: 'circle',
      source: 'lakes',
      filter: ['==', ['get', 'listed'], 0],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 1.4, 7, 2.6, 9, 3.5],
        'circle-color': '#a9dcee',
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 4.5, 0, 6, 0.85],
        'circle-stroke-width': 0,
        'circle-pitch-alignment': 'map',
      },
    },
    {
      id: 'lakes-listed-halo',
      type: 'circle',
      source: 'lakes',
      filter: ['==', ['get', 'listed'], 1],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 5, 7, 14, 9, 20],
        'circle-color': '#ff6a45',
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 3.5, 0, 5, 0.22],
        'circle-pitch-alignment': 'map',
      },
    },
    {
      id: 'lakes-listed',
      type: 'circle',
      source: 'lakes',
      filter: ['==', ['get', 'listed'], 1],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 2.5, 7, 5, 9, 7],
        'circle-color': '#ff6a45',
        'circle-stroke-color': '#05080a',
        'circle-stroke-width': 1.2,
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 3.5, 0, 5, 1],
        'circle-stroke-opacity': ['interpolate', ['linear'], ['zoom'], 3.5, 0, 5, 1],
        'circle-pitch-alignment': 'map',
      },
    },
  ],
}

function collection(lakes: HeroLake[]) {
  return {
    type: 'FeatureCollection' as const,
    features: lakes.map((l) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [l.lon, l.lat] },
      properties: { id: l.id, listed: l.listed ? 1 : 0 },
    })),
  }
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function HeroGlobe({ lakes, paths, progress, target, reducedMotion, onReady }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<MlMap | null>(null)
  const ready = useRef(false)
  const latest = useRef({ lakes, paths, target, onReady })
  latest.current = { lakes, paths, target, onReady }

  useEffect(() => {
    if (!box.current) return
    const m = new MlMap({
      container: box.current,
      style: STYLE,
      center: [latest.current.target[0] - 9, 30],
      zoom: 1.9,
      interactive: false,
      attributionControl: false,
      maxPitch: 70,
      fadeDuration: 0,
    })
    map.current = m
    m.addControl(new AttributionControl({ compact: true }), 'bottom-right')
    m.getCanvas().setAttribute('aria-hidden', 'true')
    m.getCanvas().tabIndex = -1

    let terrainOn = false
    // starts where the bundled still of the globe was taken, so the cross-fade does not jump
    let spin = 31
    let last = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      const p = Math.max(0, Math.min(1, progress.current))
      // the globe turns slowly while it is seen whole, and stops as the camera comes down
      if (!reducedMotion && p < 0.98) spin += (dt / 1000) * 3.2 * (1 - p)
      const e = ease(p)
      const [tx, ty] = latest.current.target
      const lon0 = tx - 40 + (spin % 360)
      // shortest way from the turning longitude to the target
      let dLon = ((tx - lon0 + 540) % 360) - 180
      if (p === 0) dLon = 0
      // At the top the Earth is large and bleeds off the edge: right of the sentence on a wide screen, above it on a
      // phone. As the camera comes down it moves to the free part of the screen, above the list of the week.
      const w = m.getContainer().clientWidth
      const h = m.getContainer().clientHeight
      // not laid out yet (or hidden): nothing to frame
      if (!w || !h) {
        raf = requestAnimationFrame(frame)
        return
      }
      const wide = w >= 900
      const padding = wide
        ? { left: Math.round(w * lerp(0.44, 0, e)), right: 0, top: 0, bottom: Math.round(h * lerp(0, 0.36, e)) }
        : { left: 0, right: 0, top: 0, bottom: Math.round(h * lerp(0.4, 0.56, e)) }
      // zoom at which the globe has the wanted radius on this screen (its radius grows with the latitude of the centre)
      const radius = wide ? h * 0.5 : Math.min(h * 0.29, w * 0.66)
      const z0 = Math.log2((radius * 2 * Math.PI * Math.cos((30 * Math.PI) / 180)) / 512)
      const zoom = lerp(z0, wide ? 7.0 : 6.3, e)
      m.jumpTo({
        center: [lon0 + dLon * e, lerp(30, ty, e)],
        zoom,
        pitch: lerp(0, 46, Math.max(0, (e - 0.35) / 0.65)),
        bearing: lerp(0, -8, e),
        padding,
      })
      // relief only where it can be seen; it costs tiles and frames at globe scale
      if (ready.current) {
        if (!terrainOn && zoom > 5.5) {
          m.setTerrain({ source: 'relief', exaggeration: 1.35 })
          terrainOn = true
        } else if (terrainOn && zoom < 5) {
          m.setTerrain(null)
          terrainOn = false
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    // the tiles of the view down at the lakes are fetched while the globe turns, so that the descent lands on
    // imagery instead of black
    m.once('idle', () => {
      const [tx, ty] = latest.current.target
      for (const z of [6, 7]) {
        const n = 2 ** z
        const x = (lon: number) => Math.floor(((lon + 180) / 360) * n)
        const y = (lat: number) => {
          const r = (lat * Math.PI) / 180
          return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n)
        }
        for (let xi = x(tx - 3.6); xi <= x(tx + 3.6); xi++)
          for (let yi = y(ty + 2); yi <= y(ty - 1.6); yi++) {
            new Image().src = EOX.replace('{z}', String(z)).replace('{x}', String(xi)).replace('{y}', String(yi))
            const t = new Image()
            t.crossOrigin = 'anonymous'
            t.src = TERRARIUM.replace('{z}', String(z)).replace('{x}', String(xi)).replace('{y}', String(yi))
          }
      }
    })

    m.on('load', () => {
      ready.current = true
      ;(m.getSource('paths') as GeoJSONSource | undefined)?.setData((latest.current.paths ?? { type: 'FeatureCollection', features: [] }) as never)
      // the credits stay one click away, folded, so that they do not cover the words on a phone
      m.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
      ;(m.getSource('lakes') as GeoJSONSource | undefined)?.setData(collection(latest.current.lakes))
      m.once('idle', () => latest.current.onReady?.())
    })

    return () => {
      cancelAnimationFrame(raf)
      ready.current = false
      m.remove()
      map.current = null
    }
  }, [progress, reducedMotion])

  useEffect(() => {
    if (!ready.current || !map.current) return
    ;(map.current.getSource('lakes') as GeoJSONSource | undefined)?.setData(collection(lakes))
  }, [lakes])
  useEffect(() => {
    if (!ready.current || !map.current) return
    ;(map.current.getSource('paths') as GeoJSONSource | undefined)?.setData((paths ?? { type: 'FeatureCollection', features: [] }) as never)
  }, [paths])

  return <div ref={box} className="heroglobe" />
}

export default HeroGlobe
