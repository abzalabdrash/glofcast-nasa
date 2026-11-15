// SI-assisted (Claude), NASA Space Apps 2026
// Writes SAMPLE files public/mock/weeks.json and public/mock/passport.json in the shape of PASSPORT_CONTRACT.md,
// so that the interface can be built before pipeline/passport_build.py has written the real files.
// The sentences are placeholders (they start with "Sample:"); lake ids and radar steps come from index.json so that
// the cards can show real frames. The dev server shows a "Synthetic data" bar while these files are in use.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, '../public/mock')
mkdirSync(out, { recursive: true })
const index = JSON.parse(readFileSync(resolve(here, '../public/data/index.json'), 'utf8'))

const DAY = 86400000
const t0 = Date.parse('2026-06-18T00:00:00Z')
const tEnd = Date.parse('2026-10-25T00:00:00Z')
const iso = (t) => new Date(t).toISOString().slice(0, 10)
const dm = (s) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

// [id, first week, last week, reasons, after]
const LISTED = [
  ['TER-0013', 0, 4, ['record_fill', 'due'], { kind: 'emptied', line: 'Sample: emptied in July.', checked: 'sample text' }],
  ['TER-0121', 1, 6, ['due'], { kind: 'emptied', line: 'Sample: emptied in August.', checked: 'sample text' }],
  ['TER-0016', 0, 3, ['record_fill'], { kind: 'emptied', line: 'Sample: emptied in July.', checked: 'sample text' }],
  ['ZHE-0189', 3, 5, ['both_radars_filling'], { kind: 'kept_water', line: 'Sample: the lake kept its water all season.', checked: 'sample text' }],
  ['ZHE-0299', 7, 10, ['due'], { kind: 'unknown', line: 'Sample: no valid look after this week.', checked: 'sample text' }],
  ['ILE-0962', 11, 13, ['due', 'both_radars_emptying'], { kind: 'emptied', line: 'Sample: emptied in September.', checked: 'sample text' }],
  ['ILE-0876', 13, 16, ['both_radars_emptying'], { kind: 'lost_water_late', line: 'Sample: lost its water from late September.', checked: 'sample text' }],
]
const REASON = {
  record_fill: 'Sample: fuller than in any earlier year.',
  due: 'Sample: emptied in most earlier summers.',
  both_radars_emptying: 'Sample: both radars saw the basin brighten by 3 dB or more.',
  both_radars_filling: 'Sample: both radars saw the basin darken by 3 dB or more.',
}

const weeks = []
for (let w = 0, t = t0; t <= tEnd; w++, t += 7 * DAY) {
  const end = Math.min(t + 6 * DAY, tEnd)
  const listed = LISTED.filter((l) => w >= l[1] && w <= l[2])
    .map((l) => ({ id: l[0], reasons: l[3].map((key) => ({ key, line: REASON[key] })), after: l[4] }))
    .sort((a, b) => b.reasons.length - a.reasons.length || a.id.localeCompare(b.id))
  const one = []
  for (const lake of index.lakes) for (const e of lake.events) {
    const ta = Date.parse(e.after)
    if (ta >= t && ta <= end + DAY && !listed.some((l) => l.id === lake.id) && one.length < 6 && lake.showcase)
      one.push({
        id: lake.id, sensor: e.sensor,
        line: `Basin ${e.kind === 'emptying' ? 'brightened' : 'darkened'} by ${Math.abs(e.step_db).toFixed(1)} dB in ${e.sensor === 'nisar' ? 'L-band' : 'C-band'} between ${dm(e.before)} and ${dm(e.after)}.`,
        after: { kind: 'kept_water', line: 'Sample: the lake kept its water all season.', checked: 'sample text' },
      })
  }
  weeks.push({ start: iso(t), end: iso(end), listed, one_radar: one })
}
const ever = new Set(weeks.flatMap((w) => w.listed.map((l) => l.id)))
writeFileSync(resolve(out, 'weeks.json'), JSON.stringify({
  mock: true, generated: '2026-11-15T15:00:00Z',
  counts: {
    weeks: weeks.length, lake_weeks_listed: weeks.reduce((a, w) => a + w.listed.length, 0), lakes_ever_listed: ever.size,
    listed_that_emptied: LISTED.filter((l) => l[4].kind === 'emptied').length,
    listed_that_kept_water: LISTED.filter((l) => l[4].kind === 'kept_water').length,
  },
  weeks,
}))

const indicators = [
  ['water', 'Water', 'How full is the lake, and did it change?'],
  ['history', 'History', 'Did it empty in earlier summers?'],
  ['dam', 'Ground at the dam', 'Does the ground that holds the lake move?'],
  ['ice', 'Ice beside the lake', 'Does the glacier next to the lake move?'],
  ['snow', 'Snow and lake ice', 'When was the basin free of snow and ice?'],
  ['people', 'People below', 'Who lives along the river below the lake?'],
  ['agency', 'Agency reports', 'What did the agency report about this lake?'],
].map(([key, title, question]) => ({ key, title, question, source: 'sample', report: 'research/04_analysis_plan.md', checked: 'sample text' }))

const pending = { state: 'pending', tone: 'unknown', line: null, facts: [], checked: null }
const lakes = {}
for (const [id, , , reasons, after] of LISTED) {
  lakes[id] = {
    name: id === 'ILE-0876' ? 'Lake No. 19, Talgar' : null,
    summary: `Sample: ${after.line.replace('Sample: ', '')}`,
    indicators: {
      water: { state: after.kind === 'emptied' ? 'emptied in 2026' : after.kind === 'kept_water' ? 'kept its water' : 'lost water late in the season',
        tone: after.kind === 'kept_water' ? 'neutral' : 'attention', line: 'Sample: the line of the water indicator.',
        facts: [['Largest area in 2026 (optics)', 'sample'], ['Earlier record', 'sample']], checked: 'sample text' },
      history: { state: reasons.includes('due') ? 'emptied in most earlier summers' : 'no emptying in the judged summers', tone: reasons.includes('due') ? 'attention' : 'neutral',
        line: 'Sample: the line of the history indicator.', facts: [], checked: 'sample text' },
      dam: { state: 'within the band of neighbouring ground', tone: 'neutral', line: 'Sample: the line of the dam indicator.', facts: [['Orbit', 'sample']], checked: 'sample text' },
      ice: pending, snow: pending, people: pending,
      ...(id === 'ILE-0876' ? { agency: { state: 'siphon work reported in 2026', tone: 'attention', line: 'Sample: the agency lowered this lake with siphons.', facts: [], checked: 'sample text', links: ['https://example.org/'] } } : {}),
    },
    unknowns: ['Sample: no radar pass between 27 July and 10 August 2026.', 'Nothing here says when or whether a lake will burst.'],
  }
}
writeFileSync(resolve(out, 'passport.json'), JSON.stringify({ mock: true, generated: '2026-11-15T15:00:00Z', indicators, lakes }))
console.log(`sample written: ${weeks.length} weeks, ${ever.size} lakes ever listed, ${Object.keys(lakes).length} passports`)
