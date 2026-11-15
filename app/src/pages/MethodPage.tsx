// SI-assisted (Claude), NASA Space Apps 2026
import { useIndex, useResults, useSources, verifiedResults } from '../data/load'
import { BLOCKS, PLACEHOLDER_NOTE, type Block } from '../content/blocks'
import { Prose } from '../components/Prose'
import { href } from '../lib/router'
import { SITE } from '../content/site'
import { dayMonthYear, num } from '../lib/format'

function BlockView({ b }: { b: Block }) {
  return (
    <section className="block" id={b.id} aria-labelledby={`${b.id}-h`}>
      <h2 className="h2" id={`${b.id}-h`}>{b.title}</h2>
      {b.placeholder ? (
        <div className="placeholder">
          <b>{PLACEHOLDER_NOTE}.</b> {b.brief} <span className="mono">src/content/blocks.ts</span>, block <span className="mono">{b.id}</span>.
        </div>
      ) : (
        <>
          {b.text?.length ? <Prose text={b.text} /> : null}
          {b.bullets?.length ? (
            <ul className="bullets">
              {b.bullets.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          ) : null}
        </>
      )}
    </section>
  )
}

export default function MethodPage() {
  const sources = useSources()
  const index = useIndex()
  const results = useResults()
  const res = verifiedResults(results)
  const first = ['method', 'definitions', 'weekly', 'passport', 'reading', 'people', 'agency', 'limits']
  const before = BLOCKS.filter((b) => first.includes(b.id))
  const after = BLOCKS.filter((b) => !first.includes(b.id))
  const toc = [
    ...before.map((b) => [b.id, b.title]),
    ['results', 'Results'],
    ['data', 'Data'],
    ...after.map((b) => [b.id, b.title]),
  ]

  return (
    <div className="wrap">
      <header className="page-head">
        <h1 className="h1">How the numbers were made</h1>
        <p className="lead">
          One question, fixed rules, open data. This page says how each number in the app was produced, what it cannot
          support, where the data come from and who did what.
        </p>
      </header>

      <div className="method">
        <nav className="toc" aria-label="On this page">
          {toc.map(([id, title]) => (
            <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ block: 'start' }) }}>
              {title}
            </a>
          ))}
        </nav>

        <div>
          {before.map((b) => <BlockView key={b.id} b={b} />)}

          <section className="block" id="results" aria-labelledby="results-h">
            <h2 className="h2" id="results-h">Results</h2>
            {res ? (
              <>
                <ul className="bullets">
                  {res.hypotheses!.map((h, i) => (
                    <li key={i}>
                      <b style={{ fontWeight: 600, color: 'var(--ink)' }}>{h.title}</b>{' '}
                      {h.sentence}
                      {h.status && h.status !== 'verified' ? <span className="muted"> ({h.status === 'pending' ? "pending a person's check" : h.status})</span> : null}
                    </li>
                  ))}
                </ul>
                {res.verification_note ? <p className="small muted">{res.verification_note}</p> : null}
                <p><a href={href('results')}>Every result with the guess written before the data, the intervals and the counts</a></p>
              </>
            ) : (
              <div className="placeholder">
                <b>Results are being verified.</b> The scores of the hypotheses appear here, with their intervals and the
                number of lakes behind each, once every headline number has been checked a second time.
              </div>
            )}
          </section>

          <section className="block" id="data" aria-labelledby="data-h">
            <h2 className="h2" id="data-h">Data</h2>
            {sources.status === 'loading' ? <p className="muted" role="status">Loading the list of sources…</p> : null}
            {sources.status === 'missing' ? <p className="muted">The list of data products is not available yet.</p> : null}
            {sources.status === 'ready' ? (
              <div className="scroll-x">
                <table className="data sources">
                  <thead>
                    <tr>
                      <th scope="col">Product</th>
                      <th scope="col">Agency</th>
                      <th scope="col">Identifier</th>
                      <th scope="col">Dates used</th>
                      <th scope="col">Licence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sources.data.map((s, i) => (
                      <tr key={i}>
                        <td>
                          {s.url || s.doi ? (
                            <a href={s.url ?? `https://doi.org/${s.doi}`} target="_blank" rel="noreferrer">{s.name}</a>
                          ) : s.name}
                          {s.role ? <div className="role">{s.role}</div> : null}
                        </td>
                        <td>{s.agency ?? ''}</td>
                        <td className="mono" style={{ fontSize: 11.5, overflowWrap: 'anywhere' }}>
                          {s.product ?? ''}
                          {s.doi ? <div>doi:{s.doi}</div> : null}
                        </td>
                        <td className="num" style={{ whiteSpace: 'nowrap' }}>
                          {s.date_range ? `${dayMonthYear(s.date_range[0])} to ${dayMonthYear(s.date_range[1])}` : ''}
                        </td>
                        <td>{s.licence ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {index.status === 'ready' ? (
              <p className="small muted">
                The app data hold {num(index.data.lakes.length)} lakes and were generated on {dayMonthYear(index.data.generated)}.
                Every point of a series carries the id of its granule or image; the lake cards link to them.
              </p>
            ) : null}
          </section>

          {after.map((b) => <BlockView key={b.id} b={b} />)}

          {/* the link to the repository appears once `repo` is set in src/content/site.ts */}
          {SITE.repo ? (
            <section className="block" id="code" aria-labelledby="code-h">
              <h2 className="h2" id="code-h">Code</h2>
              <p className="prose"><a href={SITE.repo} target="_blank" rel="noreferrer">{SITE.repo}</a></p>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
