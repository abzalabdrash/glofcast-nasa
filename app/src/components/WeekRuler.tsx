// SI-assisted (Claude), NASA Space Apps 2026
// The one control of the product: the week of the season. Drawn like the scale bar in the margin of a map: one tick
// per week, as tall as the list of that week is long. It is a native range input underneath, so it can be dragged,
// tapped, and stepped with the arrow keys, and a screen reader hears the dates.
import type { Week } from '../data/types'
import { dayMonth, ms, monthName } from '../lib/format'

/** "3 to 9 Sep" or "25 Jun to 1 Jul" */
export function weekRange(w: Week): string {
  const a = new Date(ms(w.start))
  const b = new Date(ms(w.end))
  if (a.getUTCMonth() === b.getUTCMonth()) return `${a.getUTCDate()} to ${dayMonth(w.end)}`
  return `${dayMonth(w.start)} to ${dayMonth(w.end)}`
}
/** "3 to 9 September 2026" */
export function weekLong(w: Week): string {
  const full = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const a = new Date(ms(w.start))
  const b = new Date(ms(w.end))
  const end = `${b.getUTCDate()} ${full[b.getUTCMonth()]} ${b.getUTCFullYear()}`
  if (a.getUTCMonth() === b.getUTCMonth()) return `${a.getUTCDate()} to ${end}`
  return `${a.getUTCDate()} ${full[a.getUTCMonth()]} to ${end}`
}

interface Props {
  weeks: Week[]
  week: number
  onWeek: (w: number) => void
  playing?: boolean
  onPlay?: () => void
  /** on the night globe the ruler is drawn in bone */
  night?: boolean
}

export function WeekRuler({ weeks, week, onWeek, playing, onPlay, night }: Props) {
  const n = weeks.length
  const most = Math.max(1, ...weeks.map((w) => w.listed.length))
  const cur = weeks[week]
  // the first week that starts in each month carries the name of the month
  const months = weeks.map((w, i) => {
    const m = new Date(ms(w.start)).getUTCMonth()
    return i === 0 || new Date(ms(weeks[i - 1].start)).getUTCMonth() !== m ? monthName(m) : null
  })

  return (
    <div className={`ruler${night ? ' ruler--night' : ''}`} data-nodrag>
      {onPlay ? (
        <button type="button" className="ruler__play" onClick={onPlay} aria-pressed={!!playing} aria-label={playing ? 'Pause the season' : 'Play the season week by week'}>
          {playing ? (
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.6" y="3" width="3" height="10" rx="1" /><rect x="9.4" y="3" width="3" height="10" rx="1" /></svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.3v9.4a.6.6 0 0 0 .92.5l7.2-4.7a.6.6 0 0 0 0-1L5.92 2.8A.6.6 0 0 0 5 3.3Z" /></svg>
          )}
        </button>
      ) : null}
      <p className="ruler__label" aria-live="off">
        <span className="ruler__dates">{weekRange(cur)}</span>
        <span className="ruler__n">week {week + 1} of {n}</span>
      </p>
      <div className="ruler__track" style={{ ['--n' as string]: n, ['--i' as string]: week }}>
        <span className="ruler__slot" aria-hidden="true" />
        <div className="ruler__bars" aria-hidden="true">
          {weeks.map((w, i) => (
            <span key={w.start} className={`ruler__week${i === week ? ' is-on' : ''}`}>
              {i === week ? <span className="ruler__count">{w.listed.length}</span> : null}
              <span className="ruler__bar" style={{ height: `${w.listed.length ? 18 + (w.listed.length / most) * 82 : 6}%` }} />
              {months[i] ? <span className="ruler__month">{months[i]}</span> : null}
            </span>
          ))}
        </div>
        <input
          className="ruler__range"
          type="range"
          min={0}
          max={n - 1}
          step={1}
          value={week}
          onChange={(e) => onWeek(Number(e.target.value))}
          aria-label="Week of the 2026 season"
          aria-valuetext={`Week ${week + 1} of ${n}, ${weekLong(cur)}, ${cur.listed.length} on the list`}
        />
      </div>
      <div className="ruler__steps">
        <button type="button" className="ruler__step" onClick={() => onWeek(Math.max(0, week - 1))} disabled={week === 0} aria-label="Earlier week">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" /></svg>
        </button>
        <button type="button" className="ruler__step" onClick={() => onWeek(Math.min(n - 1, week + 1))} disabled={week === n - 1} aria-label="Later week">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" /></svg>
        </button>
      </div>
    </div>
  )
}
