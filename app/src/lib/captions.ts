// SI-assisted (Claude), NASA Space Apps 2026
// Captions are templates filled with numbers of the data files. No generated prose.
import type { LakeFile, LakeSummary } from '../data/types'
import { dayMonth, db, num, plural, regionName, sizeClass } from './format'

export function lakeCaption(lake: LakeSummary, file: LakeFile): string[] {
  const out: string[] = []
  const nisarClean = file.series.nisar.filter((r) => r.cls === 'clean')
  const nisarEdge = file.series.nisar.filter((r) => r.cls === 'swath_edge')
  const s1Ok = file.series.s1.filter((r) => r.usable)
  const optValid = file.series.optical.filter((r) => r.valid)
  const optAll = file.series.optical
  const orbitsN = new Set(file.series.nisar.map((r) => r.orbit))
  const orbitsS = new Set(file.series.s1.map((r) => r.orbit))

  out.push(
    `${lake.name ? `${lake.name} (${lake.id})` : lake.id} is a lake of ${sizeClass(lake.area_ha).label} ` +
      `${lake.elev_m != null ? `at ${num(lake.elev_m)} m ` : ''}in the ${regionName(lake.region)}.`,
  )

  const parts: string[] = []
  if (file.series.nisar.length)
    parts.push(
      `NISAR looked ${plural(file.series.nisar.length, 'time')} on ${plural(orbitsN.size, 'orbit')} ` +
        `(${num(nisarClean.length)} clean${nisarEdge.length ? `, ${num(nisarEdge.length)} at the swath edge` : ''})`,
    )
  if (file.series.s1.length) parts.push(`Sentinel-1 gave ${plural(s1Ok.length, 'usable look')} on ${plural(orbitsS.size, 'orbit')}`)
  if (optAll.length) {
    const last = optValid[optValid.length - 1]
    parts.push(
      `of ${plural(optAll.length, 'optical pass', 'optical passes')} ${num(optValid.length)} ${optValid.length === 1 ? 'was' : 'were'} valid` +
        (last ? `, the last on ${dayMonth(last.t)}` : ''),
    )
  }
  if (parts.length) out.push(`${parts.join('; ')}.`)

  // the darkest clean look of each radar
  const darkN = nisarClean.filter((r) => r.hh != null).sort((a, b) => a.hh! - b.hh!)[0]
  const darkS = s1Ok.filter((r) => r.vv != null).sort((a, b) => a.vv! - b.vv!)[0]
  const dark: string[] = []
  if (darkN) dark.push(`${db(Math.abs(darkN.hh!))} in L-band HH on ${dayMonth(darkN.t)} (orbit ${darkN.orbit})`)
  if (darkS) dark.push(`${db(Math.abs(darkS.vv!))} in C-band VV on ${dayMonth(darkS.t)} (orbit ${darkS.orbit})`)
  if (dark.length) out.push(`The basin was darkest against its ring by ${dark.join(' and by ')}.`)

  if (lake.events.length) {
    const big = [...lake.events].sort((a, b) => Math.abs(b.step_db ?? 0) - Math.abs(a.step_db ?? 0))[0]
    const nN = lake.events.filter((e) => e.sensor === 'nisar').length
    const nS = lake.events.filter((e) => e.sensor === 's1').length
    out.push(
      `The step rule (3 dB between two looks of one orbit, not taken back by the next look) fired ${plural(lake.events.length, 'time')}: ` +
        `${num(nN)} in L-band, ${num(nS)} in C-band. The largest: the basin ${big.kind === 'emptying' ? 'brightened' : 'darkened'} by ` +
        `${db(Math.abs(big.step_db ?? NaN))} between ${dayMonth(big.before)} and ${dayMonth(big.after)} ` +
        `(${big.sensor === 'nisar' ? 'L-band' : 'C-band'}, orbit ${big.orbit}).`,
    )
  } else {
    out.push('The step rule (3 dB between two looks of one orbit) did not fire for this lake in either radar.')
  }
  return out
}
