// SI-assisted (Claude), NASA Space Apps 2026
import { useLayoutEffect, useRef, useState } from 'react'

/** Width of an element in CSS pixels, kept current by a ResizeObserver. */
export function useWidth<T extends HTMLElement>(initial = 600) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(initial)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const set = () => setWidth(Math.max(120, Math.round(el.clientWidth)))
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}
