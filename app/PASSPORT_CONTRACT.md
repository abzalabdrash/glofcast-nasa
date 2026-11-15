# Contract for the lake passport and the weekly list

Written by the main session, 15 Nov 2026, 19:57. The data session writes the two files below under
`spaceapps2026/app/public/data/` with one script, `pipeline/passport_build.py`; the app session reads them. The rules
behind them are in `research/04_analysis_plan.md`, addendum of 15 Nov 2026 ("The weekly list and the lake passport").
If one side needs a change, it edits this file first and says so in its report. A missing value is `null`, never 0.
Every sentence in these files is built by the script from a table value with a fixed template, so the app never
writes a number itself.

The script must run when some input tables do not exist yet (the sessions for ice speed, snow and lake ice, and people
below are still working). An indicator whose table is missing gets `"state": "pending"` for every lake. Running the
script again after a table lands fills it in; nothing else changes.

## `passport.json`

```json
{
  "generated": "2026-11-15T15:10:00Z",
  "indicators": [
    {"key": "water", "title": "Water", "question": "How full is the lake, and did it change?",
     "source": "NISAR GCOV (L-band), Sentinel-1 (C-band), Sentinel-2", "report": "research/09_results_draft.md",
     "checked": "verified by two implementations; events checked by two team members by eye"}
  ],
  "lakes": {
    "ILE-0876": {
      "name": "Lake No. 19, Talgar",
      "summary": "Lost its water from late September, seen by both radars; the agency reported siphon work on this lake in August and September 2026.",
      "indicators": {
        "water":   {"state": "lost water late in the season", "tone": "attention",
                    "line": "Both radars saw the basin brighten by 3 dB or more between 19 Sep and 6 Oct.",
                    "facts": [["Largest area in 2026 (optics)", "3.4 ha"], ["Earlier record", "3.4 ha"]],
                    "checked": "radar steps: fixed rule; no person has checked this lake"},
        "history": {"state": "...", "tone": "neutral", "line": "...", "facts": [], "checked": "..."},
        "dam":     {"state": "...", "tone": "neutral", "line": "...", "facts": [], "checked": "..."},
        "ice":     {"state": "pending", "tone": "unknown", "line": null, "facts": [], "checked": null},
        "snow":    {"state": "pending", "tone": "unknown", "line": null, "facts": [], "checked": null},
        "people":  {"state": "pending", "tone": "unknown", "line": null, "facts": [], "checked": null},
        "agency":  {"state": "siphon work reported in 2026", "tone": "attention", "line": "...", "facts": [],
                    "checked": "...", "links": ["https://..."]}
      },
      "unknowns": ["Whether the loss of water in September is the agency's siphon or the lake's own winter emptying."]
    }
  }
}
```

`tone` is one of `attention` (a reason to look), `neutral` (measured, nothing unusual), `unknown` (not measurable, not
covered, pending). It is a display hint, not a score. `agency` is present only for lakes listed in
`data/agency_reports_2026.csv`. `name` only where a source gives one (that file); otherwise `null`.

### Indicators, their inputs and their states

| Key | Inputs | States (fixed list) |
|---|---|---|
| `water` | `data/lakes.geojson` (`opt_max_2026_ha`, `opt_prev_max_ha`, `opt_drawdown_2026`, `opt_regime`), `tables/score_h2_steps.csv` (held steps), `tables/score_h2_event_verdicts_final.csv`, `tables/replay_flags_2026.csv`, `tables/score_h1_lake.csv` | "emptied in 2026" (one of the 17 events with final verdict real; say "confirmed by two team members by eye" or "proposed by the assistant, not confirmed" from the column `status`), "lost water late in the season" (held emptying steps in both radars whose after-looks lie within 7 days, no event verdict), "fuller than in any earlier year" (record-fill flag), "kept its water" (optical drawdown under 0.2 and none of the above), "changed, not classed" (everything else), "not seen by either radar" |
| `history` | `tables/replay_due.csv` | "emptied in N of M earlier summers" with the range of dates (tone attention when `due`), "no emptying in M judged summers", "record too short" (fewer than 3 judged years) |
| `dam` | `tables/dam_motion_lakes.csv`, `tables/dam_cases_verdicts.csv` | "dam zone on glacier ice, phase not readable" (`glacier_share_dam` of 0.5 or more), "ground at the dam moves" (`moves_offglacier` = 1; give mm per 12 days along the line of sight, the orbit, the band; tone attention), "within the band of neighbouring ground", "not measurable" with the reason. Where a verdict by eye exists, add it as a fact labelled "seen by the assistant, not checked by a person". Always add the fact "By the same rule 13% of lakes and 10% of control patches move" to a moving dam |
| `ice` | `tables/ice_speed_lakes.csv` (pending: `research/18_ice_speed.md`) | the `status` column of that table, with speed and noise floor |
| `snow` | `tables/snow_ice_lakes.csv` (pending: `research/19_snow_lake_ice.md`) | three date brackets: snow gone from the ground, first open water, first lasting snow or ice; each may be "before the season", "after the season", "no clear scene" |
| `people` | `tables/exposure_lakes.csv` (pending: `research/20_people_below.md`) | "about N people live within 1 km of the river in the first 50 km below the lake" with the 10 and 25 km numbers as facts; tone always neutral; the line must end with "exposure, not risk" in the `checked` field |
| `agency` | `data/agency_reports_2026.csv` | the text of that file, shortened; `match_status` goes into `checked` |

`unknowns`: one to three sentences per lake from a fixed set, chosen by the states (examples: "No radar pass between
27 July and 10 August 2026."; "The ground at the dam could not be measured: the dam zone is under 8 pixels."; "Lakes
above Almaty are lowered by the agency with siphons; a shrinking lake here may be engineering."; "Nothing here says
when or whether a lake will burst.").

## `weeks.json`

```json
{
  "generated": "2026-11-15T15:10:00Z",
  "weeks": [
    {"start": "2026-06-18", "end": "2026-06-24",
     "listed": [
       {"id": "TER-0013",
        "reasons": [
          {"key": "record_fill", "line": "Fuller than in any earlier year: 4.0 ha against 2.9 ha in 2024."},
          {"key": "due", "line": "Emptied in 5 of 6 earlier summers, between 16 June and 16 July."}
        ],
        "after": {"kind": "emptied", "line": "Emptied between 14 and 25 July.",
                  "checked": "confirmed by two team members by eye"}}
     ],
     "one_radar": [
       {"id": "ZHE-0101", "sensor": "s1", "line": "Basin brightened by 3.4 dB in C-band between 12 and 24 June.",
        "after": {"kind": "kept_water", "line": "The lake kept its water all season.", "checked": "optical record"}}
     ]}
  ]
}
```

Reason keys: `record_fill`, `due`, `both_radars_emptying`, `both_radars_filling`. A reason may use only data up to the
`end` of its week. `after.kind` is one of `emptied`, `kept_water`, `lost_water_late`, `unknown`; it may use the whole
season and is what the app reveals when the user moves past the week. Order of `listed`: number of reasons, then id.
The file also carries, at top level, `"counts": {"weeks": n, "lake_weeks_listed": n, "lakes_ever_listed": n,
"listed_that_emptied": n, "listed_that_kept_water": n}` so the landing page can state how often the list was right
and wrong, from the file.

## Change of 15 Nov 2026, evening (asked by the main session, written by the app-data session)

- **Calls and observations.** A lake listed only by `both_radars_emptying` or `both_radars_filling` is an observation
  of that week, not a call: the same pair of steps lists it and defines its outcome. `weeks.json.counts` therefore also
  carries `called_lakes` (lakes listed by `record_fill` or `due` in at least one week), `called_that_emptied`,
  `called_that_lost_water_late`, `called_that_kept_water`, `called_unknown` (by `after.kind`; they add up to
  `called_lakes`), and `observed_lakes` (lakes listed only by the both-radar reasons in every week they were listed).
  The page states "right and wrong" from the called group only. The `listed_*` counts stay, over all listed lakes.
- **Names.** `name` in `passport.json` comes from OpenStreetMap via the team's earlier name audit (accepted matches only,
  copied to `data/lake_names_osm.csv`), written as in OpenStreetMap; a name matched in `data/agency_reports_2026.csv`
  wins. Each lake also has `"name_source"`: `"agency"`, `"osm"` or `null`. A top-level `"names_note"` gives the
  attribution sentence for the page.
- **Near names (15 Nov, later).** An OpenStreetMap name becomes `name` only when the matched feature lies at most 60 m
  from the outline (`dist_m` in `data/lake_names_osm.csv`). Farther accepted matches (group or neighbour names) give
  `name: null` and `"near_name": "<OSM name>"`, which the app shows as "near ...". An agency name still wins.
- **Agency lakes.** Every lake with an `agency` indicator gets the unknown "A change of water level that does not move
  the shore is invisible to all three sensors."; where the water state is "kept its water", the agency line adds that
  our optical record shows no change of area, so a lowering of the level by pipes is not visible as a change of area.
- **Round 2 of the human check (15 Nov, night).** The water indicator and `after` in `weeks.json` use
  `tables/score_h2_event_verdicts_after_round2.csv` (`verdict_after_round2`, `status`). Two water states are added to
  the fixed list: "readings differ: loss of water seen by one team member, not by the assistant" (TER-0113, KYR-0243;
  tone neutral, no dates, `after.kind` unknown) and "no loss of water seen" / "no loss of water seen (under snow or
  ice)" (optical events whose verdict after round 2 is false: ZHE-0434, TER-0106; tone neutral, `after.kind`
  kept_water).
- **People wording (15 Nov, night).** From report 20: a number only where `population_check` is ok and the count is 100
  or more; "Few or no people live within 1 km of the river in the 50 km below the lake" under 100 and for "one cell"
  (with a fact on the implausible cell); "not quoted" without a number for "too dense" (ILE-0947).
- **Ice beside the lake (15 Nov, night).** `ice` uses the column `status` of `tables/ice_speed_lakes.csv` (never
  `status_plan`) with the wording of section 9 of `research/18_ice_speed.md`. Tone: neutral for "moves measurably",
  "below the noise floor", "not ice-adjacent"; unknown for "ice offsets not coherent", "glacier too small for the
  tracking window", "not covered". A speed is shown only for "moves measurably". With this layer nothing in the
  passport is pending.
- **Round 2 with five readers (15 Nov, night, later).** `score_h2_event_verdicts_after_round2.csv` was rewritten. The
  state "readings differ ..." and the variant "no loss of water seen (under snow or ice)" are removed: nothing uses
  them. Optical events with `verdict_after_round2` false get "no loss of water seen" (`after.kind` kept_water); with
  `unclear` (TER-0106) they get "changed, not classed" with a line that says the change is unclear by eye (`after.kind`
  unknown). The `status` text is the `checked` field and, for emptied lakes, the bracket in the summary.
