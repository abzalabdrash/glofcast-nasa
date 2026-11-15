// SI-assisted (Claude), NASA Space Apps 2026
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const DAY_MS = 86400000

/** Milliseconds of an ISO date or datetime, read as UTC. */
export function ms(iso: string): number {
  return Date.parse(iso.length === 10 ? `${iso}T00:00:00Z` : iso)
}

/** "26 Aug" */
export function dayMonth(t: string | number): string {
  const d = new Date(typeof t === 'number' ? t : ms(t))
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}
/** "26 Aug 2026" */
export function dayMonthYear(t: string | number): string {
  const d = new Date(typeof t === 'number' ? t : ms(t))
  return `${dayMonth(d.getTime())} ${d.getUTCFullYear()}`
}
/** "26 Aug, 00:50 UTC" */
export function dayTime(t: string | number): string {
  const d = new Date(typeof t === 'number' ? t : ms(t))
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${dayMonth(d.getTime())}, ${hh}:${mm} UTC`
}
export function monthName(i: number): string {
  return MONTHS[i]
}

export function db(x: number | null | undefined, digits = 1): string {
  if (x == null || Number.isNaN(x)) return 'no value'
  const s = Math.abs(x).toFixed(digits)
  // A real minus sign, and no "-0.0"
  return `${x < 0 && Number(s) !== 0 ? '−' : ''}${s} dB`
}
export function signedDb(x: number | null | undefined, digits = 1): string {
  if (x == null || Number.isNaN(x)) return 'no value'
  const s = Math.abs(x).toFixed(digits)
  return `${x < 0 ? '−' : '+'}${s} dB`
}
export function num(x: number | null | undefined, digits = 0): string {
  if (x == null || Number.isNaN(x)) return 'n/a'
  return x.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}
export function pct(x: number | null | undefined): string {
  if (x == null || Number.isNaN(x)) return 'n/a'
  return `${Math.round(x * 100)}%`
}
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${num(n)} ${n === 1 ? one : many}`
}

const REGION_NAMES: Record<string, string> = {
  ile_alatau: 'Ile Alatau',
  zhetysu_alatau: 'Zhetysu Alatau',
  terskey_alatau: 'Terskey Alatau',
  kyrgyz_range: 'Kyrgyz Range',
}
export function regionName(key: string): string {
  return REGION_NAMES[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Size classes of the analysis plan (research/04, section 3). */
export const SIZE_CLASSES = [
  { key: 'lt1', label: 'under 1 ha', min: 0, max: 1 },
  { key: '1-2', label: '1 to 2 ha', min: 1, max: 2 },
  { key: '2-5', label: '2 to 5 ha', min: 2, max: 5 },
  { key: '5-10', label: '5 to 10 ha', min: 5, max: 10 },
  { key: 'ge10', label: '10 ha and more', min: 10, max: Infinity },
] as const
export function sizeClass(areaHa: number) {
  return SIZE_CLASSES.find((c) => areaHa >= c.min && areaHa < c.max) ?? SIZE_CLASSES[SIZE_CLASSES.length - 1]
}

export const SENSOR_LABEL = {
  nisar: { band: 'L-band', name: 'NISAR', co: 'HH', cross: 'HV' },
  s1: { band: 'C-band', name: 'Sentinel-1', co: 'VV', cross: 'VH' },
  optical: { band: 'Optics', name: 'Sentinel-2', co: '', cross: '' },
} as const

/** Public search pages that open without login. */
export function granuleUrl(sensor: 'nisar' | 's1', id: string): string | null {
  if (!id || id.startsWith('MOCK')) return null
  if (sensor === 'nisar') return `https://search.earthdata.nasa.gov/search?q=${encodeURIComponent(id)}`
  return `https://search.asf.alaska.edu/#/?searchType=List%20Search&searchList=${encodeURIComponent(id)}`
}
