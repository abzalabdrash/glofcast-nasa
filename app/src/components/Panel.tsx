// SI-assisted (Claude), NASA Space Apps 2026
// The one panel of the dashboard. On a wide screen it is a column of frosted bone beside the map. On a phone it is a
// bottom sheet with three stops (peek, half, full) that follows the finger, is thrown with the velocity of the
// release, resists softly past its ends and can be caught again at any moment.
import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'

export type Detent = 'peek' | 'half' | 'full'

interface Props {
  phone: boolean
  /** always visible: on a phone this is what stays on screen at the lowest stop, and the handle of the sheet */
  header: ReactNode
  children: ReactNode
  detent: Detent
  onDetent: (d: Detent) => void
  /** visible height of the sheet in px, reported whenever it settles (phone only) */
  onVisible?: (px: number) => void
  /** changes when the content is replaced, so that the scroll position starts at the top again */
  contentKey: string
  label: string
}

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Past an end the sheet follows less and less: nothing in the world stops dead. */
function rubber(over: number, dim: number, c = 0.5) {
  return (over * dim * c) / (dim + c * Math.abs(over))
}
/** Where a throw would come to rest (exponential decay, as scrolling does). */
function project(v: number, rate = 0.996) {
  return ((v / 1000) * rate) / (1 - rate)
}

export function Panel({ phone, header, children, detent, onDetent, onVisible, contentKey, label }: Props) {
  const el = useRef<HTMLElement>(null)
  const grab = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const y = useRef(0)
  const v = useRef(0)
  const raf = useRef(0)
  const drag = useRef<{ id: number; startY: number; startPos: number; moved: boolean; samples: [number, number][] } | null>(null)
  const latest = useRef({ detent, onDetent, onVisible })
  latest.current = { detent, onDetent, onVisible }

  const stops = useCallback(() => {
    const h = el.current?.offsetHeight ?? 0
    const peek = grab.current?.offsetHeight ?? 120
    return { h, peek: Math.max(0, h - peek), half: Math.max(0, h - Math.round(window.innerHeight * 0.5)), full: 0 }
  }, [])

  const place = useCallback((pos: number) => {
    y.current = pos
    if (el.current) el.current.style.transform = `translate3d(0, ${pos.toFixed(1)}px, 0)`
  }, [])

  const settle = useCallback(
    (pos: number) => {
      const s = stops()
      const visible = s.h - pos
      if (body.current) body.current.style.height = `${Math.max(0, visible - (grab.current?.offsetHeight ?? 0))}px`
      latest.current.onVisible?.(visible)
    },
    [stops],
  )

  const springTo = useCallback(
    (target: number, v0: number) => {
      cancelAnimationFrame(raf.current)
      if (reduced()) {
        place(target)
        settle(target)
        return
      }
      // while the sheet travels its body is as tall as it can get, so that no empty strip shows under the content
      if (body.current) body.current.style.height = `${Math.max(0, stops().h - (grab.current?.offsetHeight ?? 0))}px`
      v.current = v0
      let last = performance.now()
      const k = 260
      const c = 2 * Math.sqrt(k) * 0.92
      const step = (now: number) => {
        const dt = Math.min(0.032, (now - last) / 1000)
        last = now
        const a = -k * (y.current - target) - c * v.current
        v.current += a * dt
        let next = y.current + v.current * dt
        // the sheet never lifts off the bottom edge of the screen
        if (next < 0) {
          next = 0
          v.current = 0
        }
        place(next)
        if (Math.abs(y.current - target) < 0.4 && Math.abs(v.current) < 8) {
          place(target)
          settle(target)
          return
        }
        raf.current = requestAnimationFrame(step)
      }
      raf.current = requestAnimationFrame(step)
    },
    [place, settle, stops],
  )

  // a change of stop from outside (a lake was chosen, the handle was pressed): travel there
  const first = useRef(true)
  useLayoutEffect(() => {
    if (!phone) {
      cancelAnimationFrame(raf.current)
      if (el.current) el.current.style.transform = ''
      if (body.current) body.current.style.height = ''
      first.current = true
      return
    }
    const target = stops()[detent]
    if (first.current) {
      first.current = false
      place(target)
      settle(target)
      return
    }
    if (drag.current) return
    springTo(target, v.current)
  }, [phone, detent, place, settle, springTo, stops])

  // the height of the header changes with its content, and the window with the keyboard and the address bar
  useEffect(() => {
    if (!phone) return
    const on = () => {
      if (drag.current) return
      const target = stops()[latest.current.detent]
      cancelAnimationFrame(raf.current)
      place(target)
      settle(target)
    }
    const ro = new ResizeObserver(on)
    if (grab.current) ro.observe(grab.current)
    window.addEventListener('resize', on)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', on)
    }
  }, [phone, place, settle, stops])

  // Was keyboard focus inside the panel just before its content was replaced? (The pressed row is gone by the time
  // the new content is in, so this is remembered as it happens.)
  const hadFocus = useRef(false)
  useEffect(() => {
    const b = body.current
    if (!b) return
    b.scrollTop = 0
    // content replaced from inside the panel (a lake chosen from the list, the way back): focus stays in the panel,
    // at the top of the new content, instead of falling back to the page
    if (hadFocus.current) b.focus({ preventScroll: true })
  }, [contentKey])

  const onDown = (e: React.PointerEvent) => {
    if (!phone || drag.current) return
    if ((e.target as HTMLElement).closest('[data-nodrag], a, input, select')) return
    cancelAnimationFrame(raf.current)
    drag.current = { id: e.pointerId, startY: e.clientY, startPos: y.current, moved: false, samples: [[e.timeStamp, e.clientY]] }
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dy = e.clientY - d.startY
    if (!d.moved) {
      if (Math.abs(dy) < 6) return
      d.moved = true
      try {
        grab.current?.setPointerCapture(e.pointerId)
      } catch {
        /* the pointer is already gone: the drag still ends on pointerup or pointercancel */
      }
      if (body.current) body.current.style.height = `${Math.max(0, stops().h - (grab.current?.offsetHeight ?? 0))}px`
    }
    const s = stops()
    let pos = d.startPos + dy
    if (pos < s.full) pos = s.full - rubber(s.full - pos, 220)
    else if (pos > s.peek) pos = s.peek + rubber(pos - s.peek, 160)
    place(pos)
    d.samples.push([e.timeStamp, e.clientY])
    if (d.samples.length > 6) d.samples.shift()
  }
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    const s = stops()
    if (!d.moved) {
      // a tap on the handle steps the sheet: up from the lowest stop, down from the others
      if ((e.target as HTMLElement).closest('button')) return
      latest.current.onDetent(latest.current.detent === 'peek' ? 'half' : latest.current.detent === 'half' ? 'full' : 'half')
      return
    }
    const a = d.samples[0]
    const b = d.samples[d.samples.length - 1]
    const dt = Math.max(1, b[0] - a[0])
    const vel = e.timeStamp - b[0] > 90 ? 0 : ((b[1] - a[1]) / dt) * 1000
    const landing = y.current + project(vel)
    const order: Detent[] = ['full', 'half', 'peek']
    let best: Detent = 'half'
    let bestD = Infinity
    for (const k of order) {
      const dist = Math.abs(s[k] - landing)
      if (dist < bestD) {
        bestD = dist
        best = k
      }
    }
    v.current = vel
    if (best === latest.current.detent) springTo(s[best], vel)
    else latest.current.onDetent(best)
  }

  return (
    <aside
      ref={el}
      className={`panel glass${phone ? ' panel--sheet' : ''}`}
      aria-label={label}
      data-detent={phone ? detent : undefined}
      onFocus={(e) => {
        hadFocus.current = !(e.target as HTMLElement).closest('.ruler')
      }}
      onBlur={(e) => {
        // focus that leaves to another part of the page is forgotten; focus lost because its element was removed is not
        if (e.relatedTarget) hadFocus.current = false
      }}
    >
      <div
        ref={grab}
        className="panel__head"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {phone ? <span className="panel__handle" aria-hidden="true" /> : null}
        {header}
      </div>
      <div ref={body} className="panel__body" tabIndex={-1}>
        {children}
      </div>
    </aside>
  )
}
