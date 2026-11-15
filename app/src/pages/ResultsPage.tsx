// SI-assisted (Claude), NASA Space Apps 2026
import { useResults, useWeeks, verifiedResults } from '../data/load'
import { num } from '../lib/format'
import { HypothesisView } from '../components/ResultsView'
import { href } from '../lib/router'

export default function ResultsPage() {
  const r = useResults()
  const res = verifiedResults(r)
  const wrong = res ? res.hypotheses!.flatMap((h) => h.guesses ?? []).filter((g) => g.verdict === 'wrong').length : 0
  const guesses = res ? res.hypotheses!.flatMap((h) => h.guesses ?? []).length : 0
  const weeks = useWeeks()
  const counts = weeks.status === 'ready' ? weeks.data.counts : undefined

  return (
    <div className="wrap">
      <header className="page-head">
        <h1 className="h1">What we guessed, and what came out</h1>
        <p className="lead">
          The guesses were written down before the data of the whole catalogue were pulled. They stand here next to the
          outcome, the wrong ones included.
        </p>
        {res ? (
          <p className="small muted" style={{ maxWidth: '72ch' }}>
            {guesses} guesses, {wrong} of them wrong. {res.verification_note}{' '}
            <a href={href('method')}>Method, limits and data</a>.
          </p>
        ) : null}
      </header>

      {r.status === 'loading' ? <p className="state" role="status">Loading…</p> : null}
      {r.status !== 'loading' && !res ? (
        <div className="placeholder">
          <b>Results are being verified.</b> The scores of the hypotheses appear here, with their intervals and the number of
          lakes behind each, once every headline number has been checked a second time.
        </div>
      ) : null}
      {res && counts ? (
        <section className="replaycounts" aria-labelledby="rc-h">
          <h2 className="h2" id="rc-h">The weekly list, counted</h2>
          <p style={{ maxWidth: '72ch', color: 'var(--ink-2)' }}>
            The list on the start page replays the season from what was known each week. It is a replay, not a
            forecast. Counted over the whole season, from the data file:
          </p>
          {counts.called_lakes != null ? (
            <>
              <h3 className="h3">Calls: listed before the outcome, because a lake was fuller than ever or due by its earlier summers</h3>
              <dl className="facts facts--col">
                <div><dt>Lakes called</dt><dd>{num(counts.called_lakes)}</dd></div>
                <div><dt>emptied</dt><dd>{num(counts.called_that_emptied)}</dd></div>
                <div><dt>lost water late in the season</dt><dd>{num(counts.called_that_lost_water_late)}</dd></div>
                <div><dt>kept their water: the call was wrong</dt><dd>{num(counts.called_that_kept_water)}</dd></div>
                <div><dt>outcome not known</dt><dd>{num(counts.called_unknown)}</dd></div>
              </dl>
              <h3 className="h3">Observations, not counted as right or wrong</h3>
              <dl className="facts facts--col">
                {counts.observed_lakes != null ? <div><dt>Lakes listed only because both radars saw the change that week</dt><dd>{num(counts.observed_lakes)}</dd></div> : null}
                {counts.one_radar_steps != null ? <div><dt>Steps of one radar only, never listed</dt><dd>{num(counts.one_radar_steps)}</dd></div> : null}
                {counts.lakes_ever_listed != null ? <div><dt>All lakes ever on the list</dt><dd>{num(counts.lakes_ever_listed)}</dd></div> : null}
              </dl>
            </>
          ) : (
            <dl className="facts facts--col">
              {counts.lakes_ever_listed != null ? <div><dt>Lakes ever on the list</dt><dd>{num(counts.lakes_ever_listed)}</dd></div> : null}
            </dl>
          )}
        </section>
      ) : null}
      {res ? (
        <div className="hyps">
          {res.hypotheses!.map((h, i) => <HypothesisView h={h} key={`${h.id}-${i}`} base={r.status === 'ready' ? r.base : undefined} />)}
        </div>
      ) : null}
    </div>
  )
}
