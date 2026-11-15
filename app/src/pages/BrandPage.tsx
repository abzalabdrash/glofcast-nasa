// SI-assisted (Claude), NASA Space Apps 2026
// The mark: six directions on one sheet, for the Team Owner to choose from. Each is shown at 128, 32 and 16 px on ink
// and on bone, next to the lower-case wordmark, and as it would sit in a browser tab.
import { MARKS, type MarkKey } from '../components/marks'
import { MARK_IN_USE } from '../components/Brand'

const ORDER: MarkKey[] = ['basin', 'lakeo', 'pair', 'level', 'contour', 'mono']

/** The wordmark, alone or with the mark. In the wordmark-led direction the o of the word is the lake. */
function Lockup({ kind }: { kind: MarkKey }) {
  const M = MARKS[kind].draw
  if (kind === 'lakeo') {
    return (
      <span className="lockup lockup--word" role="img" aria-label="glofcast">
        <span aria-hidden="true">gl</span>
        <svg className="lockup__o" viewBox="0 0 22 30" aria-hidden="true"><ellipse cx="11" cy="15" rx="8.6" ry="11.6" transform="rotate(14 11 15)" fill="var(--mark-accent, currentColor)" /></svg>
        <span aria-hidden="true">fcast</span>
      </span>
    )
  }
  return (
    <span className="lockup">
      <M size={30} />
      <span>glofcast</span>
    </span>
  )
}

function Specimen({ kind, ground }: { kind: MarkKey; ground: 'ink' | 'bone' }) {
  const M = MARKS[kind].draw
  return (
    <div className={`spec spec--${ground}`}>
      <div className="spec__sizes">
        <figure><M size={128} /><figcaption>128</figcaption></figure>
        <figure><M size={32} /><figcaption>32</figcaption></figure>
        <figure><M size={16} /><figcaption>16</figcaption></figure>
      </div>
      <div className="spec__use">
        <Lockup kind={kind} />
        <span className="spec__tab" aria-label="As a browser tab">
          <M size={16} />
          <span>GLOFcast</span>
        </span>
      </div>
    </div>
  )
}

export default function BrandPage() {
  return (
    <div className="wrap brandsheet">
      <header className="page-head">
        <h1 className="h1">The mark, six ways</h1>
        <p className="lead">
          Each direction is about a lake, and none is an orbit or a radar wave. Shown at 128, 32 and 16 px on ink and on
          bone, beside the wordmark, and in a browser tab. The first one is in use on the site.
        </p>
      </header>
      <ol className="brandsheet__list">
        {ORDER.map((k, i) => (
          <li key={k} className="brandrow">
            <div className="brandrow__text">
              <p className="brandrow__n">{i + 1} of {ORDER.length}, {MARKS[k].kind.toLowerCase()}{k === MARK_IN_USE ? ', in use' : ''}</p>
              <h2 className="h2">{MARKS[k].name}</h2>
              <p>{MARKS[k].idea}</p>
            </div>
            <Specimen kind={k} ground="ink" />
            <Specimen kind={k} ground="bone" />
          </li>
        ))}
      </ol>
    </div>
  )
}
