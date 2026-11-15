// SI-assisted (Claude), NASA Space Apps 2026
// Writes a small SYNTHETIC data set under public/mock/ that follows DATA_SCHEMA.md.
// Nothing here is a measurement: lake positions, series, events and images are generated from a seeded
// random number generator so that the app can be built before the real files land in public/data/.
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/mock')
rmSync(ROOT, { recursive: true, force: true })
mkdirSync(ROOT, { recursive: true })

// ---------- helpers ----------
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20261114)
const uni = (a, b) => a + (b - a) * rnd()
const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd())
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const r1 = (x) => Math.round(x * 10) / 10
const r2 = (x) => Math.round(x * 100) / 100
const pad = (n, w = 2) => String(n).padStart(w, '0')
const write = (rel, obj) => {
  const p = resolve(ROOT, rel)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, typeof obj === 'string' || obj instanceof Uint8Array ? obj : JSON.stringify(obj))
}

function png(w, h, channels, data) {
  const stride = w * channels
  const raw = Buffer.alloc((stride + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0
    Buffer.from(data.buffer, data.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1)
  }
  const chunk = (type, body) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(body.length)
    const td = Buffer.concat([Buffer.from(type, 'ascii'), body])
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0)
    return Buffer.concat([len, td, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = channels === 1 ? 0 : 2
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ])
}

// smooth value noise for terrain texture
function noiseField(w, h, cell, seed) {
  const r = mulberry32(seed)
  const gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2
  const g = Float32Array.from({ length: gw * gh }, () => r())
  const out = new Float32Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const fx = x / cell, fy = y / cell, x0 = Math.floor(fx), y0 = Math.floor(fy)
    const tx = fx - x0, ty = fy - y0
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty)
    const a = g[y0 * gw + x0], b = g[y0 * gw + x0 + 1], c = g[(y0 + 1) * gw + x0], d = g[(y0 + 1) * gw + x0 + 1]
    out[y * w + x] = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
  }
  return out
}

// ---------- season ----------
const DAY = 86400000
const T0 = Date.UTC(2026, 5, 18), T1 = Date.UTC(2026, 9, 25)
const days = []
for (let t = T0; t <= T1; t += DAY) days.push(new Date(t).toISOString().slice(0, 10))
const dayIndex = (iso) => Math.round((Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) - T0) / DAY)
const iso = (dayIdx, hh, mm) => `${days[dayIdx]}T${pad(hh)}:${pad(mm)}:00Z`
const NISAR_GAP = [dayIndex('2026-07-27'), dayIndex('2026-08-10')]
const OPT_LAST_VALID = dayIndex('2026-09-13')

const REGIONS = [
  { key: 'zhetysu_alatau', prefix: 'ZHE', n: 46, lon: [78.9, 81.4], lat: [44.65, 45.25], tilt: 0.18,
    nisar: ['135D', '098A', '026A', '063D'], s1: ['158A', '034D', '085D'] },
  { key: 'ile_alatau', prefix: 'ILE', n: 20, lon: [76.35, 77.9], lat: [42.95, 43.12], tilt: 0.05,
    nisar: ['063D', '026A', '170A', '099D'], s1: ['056A', '034D', '129A'] },
  { key: 'terskey_alatau', prefix: 'TER', n: 16, lon: [77.1, 79.6], lat: [41.95, 42.35], tilt: 0.1,
    nisar: ['135D', '098A', '034D'], s1: ['056A', '107D', '136D'] },
  { key: 'kyrgyz_range', prefix: 'KYR', n: 6, lon: [73.7, 75.0], lat: [42.5, 42.68], tilt: 0.0,
    nisar: ['069A', '142D', '106A'], s1: ['100A', '005D'] },
]

function waterCurve(kind, d0) {
  // share of the basin under water on a given day index
  return (d) => {
    if (kind === 'stable') return 1
    if (kind === 'empties') return d < d0 ? 1 : d < d0 + 2 ? 0.45 : 0.04
    if (kind === 'fills_empties') return d < d0 - 40 ? 0.1 + 0.9 * Math.max(0, (d - (d0 - 70)) / 30) : d < d0 ? 1 : 0.05
    if (kind === 'declines') return Math.max(0.35, 1 - Math.max(0, d - d0) / 90)
    return 1
  }
}

const indexLakes = []
const timelineLakes = {}
const coverage = { nisar: days.map(() => 0), s1: days.map(() => 0), optical: days.map(() => 0), optical_cloudy: days.map(() => 0) }
const showcaseIds = []
let granuleCounter = 5000

for (const R of REGIONS) {
  for (let i = 1; i <= R.n; i++) {
    const id = `${R.prefix}-M${pad(i, 3)}`
    const u = rnd()
    const lon = R.lon[0] + u * (R.lon[1] - R.lon[0])
    const lat = R.lat[0] + (R.lat[1] - R.lat[0]) * (0.5 + 0.28 * gauss()) + R.tilt * (u - 0.5)
    const area = r2(Math.min(60, 0.81 + Math.exp(gauss() * 0.9 + 0.4)))
    const elev = Math.round(uni(3050, 3750))
    const kind = rnd() < 0.8 ? 'stable' : pick(['empties', 'empties', 'fills_empties', 'declines'])
    const d0 = Math.round(uni(45, 105))
    const water = waterCurve(kind, d0)
    const showcase = kind !== 'stable' && kind !== 'declines' && showcaseIds.length < 6 && rnd() < 0.7
    if (showcase) showcaseIds.push(id)
    const depth = Math.min(9.5, 3.5 + 2.2 * Math.log10(area + 1) * 2 + gauss() * 0.8) // dB of a full basin

    // --- NISAR ---
    const nOrb = R.nisar.length > 3 && rnd() < 0.5 ? 4 : 3
    const nisar = []
    const tlN = {}
    R.nisar.slice(0, nOrb).forEach((orbit, k) => {
      const geom = k === nOrb - 1 && rnd() < 0.4 ? 0.25 : uni(0.7, 1.05) // one orbit can be poor
      const phase = Math.floor(uni(0, 12))
      const asc = orbit.endsWith('A')
      for (let d = phase; d < days.length; d += 12) {
        if (d >= NISAR_GAP[0] && d <= NISAR_GAP[1]) continue
        const p = rnd()
        const cls = p < 0.05 ? 'unusable' : p < 0.12 ? 'swath_edge' : 'clean'
        const w = water(d)
        const hh = cls === 'unusable' ? null : r1(-depth * geom * w + gauss() * 0.55 + (cls === 'swath_edge' ? gauss() * 1.5 : 0))
        const single = rnd() < 0.04
        const hv = cls === 'unusable' || single ? null : r1(-depth * geom * 0.92 * w + gauss() * 0.7)
        const cyc = pad(20 + Math.floor(d / 12), 3)
        const stamp = days[d].replaceAll('-', '') + (asc ? 'T2351' : 'T1344')
        nisar.push({
          t: iso(d, asc ? 23 : 13, asc ? 51 : 44), orbit, hh, hv, cls,
          granule: `MOCK_NISAR_L2_PR_GCOV_${cyc}_${orbit.slice(0, 3)}_${orbit.slice(3)}_${pad(granuleCounter++ % 180, 3)}_2005_DHDH_A_${stamp}36_${stamp}59_P05023_N_F_J_001`,
        })
        if (cls === 'clean') { (tlN[orbit] ??= []).push([d, hh]); }
      }
    })
    nisar.sort((a, b) => a.t.localeCompare(b.t))

    // --- Sentinel-1 ---
    const s1 = []
    const tlS = {}
    const nS = R.s1.length > 2 && rnd() < 0.6 ? 3 : 2
    R.s1.slice(0, nS).forEach((orbit) => {
      const geom = uni(0.75, 1.1)
      const phase = Math.floor(uni(0, 12))
      const asc = orbit.endsWith('A')
      const platform = pick(['S1A', 'S1C', 'S1D'])
      for (let d = phase; d < days.length; d += 12) {
        const usable = rnd() > 0.03
        const w = water(d)
        const vv = usable ? r1(-(depth + 1.4) * geom * w + gauss() * 0.7) : null
        const vh = usable ? r1(-(depth + 0.6) * geom * w + gauss() * 0.8) : null
        const stamp = days[d].replaceAll('-', '') + (asc ? 'T1242' : 'T0055')
        s1.push({ t: iso(d, asc ? 12 : 0, asc ? 42 : 55), orbit, platform, vv, vh, usable,
          image: `MOCK_${platform}_IW_GRDH_1SDV_${stamp}36_${stamp}59_0${Math.floor(uni(10000, 99999))}_0${Math.floor(uni(10000, 99999))}_${Math.floor(uni(4096, 65535)).toString(16).toUpperCase()}` })
        if (usable) (tlS[orbit] ??= []).push([d, vv])
      }
    })
    s1.sort((a, b) => a.t.localeCompare(b.t))

    // --- optics ---
    const optical = []
    const tlO = [], tlOC = []
    const cloudiness = uni(0.72, 0.9)
    for (let d = Math.floor(uni(0, 3)); d < days.length; d += rnd() < 0.5 ? 2 : 3) {
      const clear = rnd() > cloudiness ? r2(uni(0.9, 1)) : r2(rnd() < 0.7 ? 0 : uni(0.05, 0.85))
      const valid = clear >= 0.9 && d <= OPT_LAST_VALID
      const w = water(d)
      const stamp = days[d].replaceAll('-', '')
      optical.push({ t: iso(d, 5, 47), water: clear >= 0.2 ? r2(Math.max(0, Math.min(1, w * 0.93 + gauss() * 0.03))) : null,
        clear, valid, image: `MOCK_${stamp}T054641_${stamp}T055602_T43TGH` })
      if (valid) { tlO.push([d, optical.at(-1).water]); coverage.optical[d]++ } else { tlOC.push(d); coverage.optical_cloudy[d]++ }
    }
    for (const o of Object.values(tlN)) for (const [d] of o) coverage.nisar[d]++
    for (const o of Object.values(tlS)) for (const [d] of o) coverage.s1[d]++

    // --- events: the step rule of the plan, simplified (3 dB between consecutive usable looks of one orbit) ---
    const events = []
    const steps = (rows, sensor, key, ok) => {
      const byOrbit = {}
      for (const r of rows) if (ok(r)) (byOrbit[r.orbit] ??= []).push(r)
      for (const [orbit, rr] of Object.entries(byOrbit)) for (let k = 1; k < rr.length; k++) {
        const step = rr[k][key] - rr[k - 1][key]
        if (Math.abs(step) >= 3) events.push({ kind: step > 0 ? 'emptying' : 'filling', sensor, orbit, before: rr[k - 1].t, after: rr[k].t, step_db: r1(step) })
      }
    }
    if (kind !== 'stable') {
      steps(nisar, 'nisar', 'hh', (r) => r.cls === 'clean')
      steps(s1, 's1', 'vv', (r) => r.usable)
    }
    events.sort((a, b) => a.after.localeCompare(b.after))

    indexLakes.push({
      id, lat: +lat.toFixed(5), lon: +lon.toFixed(5), area_ha: area, region: R.key, elev_m: elev, showcase,
      has_control: rnd() < 0.47,
      n_clean: { nisar: nisar.filter((r) => r.cls === 'clean').length, s1: s1.filter((r) => r.usable).length, optical: optical.filter((r) => r.valid).length },
      events,
    })
    timelineLakes[id] = { nisar: tlN, s1: tlS, optical: tlO, optical_cloudy: tlOC }

    const lakeFile = { id, series: { nisar, s1, optical } }
    if (showcase) lakeFile.frames = makeFrames(id, lon, lat, area, nisar, optical, water, depth)
    write(`lakes/${id}.json`, lakeFile)
  }
}

// ---------- synthetic image frames ----------
function lakeMask(w, h, areaHa, seed, mPerPx) {
  // an irregular blob of roughly the right size
  const r = mulberry32(seed)
  const rad = Math.max(5, Math.sqrt((areaHa * 10000) / Math.PI) / mPerPx)
  const k = Array.from({ length: 5 }, (_, i) => ({ a: (0.22 / (i + 1)) * r(), p: r() * 6.283 }))
  const m = new Float32Array(w * h) // >0 inside; value = normalised distance to the shore (0 shore .. 1 centre)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x - w / 2, dy = (y - h / 2) * 1.25
    const ang = Math.atan2(dy, dx)
    let rr = rad
    k.forEach((q, i) => { rr += rad * q.a * Math.sin((i + 2) * ang + q.p) })
    const d = Math.hypot(dx, dy) / rr
    m[y * w + x] = d < 1 ? 1 - d : 0
  }
  return m
}

function sarTile(w, h, mask, level, terrain, r, lookDir) {
  // gamma0 in dB, 4-look speckle, stretched -25..0 dB to 0..255
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x
    const slope = (terrain[i + (x < w - 1 ? 1 : 0)] - terrain[i]) * lookDir
    let db = -8.5 + 55 * slope + 3 * (terrain[i] - 0.5)
    const inside = mask[i] > 0 && mask[i] > 1 - Math.sqrt(level) // water shrinks towards the centre
    if (inside) db = -17.5
    let s = 0
    for (let k = 0; k < 4; k++) s += -Math.log(1 - r())
    db += 10 * Math.log10(s / 4)
    out[i] = Math.max(0, Math.min(255, Math.round(((db + 25) / 25) * 255)))
  }
  return out
}

function opticalTile(w, h, mask, level, terrain, snow, r) {
  const out = new Uint8Array(w * h * 3)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x
    const shade = 0.55 + 1.6 * (terrain[i + (x < w - 1 ? 1 : 0)] - terrain[i]) * 6 + 0.25 * terrain[i]
    let c = [118 * shade, 108 * shade, 98 * shade]
    if (snow[i] > 0.62) c = [232 * shade + 20, 236 * shade + 20, 240 * shade + 20]
    if (mask[i] > 0) {
      const wet = mask[i] > 1 - Math.sqrt(level)
      c = wet ? [52, 128 + 30 * mask[i], 138 + 20 * mask[i]] : [150 * shade, 140 * shade, 124 * shade]
    }
    for (let k = 0; k < 3; k++) out[i * 3 + k] = Math.max(0, Math.min(255, Math.round(c[k] + (r() - 0.5) * 10)))
  }
  return out
}

function makeFrames(id, lon, lat, area, nisar, optical, water, depth) {
  const W = 160, H = 160, mPerPx = 20
  const seed = [...id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) | 0
  const terrain = noiseField(W + 1, H, 22, seed)
  const fine = noiseField(W + 1, H, 6, seed + 1)
  for (let i = 0; i < terrain.length; i++) terrain[i] = 0.75 * terrain[i] + 0.25 * fine[i]
  const snow = noiseField(W + 1, H, 30, seed + 2)
  const mask = lakeMask(W + 1, H, Math.max(area, 2.5), seed + 3, mPerPx)
  const r = mulberry32(seed + 4)
  const half = (W * mPerPx) / 2
  const dLat = half / 111320, dLon = half / (111320 * Math.cos((lat * Math.PI) / 180))
  const bbox = [r5(lon - dLon), r5(lat - dLat), r5(lon + dLon), r5(lat + dLat)]

  const orbits = [...new Set(nisar.map((x) => x.orbit))]
  const nisarFrames = orbits.map((orbit) => {
    const looks = nisar.filter((x) => x.orbit === orbit && x.cls !== 'unusable')
    const strip = new Uint8Array(W * looks.length * H)
    looks.forEach((look, k) => {
      const tile = sarTile(W + 1, H, mask, water(dayIndex(look.t.slice(0, 10))), terrain, r, orbit.endsWith('A') ? 1 : -1)
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) strip[y * W * looks.length + k * W + x] = tile[y * (W + 1) + x]
    })
    const sprite = `frames/${id}_${orbit}.png`
    write(sprite, png(W * looks.length, H, 1, strip))
    return { orbit, sprite, tile_w: W, tile_h: H, dates: looks.map((x) => x.t), stretch_db: [-25, 0], bbox_lonlat: bbox }
  })

  const allNisar = nisar.filter((x) => x.cls !== 'unusable').map((x) => x.t)
  const optFrames = optical.filter((o) => o.clear >= 0.9).map((o) => {
    const d = o.t.slice(0, 10)
    const file = `optical/${id}/${d.replaceAll('-', '')}.png`
    const tile = opticalTile(W + 1, H, mask, water(dayIndex(d)), terrain, snow, r)
    const crop = new Uint8Array(W * H * 3)
    for (let y = 0; y < H; y++) crop.set(tile.subarray(y * (W + 1) * 3, y * (W + 1) * 3 + W * 3), y * W * 3)
    write(file, png(W, H, 3, crop))
    const tt = Date.parse(o.t)
    const nearest = allNisar.reduce((best, t) => (Math.abs(Date.parse(t) - tt) < Math.abs(Date.parse(best) - tt) ? t : best), allNisar[0])
    return { t: o.t, file, clear: o.clear, nearest_nisar: nearest }
  })
  return { nisar: nisarFrames, optical: optFrames }
}
function r5(x) { return +x.toFixed(5) }

// ---------- index and timeline ----------
write('index.json', { mock: true, generated: new Date(Date.UTC(2026, 10, 14, 12, 0)).toISOString(), season: [days[0], days.at(-1)], lakes: indexLakes })
write('timeline.json', { mock: true, days, coverage, lakes: timelineLakes })

// ---------- a large ice-dammed lake that drains (stands in for merzbacher.json) ----------
{
  const W = 300, H = 300, mPerPx = 14
  const terrain = noiseField(W + 1, H, 40, 991)
  const fine = noiseField(W + 1, H, 9, 992)
  for (let i = 0; i < terrain.length; i++) terrain[i] = 0.7 * terrain[i] + 0.3 * fine[i]
  const snow = noiseField(W + 1, H, 45, 993)
  const mask = lakeMask(W + 1, H, 190, 994, mPerPx)
  const r = mulberry32(995)
  const drain = dayIndex('2026-07-17')
  const level = (d) => (d < drain - 25 ? 0.55 + 0.45 * (d / (drain - 25)) : d < drain ? 1 : d === drain ? 0.3 : 0.03)
  const stateOf = (l) => (l >= 0.5 ? 'full' : l <= 0.1 ? 'empty' : 'partial')
  const crop = (tile, ch) => {
    const out = new Uint8Array(W * H * ch)
    for (let y = 0; y < H; y++) out.set(tile.subarray(y * (W + 1) * ch, y * (W + 1) * ch + W * ch), y * W * ch)
    return out
  }
  const curve = { nisar: [], s1: [], optical: [] }
  const frames = { nisar: [], optical: [] }
  const optTimes = []
  for (let d = 2; d < 95; d += rnd() < 0.5 ? 2 : 3) {
    const clear = rnd() < 0.4 || d === drain || d === drain + 1
    const l = level(d) * (d === drain ? 3 : 1) // the morning optical pass of the drainage day still shows water
    const st = stateOf(Math.min(1, l))
    const t = iso(d, 5, 37)
    curve.optical.push({ t, platform: 'Sentinel-2', state: clear ? st : 'unclear', clear: clear ? r2(uni(0.6, 1)) : r2(uni(0, 0.3)), image: `MOCK_S2_${days[d].replaceAll('-', '')}` })
    if (clear) {
      const file = `merzbacher/s2_${days[d].replaceAll('-', '')}.png`
      write(file, png(W, H, 3, crop(opticalTile(W + 1, H, mask, Math.min(1, l), terrain, snow, r), 3)))
      frames.optical.push({ t, file, state: st })
      optTimes.push([Date.parse(t), file])
    }
  }
  const basinHa = r2((mask.reduce((a, v) => a + (v > 0 ? 1 : 0), 0) * mPerPx * mPerPx) / 10000)
  for (const [orbit, phase, share] of [['098A', 5, 0.47], ['135D', 5 - 0 + 0, 0.42], ['034D', 10, 0.2]]) {
    const asc = orbit.endsWith('A')
    for (let d = phase + (orbit === '135D' ? 12 : 0) - (orbit === '135D' ? 12 : 0); d < 110; d += 12) {
      if (d >= NISAR_GAP[0] && d <= NISAR_GAP[1]) continue
      const dd = orbit === '135D' ? d : d + (orbit === '098A' ? 3 : 0)
      if (dd >= days.length) continue
      const l = level(dd)
      const t = iso(dd, asc ? 23 : 13, asc ? 51 : 44)
      const hh = r1(basinHa * share * l + Math.abs(gauss()) * 2), hv = r1(basinHa * share * 0.88 * l + Math.abs(gauss()) * 2)
      const base = `merzbacher/nisar_${orbit}_${days[dd].replaceAll('-', '')}`
      const gray = crop(sarTile(W + 1, H, mask, l, terrain, r, asc ? 1 : -1), 1)
      write(`${base}_hh.png`, png(W, H, 1, gray))
      const rgb = new Uint8Array(W * H * 3)
      for (let i = 0; i < W * H; i++) { rgb[i * 3] = gray[i]; rgb[i * 3 + 1] = Math.min(255, gray[i] * 0.8 + 20); rgb[i * 3 + 2] = Math.min(255, gray[i] * 0.9 + 10) }
      write(`${base}_rgb.png`, png(W, H, 3, rgb))
      const tt = Date.parse(t)
      const near = optTimes.reduce((b, o) => (Math.abs(o[0] - tt) < Math.abs(b[0] - tt) ? o : b), optTimes[0])
      const st = stateOf(l)
      curve.nisar.push({ t, orbit, hh_ha: hh, hv_ha: hv, state: st, granule: `MOCK_NISAR_L2_PR_GCOV_${orbit}_${days[dd].replaceAll('-', '')}` })
      frames.nisar.push({ t, orbit, hh: `${base}_hh.png`, rgb: `${base}_rgb.png`, state: st, water_ha_hh: hh, water_ha_hv: hv, s2: near[1], s2_gap_hours: r1(Math.abs(near[0] - tt) / 3600000) })
    }
  }
  for (const [orbit, phase] of [['136D', 3], ['056A', 9]]) for (let d = phase; d < 110; d += 12) {
    if (orbit === '136D' && d > 3 && d < 69) continue
    const l = level(d)
    curve.s1.push({ t: iso(d, orbit.endsWith('A') ? 12 : 0, 50), orbit, vv_ha: r1(basinHa * 0.4 * l + Math.abs(gauss()) * 3), vh_ha: r1(basinHa * 0.45 * l + Math.abs(gauss()) * 3), state: stateOf(l), image: `MOCK_S1_${orbit}_${days[d].replaceAll('-', '')}` })
  }
  for (const k of Object.keys(curve)) curve[k].sort((a, b) => a.t.localeCompare(b.t))
  frames.nisar.sort((a, b) => a.t.localeCompare(b.t))

  const bracket = (name, looks) => {
    const lastFull = looks.filter((x) => x.state === 'full' && x.t < iso(drain + 1, 12, 0)).at(-1)
    const firstEmpty = looks.find((x) => x.state === 'empty' && (!lastFull || x.t > lastFull.t))
    if (!lastFull || !firstEmpty) return null
    return { set: name, n_looks: looks.length, last_full: lastFull.t, first_empty: firstEmpty.t, full_to_empty_days: r2((Date.parse(firstEmpty.t) - Date.parse(lastFull.t)) / DAY) }
  }
  const opt = curve.optical.filter((x) => x.state !== 'unclear')
  const both = [...curve.nisar, ...curve.s1].sort((a, b) => a.t.localeCompare(b.t))
  const all = [...both, ...opt].sort((a, b) => a.t.localeCompare(b.t))
  const intervals = [bracket('Optics', opt), bracket('Sentinel-1 alone', curve.s1), bracket('NISAR alone', curve.nisar), bracket('Both radars', both), bracket('All sensors', all)].filter(Boolean)

  write('merzbacher.json', {
    mock: true, basin_ha: basinHa,
    orbit_note: { '098A': 'synthetic note: least layover in the basin', '135D': 'synthetic note: usable', '034D': 'synthetic note: weak water contrast, not usable for area' },
    curve, intervals, frames,
  })
}

// ---------- sources (names of the real products; the data session writes the real file) ----------
write('sources.json', {
  mock: true,
  sources: [
    { name: 'NISAR L2 GCOV (provisional)', agency: 'NASA / ISRO, ASF DAAC', product: 'NISAR_L2_GCOV_PROVISIONAL_V1', doi: '10.5067/NIL2GCOV-P1', url: null, licence: null, date_range: [days[0], days.at(-1)], role: 'L-band HH and HV backscatter of every lake' },
    { name: 'Sentinel-1 IW GRD', agency: 'ESA / Copernicus', product: 'COPERNICUS/S1_GRD', doi: null, url: null, licence: null, date_range: ['2026-06-01', '2026-10-31'], role: 'C-band VV and VH backscatter of every lake' },
    { name: 'Sentinel-2 L1C with Cloud Score+', agency: 'ESA / Copernicus, Google', product: 'COPERNICUS/S2_HARMONIZED', doi: null, url: null, licence: null, date_range: ['2026-06-01', '2026-10-31'], role: 'optical water share and image frames' },
  ],
})

console.log(`mock written to ${ROOT}: ${indexLakes.length} lakes, ${showcaseIds.length} showcase (${showcaseIds.join(', ')})`)
