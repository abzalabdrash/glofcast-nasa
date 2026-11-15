// SI-assisted (Claude), NASA Space Apps 2026
import { RAMP_STOPS, contrastColor } from '../lib/scale'

/** The legend of the map: what the colour of a dot means, in plain words. */
export function ContrastLegend() {
  const stops = [...RAMP_STOPS].reverse()
  const gradient = `linear-gradient(90deg, ${stops
    .map((v, i) => `${contrastColor(v)} ${(i / (stops.length - 1)) * 100}%`)
    .join(', ')})`
  return (
    <div className="legend">
      <p className="legend__title">Darker basin = more likely water</p>
      <div className="legend__bar" style={{ background: gradient }} aria-hidden="true" />
      <div className="legend__ends num" aria-hidden="true">
        <span>10 dB darker</span>
        <span>same as around</span>
      </div>
      <p className="legend__text">
        Calm water sends the radar pulse away, so a full basin looks darker than the ground around it. Each dot shows
        the latest clean look.
      </p>
      <ul className="legend__keys">
        <li><i className="key key--listed" aria-hidden="true" /> on the list of this week</li>
        <li><i className="key key--step" aria-hidden="true" /> radar step of 3 dB or more in the window</li>
        <li><i className="key key--stale" aria-hidden="true" /> latest look is older than the window</li>
        <li><i className="key key--none" aria-hidden="true" /> no clean look yet</li>
      </ul>
    </div>
  )
}
