// SI-assisted (Claude), NASA Space Apps 2026
// Renders results.json: each hypothesis with the guess of the analysis plan next to what came out.
// No number is written in the code; every figure is text of the data file.
import type { Guess, Hypothesis } from '../data/types'

const STATUS: Record<string, string> = {
  verified: 'Verified by two separate implementations',
  pending: "Pending a person's check",
  exploratory: 'Exploratory',
  people: 'A glance check by two team members',
  measuring: 'Being measured',
}
const VERDICT: Record<string, string> = {
  held: 'Held',
  wrong: 'Wrong',
  partly: 'Held in part',
  not_seen: 'Not seen',
  open: 'Open',
}

function Verdict({ g }: { g: Guess }) {
  return <span className={`verdict verdict--${g.verdict}`}>{g.verdict_text ?? VERDICT[g.verdict] ?? g.verdict}</span>
}

export function HypothesisView({ h, base }: { h: Hypothesis; base?: string }) {
  const status = h.status ?? 'verified'
  if (status === 'measuring') {
    return (
      <article className="hyp hyp--measuring">
        <p className="hyp__tags">
          <span className="tag">{h.id}</span>
          <span className="status status--measuring">{STATUS.measuring}</span>
        </p>
        <h2 className="hyp__quiet">{h.title}</h2>
        {h.status_note ? <p className="hyp__note">{h.status_note}</p> : null}
      </article>
    )
  }
  return (
    <article className={`hyp hyp--${status}`}>
      <header className="hyp__head">
        <p className="hyp__tags">
          <span className="tag">{h.id}</span>
          <span className={`status status--${status}`}>{STATUS[status] ?? status}</span>
        </p>
        <h2 className="h2">{h.title}</h2>
        {h.sentence ? <p className="hyp__sentence">{h.sentence}</p> : null}
        {h.status_note ? <p className="hyp__note">{h.status_note}</p> : null}
      </header>

      {h.guesses?.length ? (
        <div className="guesses" role="table" aria-label={`${h.id}: what we guessed and what came out`}>
          <div className="guesses__row guesses__row--head" role="row">
            <span role="columnheader">What we guessed, written before the data</span>
            <span role="columnheader">What came out</span>
          </div>
          {h.guesses.map((g, i) => (
            <div className="guesses__row" role="row" key={i}>
              <p role="cell" className="guesses__guess">{g.guess}</p>
              <div role="cell" className="guesses__out">
                <Verdict g={g} />
                <p>{g.outcome}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {h.table?.rows?.length ? (
        <div className="scroll-x">
          <table className="data hyp__table">
            <thead>
              <tr>
                {h.table.columns.map((c) => <th scope="col" key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {h.table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, k) => (k === 0 ? <th scope="row" key={k}>{cell}</th> : <td className="num" key={k}>{cell}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {h.figure && base ? (
        <figure className="hyp__figure">
          <img src={`${base}${h.figure.file}`} alt={h.figure.alt} loading="lazy" />
          {h.figure.caption ? <figcaption>{h.figure.caption}</figcaption> : null}
        </figure>
      ) : null}

      {h.points?.length ? (
        <ul className="bullets hyp__points">
          {h.points.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      ) : null}
    </article>
  )
}
