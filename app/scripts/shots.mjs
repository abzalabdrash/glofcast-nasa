// SI-assisted (Claude), NASA Space Apps 2026
// Screenshots of every screen with headless Chrome over the DevTools protocol, saved under docs/v2/.
// (Real waiting time is needed: the WebGL map does not draw under Chrome's virtual-time screenshot flag.)
// Start the app first (npm run dev, or npm run preview after a build). `only` is a substring of a shot name.
// Needs Node 22 or newer.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
// Version 2: every pass of the redesign leaves its pictures under docs/v2/ as <pass>_<screen>.png.
// Usage: node scripts/shots.mjs <pass> [only] [baseUrl]   for example: node scripts/shots.mjs pass2 map
const pass = process.argv[2] ?? 'pass'
const only = process.argv[3] && process.argv[3] !== '-' ? process.argv[3] : null
const base = process.argv[4] ?? 'http://localhost:5183/'
const out = resolve(here, '../docs/v2')
mkdirSync(out, { recursive: true })
const PORT = 9347

const chrome = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => p && existsSync(p))
if (!chrome) throw new Error('No Chrome or Edge found; set CHROME to the browser binary')

const WEEK = 'week=2026-09-03'
const down = 'window.scrollTo(0, Math.round((document.querySelector(".sky")?.offsetHeight ?? innerHeight * 2.3) - innerHeight)); new Promise((r) => setTimeout(r, 11000))'
// name, route, width, height, seconds to wait, optional script to run before the picture
const shots = [
  // the still of the globe that the start page shows before the live globe is ready (written to public/)
  ['still_wide', '', 1440, 900, 12, "document.head.insertAdjacentHTML('beforeend', '<style>.sky__copy,.sky__dock,.sitehead,.sky__shade,.sky__still,.maplibregl-control-container{display:none!important}</style>'); new Promise((r) => setTimeout(r, 400))"],
  ['still_phone', '', 390, 844, 12, "document.head.insertAdjacentHTML('beforeend', '<style>.sky__copy,.sky__dock,.sitehead,.sky__shade,.sky__still,.maplibregl-control-container{display:none!important}</style>'); new Promise((r) => setTimeout(r, 400))"],
  ['landing_1440', '', 1440, 900, 9],
  ['landing_390', '', 390, 844, 9],
  ['landing_down_1440', '', 1440, 900, 6, down],
  ['landing_down_390', '', 390, 844, 6, down],
  ['landing_full_1440', '', 1440, 900, 6, 'full'],
  ['landing_reduced_1440', '', 1440, 900, 6, 'full'],
  ['landing_reduced_390', '', 390, 844, 6, 'full'],
  ['map_1440', `#/map?${WEEK}`, 1440, 900, 11],
  ['map_390', `#/map?${WEEK}`, 390, 844, 11],
  ['passport_1440', '#/map?week=2026-09-24&lake=ILE-0876', 1440, 900, 12],
  ['passport_390', '#/map?week=2026-09-24&lake=ILE-0876', 390, 844, 12],
  ['passport_open_1440', '#/map?week=2026-09-24&lake=ILE-0876', 1440, 900, 12, 'document.querySelectorAll(".pline__row")[1]?.click(); document.querySelector(".panel__body").scrollTop = 300; new Promise((r) => setTimeout(r, 900))'],
  ['passport_quiet_1440', '#/map?week=2026-09-03&lake=ZHE-0381', 1440, 900, 10],
  ['passport_dam_390', '#/map?week=2026-09-03&lake=ZHE-0396', 390, 844, 10, 'document.querySelectorAll(".pline__row")[2]?.click(); new Promise((r) => setTimeout(r, 900))'],
  ['palette_1440', `#/map?${WEEK}`, 1440, 900, 8, 'window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true })); new Promise((r) => setTimeout(r, 500))'],
  ['lake_1440', '#/lake/ILE-0876', 1440, 900, 7, 'full'],
  ['lake_390', '#/lake/ILE-0876', 390, 844, 7, 'full'],
  ['results_1440', '#/results', 1440, 900, 4, 'full'],
  ['results_390', '#/results', 390, 844, 4, 'full'],
  ['merzbacher_1440', '#/merzbacher', 1440, 900, 5, 'full'],
  ['merzbacher_390', '#/merzbacher', 390, 844, 5, 'full'],
  ['radar_1440', '#/radar', 1440, 900, 3, 'full'],
  ['radar_390', '#/radar', 390, 844, 3, 'full'],
  ['method_1440', '#/method', 1440, 900, 3, 'full'],
  ['method_390', '#/method', 390, 844, 3, 'full'],
  ['brand_1440', '#/brand', 1440, 900, 3, 'full'],
  ['brand_390', '#/brand', 390, 844, 3, 'full'],
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const proc = spawn(chrome, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'shots-'))}`,
  '--hide-scrollbars', '--enable-unsafe-swiftshader', '--no-first-run', 'about:blank',
], { stdio: 'ignore' })

async function ready() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      if (r.ok) return
    } catch { /* not up yet */ }
    await sleep(250)
  }
  throw new Error('Chrome did not open its debugging port')
}

function session(wsUrl) {
  const ws = new WebSocket(wsUrl)
  let id = 0
  const waiting = new Map()
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data)
    if (m.id && waiting.has(m.id)) {
      waiting.get(m.id)(m.result ?? m.error)
      waiting.delete(m.id)
    }
  })
  const open = new Promise((r) => ws.addEventListener('open', r, { once: true }))
  return {
    open,
    send: (method, params = {}) => new Promise((r) => { waiting.set(++id, r); ws.send(JSON.stringify({ id, method, params })) }),
    close: () => ws.close(),
  }
}

try {
  await ready()
  for (const [name, route, width, height, wait, script] of shots) {
    if (only && !name.includes(only)) continue
    const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
    const s = session(target.webSocketDebuggerUrl)
    await s.open
    await s.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: width < 600 ? 2 : 1, mobile: width < 600 })
    // a shot whose name contains "reduced" is taken with the reduced-motion preference set
    if (name.includes('reduced')) await s.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
    await s.send('Page.enable')
    await s.send('Page.navigate', { url: `${base}${route}` })
    await sleep(wait * 1000)
    let clip
    if (script === 'full') {
      // the whole page, from its top: the viewport grows to the height of the document (at most 9000 px)
      const h = await s.send('Runtime.evaluate', { expression: 'Math.min(9000, document.documentElement.scrollHeight)', returnByValue: true })
      const full = Math.max(height, h.result?.value ?? height)
      await s.send('Emulation.setDeviceMetricsOverride', { width, height: full, deviceScaleFactor: width < 600 ? 2 : 1, mobile: width < 600 })
      await sleep(1500)
    } else if (script) {
      await s.send('Runtime.evaluate', { expression: script, awaitPromise: true })
      await sleep(1200)
    }
    if (name.startsWith('still_')) {
      const shot = await s.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 })
      writeFileSync(resolve(here, `../public/globe-${name.replace('_', '-')}.jpg`), Buffer.from(shot.data, 'base64'))
      console.log(`ok   ${name}  -> public/`)
      s.close()
      await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`)
      continue
    }
    const shot = await s.send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip } : {}) })
    writeFileSync(join(out, `${pass}_${name}.png`), Buffer.from(shot.data, 'base64'))
    console.log(`ok   ${name}  ${width}x${height}`)
    s.close()
    await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`)
  }
} finally {
  proc.kill()
}
