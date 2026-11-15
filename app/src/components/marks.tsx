// SI-assisted (Claude), NASA Space Apps 2026
// Six directions for the mark, drawn as plain SVG. Ink is `currentColor`; the water (or the one accented part) takes
// `--mark-accent`, which falls back to the ink, so every mark also works in one colour.
// None of them is an orbit, an atom or a radar wave: each is about a lake.
import type { ReactElement } from 'react'

interface DrawProps {
  size?: number
  className?: string
}
const A = 'var(--mark-accent, currentColor)'

function Svg({ size = 32, className, children, label }: DrawProps & { children: React.ReactNode; label?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      {children}
    </svg>
  )
}

/** 1. The basin. A capital G that is a moraine ring seen from above: the gap is the breach, the bar is the water line, water pooled under it. */
function Basin(p: DrawProps) {
  return (
    <Svg {...p}>
      <path d="M24.4 7.6A11.8 11.8 0 1 0 27.8 16H16.4" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M8.5 19.3h15a8.1 8.1 0 0 1-15 0Z" fill={A} />
    </Svg>
  )
}

/** 2. The water line. A basin in section: full to its line this year, and the notch of an earlier record above it. */
function Level(p: DrawProps) {
  return (
    <Svg {...p}>
      <circle cx="16" cy="16" r="12.2" stroke="currentColor" strokeWidth="2.6" />
      <path d="M5.9 18.200h20.200a10.300 10.300 0 0 1-20.200 0Z" fill={A} />
      <path d="M4.800 11.600h7" stroke="currentColor" strokeWidth="2.400" strokeLinecap="round" />
    </Svg>
  )
}

/** 3. The contour. A lake as a topographic sheet draws it: contour lines crowd on the steep side, water lies inside them. */
function Contour(p: DrawProps) {
  return (
    <Svg {...p}>
      <path d="M5.200 10.400C8.400 4.800 17.600 2.800 24 6c5.400 2.700 6.600 9.400 4 14.600-2.700 5.400-9 8.700-15.300 7.700C6.300 27.300 2.400 21.800 3 16.300c.2-2.200.9-4.100 2.200-5.900Z" stroke="currentColor" strokeWidth="1.800" strokeLinejoin="round" />
      <path d="M6.300 15.400c1.300-3.700 5.200-6.100 9.300-5.500 4 .6 6.500 4 5.800 7.800-.8 4.300-5 7.400-9.500 6.900-4.300-.5-6.900-4.800-5.600-9.200Z" stroke="currentColor" strokeWidth="1.800" strokeLinejoin="round" />
      <path d="M9.500 17c.9-2 3.200-3.100 5.300-2.600 2 .5 3.200 2.300 2.800 4.200-.5 2.300-2.800 3.900-5.100 3.600-2.400-.3-3.900-2.700-3-5.200Z" fill={A} />
    </Svg>
  )
}

/** 4. Two looks. The same lake on two passes: full, then empty. The whole project in two circles. */
function Pair(p: DrawProps) {
  return (
    <Svg {...p}>
      <circle cx="10.6" cy="16" r="8.1" fill={A} />
      <circle cx="21.4" cy="16" r="6.8" stroke="currentColor" strokeWidth="2.6" />
    </Svg>
  )
}

/** 5. The monogram. A lower-case g whose lower bowl is a lake held under its upper bowl. */
function Mono(p: DrawProps) {
  return (
    <Svg {...p}>
      <circle cx="14.4" cy="10.8" r="6" stroke="currentColor" strokeWidth="2.8" />
      <path d="M19.4 6.300c1.100-1.900 2.900-2.800 5.300-2.600" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M12.200 16.400c-2.500 1.300-2.100 3.300.9 3.600" stroke="currentColor" strokeWidth="2.400" strokeLinecap="round" />
      <ellipse cx="15.4" cy="24.4" rx="9.2" ry="4.6" fill={A} />
    </Svg>
  )
}

/** 6. The lake in the name. The o of the wordmark, filled: at small sizes the mark is that o alone, slanted with the italic. */
function LakeO(p: DrawProps) {
  return (
    <Svg {...p}>
      <ellipse cx="16" cy="16" rx="9.4" ry="12" transform="rotate(14 16 16)" fill={A} />
    </Svg>
  )
}

export type MarkKey = 'basin' | 'level' | 'contour' | 'pair' | 'mono' | 'lakeo'

export const MARKS: Record<MarkKey, { name: string; kind: string; idea: string; draw: (p: DrawProps) => ReactElement }> = {
  basin: {
    name: 'The basin',
    kind: 'Monogram',
    idea: 'A capital G that is a moraine ring seen from above. The gap is the breach, the bar is the water line, and the water lies under it.',
    draw: Basin,
  },
  level: {
    name: 'The water line',
    kind: 'Symbol',
    idea: 'A basin in section, full to this year’s line, with the notch of an earlier record above it: how full a lake is against its own past.',
    draw: Level,
  },
  contour: {
    name: 'The contour',
    kind: 'Symbol',
    idea: 'A lake as a topographic sheet draws it: contour lines crowd on the steep side, and the water lies inside them.',
    draw: Contour,
  },
  pair: {
    name: 'Two looks',
    kind: 'Symbol',
    idea: 'The same lake on two passes: full, then only its shore. The whole project in two circles.',
    draw: Pair,
  },
  mono: {
    name: 'The lower bowl',
    kind: 'Monogram',
    idea: 'A lower-case g whose lower bowl is a lake, held under the upper one.',
    draw: Mono,
  },
  lakeo: {
    name: 'The lake in the name',
    kind: 'Wordmark',
    idea: 'The o of glofcast is filled: a lake in the middle of the word. Small, the mark is that o alone, leaning with the italic.',
    draw: LakeO,
  },
}
