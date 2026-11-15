// SI-assisted (Claude), NASA Space Apps 2026
// Renders public/favicon.svg to the PNG icon set with headless Chrome (no image library needed).
// Usage: node scripts/render-icons.mjs   (writes favicon-16/32/96, apple-touch-icon, icon-192/512, icon-512-maskable)
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pub = resolve(dirname(fileURLToPath(import.meta.url)), '../public')
const svg = readFileSync(join(pub, 'favicon.svg'), 'utf8')
const chrome = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => p && existsSync(p))
if (!chrome) throw new Error('No Chrome found; set CHROME')
const PORT = 9351
const ICONS = [
  ['favicon-16.png', 16, false],
  ['favicon-32.png', 32, false],
  ['favicon-96.png', 96, false],
  ['apple-touch-icon.png', 180, true],
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-512-maskable.png', 512, true],
]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'icons-'))}`, 'about:blank'], { stdio: 'ignore' })
try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break } catch { /* wait */ }
    await sleep(250)
  }
  for (const [name, size, full] of ICONS) {
    const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
    const ws = new WebSocket(t.webSocketDebuggerUrl)
    await new Promise((r) => ws.addEventListener('open', r, { once: true }))
    let id = 0
    const pending = new Map()
    ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) } })
    const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })) })
    // maskable and apple icons get a full bone square so that the platform can cut its own shape
    const body = full
      ? `<div style="width:${size}px;height:${size}px;background:#ece7d8;display:grid;place-items:center">${svg.replace('<svg ', `<svg width="${Math.round(size * 0.8)}" height="${Math.round(size * 0.8)}" `)}</div>`
      : svg.replace('<svg ', `<svg width="${size}" height="${size}" `)
    await send('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false })
    await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })
    await send('Page.navigate', { url: `data:text/html,${encodeURIComponent(`<html><body style="margin:0;background:transparent">${body}</body></html>`)}` })
    await sleep(400)
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: size, height: size, scale: 1 } })
    writeFileSync(join(pub, name), Buffer.from(shot.data, 'base64'))
    console.log('ok', name)
    ws.close()
  }
} finally {
  proc.kill()
}
