# Data contract between the data package and the web app

Written by the main session, 14 Nov 2026, 17:15. The session that builds the data writes exactly these files under
`spaceapps2026/app/public/data/`; the session that builds the app reads exactly these files. If one side needs a change,
it edits this file first and says so in its report. Dates are ISO 8601 UTC. `c` values are basin minus ring in dB
(negative = basin darker). A missing value is `null`, never 0.

## `index.json`

```json
{
  "generated": "2026-11-14T12:30:00Z",
  "season": ["2026-06-18", "2026-10-25"],
  "lakes": [
    {
      "id": "ZHE-0518", "lat": 44.8519, "lon": 80.1547, "area_ha": 3.09, "region": "zhetysu_alatau",
      "elev_m": 3200, "showcase": true, "has_control": true,
      "n_clean": {"nisar": 19, "s1": 27, "optical": 9},
      "events": [
        {"kind": "emptying", "sensor": "s1", "orbit": "158A", "before": "2026-08-26T00:50:00Z",
         "after": "2026-08-28T12:45:00Z", "step_db": 7.2}
      ]
    }
  ]
}
```

`events` come from the step rule of H2 in `research/04_analysis_plan.md` applied per sensor and orbit. `showcase` lakes
are the ones that get image frames.

Addition by the app-data session (14 Nov, before the first write): each event also carries `"pol"` (`"hh"` for NISAR,
`"vv"` for Sentinel-1: the rule runs on the co-polarised `c`) and `"next"` (time of the next usable look of the same
sensor within 12 days that was checked for a take-back, or `null` when there was none and the step stands unchecked).
The app may ignore both. Sensor names are `"nisar"` and `"s1"`; Sentinel-1 orbits are written as relative orbit plus
direction letter (`"158A"`), like NISAR orbits.

## `lakes/<id>.json`

```json
{
  "id": "ZHE-0518",
  "series": {
    "nisar": [{"t": "...", "orbit": "135D", "hh": -9.5, "hv": -8.6, "cls": "clean", "granule": "NISAR_L2_PR_GCOV_..."}],
    "s1": [{"t": "...", "orbit": "158A", "platform": "S1D", "vv": -9.4, "vh": -7.7, "usable": true, "image": "S1D_IW_..."}],
    "optical": [{"t": "...", "water": 0.82, "clear": 0.97, "valid": true, "image": "20260822T..."}]
  },
  "frames": {
    "nisar": [{"orbit": "135D", "sprite": "frames/ZHE-0518_135D.png", "tile_w": 160, "tile_h": 160,
               "dates": ["2026-06-23T13:44:00Z"], "stretch_db": [-25, 0], "bbox_lonlat": [80.14, 44.84, 80.17, 44.86]}],
    "optical": [{"t": "...", "file": "optical/ZHE-0518/20260822.png", "clear": 0.97, "nearest_nisar": "2026-08-22T13:44:00Z"}]
  }
}
```

`cls` is `clean`, `swath_edge` or `unusable`; looks of a zero pass are left out. `frames` is present only for showcase
lakes. A sprite is one horizontal strip of equal tiles, north up, in date order.

Additions by the app-data session (14 Nov, evening; the app may ignore all of them):
- In `lakes/<id>.json` the `hh` (or `hv`) value of a look whose class in that polarisation is `unusable` is `null`.
- Each NISAR sprite also has `"cls"` (one class per date, parallel to `dates`; unusable looks have no tile, so only
  `clean` and `swath_edge` occur) and `"outline_px"` (the lake polygon as `[x, y]` pixels of one tile). Tiles are
  greyscale PNG with alpha: no-data pixels are transparent. All sprites of one lake have the same tile size and window.
- `frames.box`: `{"epsg", "utm": [xmin, ymin, xmax, ymax], "bbox_lonlat", "pad_m": 300, "window_ul": [x, y],
  "px_m", "tile_w", "tile_h"}`, the common window of the NISAR and optical tiles.
- Each optical frame also has `"gap_h"` (scene time minus NISAR time, hours, within +-72), `"image"` (Sentinel-2 id)
  and `"valid"` (the plan's validity flag). There is one entry per NISAR date that has a scene within 3 days; several
  dates may point to the same file. An optical tile has exactly the size and window of the NISAR tiles of that lake.
- Files starting with `_` in `data/` are build bookkeeping, not read by the app.

## `merzbacher.json`

The drainage curve (`tables/merzbacher_curve.csv`) as arrays per sensor and orbit, the intervals of
`figures/merzbacher/merzbacher_intervals.json`, and the list of animation frames copied from `figures/merzbacher/frames/`
into `merzbacher/` with their dates.

## `results.json`

Filled by the main session after the scores are verified: one object per hypothesis with the numbers, the intervals and
the sentence that states the result. Until then the app shows "results are being verified" in that place.

## `sources.json`

One entry per data product actually used: name, agency, product id or short name, DOI or URL, licence, date range.

---

## Additions by the app session (14 Nov 2026, evening)

The app reads the shapes below. They sharpen the three loosely described files and add one file the map needs. The app
tolerates a missing file (it shows a plain "not available yet" state), so none of this blocks the data session.

### `timeline.json` (new; the map and the choreography strip need it)

`index.json` has no per-date values, and 659 lake files cannot be fetched to draw one map frame. One compact file:

```json
{
  "days": ["2026-06-18", "2026-06-19"],
  "coverage": {
    "nisar": [212, 0], "s1": [0, 318], "optical": [41, 0], "optical_cloudy": [377, 0]
  },
  "lakes": {
    "ZHE-0518": {
      "nisar": {"135D": [[5, -9.5], [17, -9.1]]},
      "s1": {"158A": [[3, -9.4]]},
      "optical": [[12, 0.82]],
      "optical_cloudy": [0, 2, 5]
    }
  }
}
```

- `days`: every UTC day of the season, in order. All other numbers that say "day" are indexes into it.
- `coverage`: per day, the number of lakes with a clean NISAR look, a usable Sentinel-1 look, a valid optical scene, and
  an optical pass that was not valid (`best_of_pass == 1`, `valid == 0`).
- `lakes.<id>.nisar.<orbit>`: `[day, c_hh]` of clean looks only (no swath edge, no zero pass), in date order.
- `lakes.<id>.s1.<orbit>`: `[day, c_vv]` of usable looks. Orbit labels as in the lake files.
- `lakes.<id>.optical`: `[day, water_share]` of valid scenes; `optical_cloudy`: days of passes that were not valid.
- One decimal for dB, two for shares.

### `merzbacher.json` (shape the app reads)

```json
{
  "basin_ha": 260.28,
  "orbit_note": {"098A": "most trustworthy for area (0.5% of the basin in layover)"},
  "curve": {
    "nisar": [{"t": "...", "orbit": "098A", "hh_ha": 85.7, "hv_ha": 73.4, "state": "full", "granule": "..."}],
    "s1": [{"t": "...", "orbit": "136D", "vv_ha": 65.8, "vh_ha": 60.1, "state": "full", "image": "..."}],
    "optical": [{"t": "...", "platform": "Sentinel-2", "state": "full", "clear": 0.66, "image": "..."}]
  },
  "intervals": [
    {"set": "Sentinel-2 alone", "n_looks": 38, "last_full": "2026-07-17T05:37:00Z",
     "first_empty": "2026-07-20T05:47:00Z", "full_to_empty_days": 3.01}
  ],
  "frames": {
    "nisar": [{"t": "...", "orbit": "098A", "hh": "merzbacher/nisar_098A_20260705_hh.png",
               "rgb": "merzbacher/nisar_098A_20260705_rgb.png", "state": "full", "water_ha_hh": 85.7,
               "water_ha_hv": 73.4, "s2": "merzbacher/s2_20260705.png", "s2_gap_hours": 8.1}],
    "optical": [{"t": "...", "file": "merzbacher/s2_20260705.png", "state": "full"}]
  }
}
```

Hectares are "radar-dark area inside the basin polygon", never lake area; the app labels them so. `state` is `full`,
`partial`, `empty` or `unclear`. Paths are relative to `data/`.

### `results.json` (shape the app reads; changed by the app session on 14 Nov, evening, when the results were wired in)

```json
{
  "verified": true,
  "verification_note": "what 'verified' means, one sentence",
  "headlines": [
    {"value": "648 of 657", "label": "lakes seen by NISAR", "line": "one plain sentence", "hypothesis": "H1"}
  ],
  "hypotheses": [
    {"id": "H1", "title": "the question", "status": "verified",
     "status_note": "optional sentence, for example why a part is pending",
     "sentence": "One sentence that states the result.",
     "guesses": [{"guess": "what the plan guessed", "outcome": "what came out", "verdict": "held",
                  "verdict_text": "optional words for the chip"}],
     "table": {"columns": ["Measure", "NISAR, L-band HH", "Sentinel-1, C-band VV"], "rows": [["...", "...", "..."]]},
     "points": ["further sentences"]}
  ]
}
```

- All numbers are **text**, exactly as verified, so that the app never rounds them again.
- `status`: `verified`, `pending` (waits for a person's check; drawn with a dashed side line) or `exploratory`.
- `verdict`: `held`, `wrong`, `partly`, `not_seen` or `open`.
- The landing page shows the first three `headlines`; the page `#/results` shows every hypothesis in file order; the
  method page lists title and sentence of each.
- While the file is missing, or `verified` is not `true`, or `hypotheses` is empty, the app shows "results are being
  verified" and no number.

### `sources.json` (shape the app reads)

```json
{"sources": [{"name": "NISAR L2 GCOV", "agency": "NASA / ISRO", "product": "NISAR_L2_GCOV_PROVISIONAL_V1",
              "doi": "10.5067/NIL2GCOV-P1", "url": "https://…", "licence": "…",
              "date_range": ["2026-06-18", "2026-10-25"], "role": "L-band backscatter of every lake"}]}
```

A bare array instead of `{"sources": [...]}` is read too. `doi`, `url`, `licence` and `role` may be `null`.

### Small notes

- In `lakes/<id>.json` a NISAR look of a single-pol granule has `"hv": null`.
- Sprite and optical paths are relative to `data/`.
- Optional per-lake field in `index.json`: `"name"` (for example "Merzbacher"); the app shows it when present.

---

## Passport and weekly list: additions by the app-data session (15 Nov 2026)

`passport.json` and `weeks.json` follow `app/PASSPORT_CONTRACT.md`, built by `pipeline/passport_build.py`. Beyond the
contract (the app may ignore all of these):

- `passport.json` `indicators[]`: `"pending": true` on `ice`, `snow`, `people` while their table is not wired yet.
- Indicator `history`: `"window": [start, end]` (ISO dates in 2026 spanning the earlier emptying windows) and
  `"due": true/false` when the lake emptied in earlier summers.
- Indicator `dam`: `"reason"` when the state is `not measurable`; `"images": ["dam/<id>_meta.json",
  "dam/<id>_phase.png", "dam/<id>_stack.png"]` for ILE-1023, ZHE-0241 and ZHE-0396 (files in `data/dam/`; the meta
  file explains pair dates, colour scale and sign).
- Indicator `agency`: `"links"` (the source pages), as in the contract.
- `weeks.json` `one_radar[]`: also `"kind"` (`emptying` or `filling`).
- `weeks.json` `counts`: also `listed_that_lost_water_late`, `listed_unknown_after`, `one_radar_steps`. The counts
  are per lake ever listed, using its `after.kind`.
- The last week is cut at the season end: 22 to 25 October.
- `_passport_stats.json` is bookkeeping.
- (15 Nov, evening) `weeks.json` `counts`: `called_lakes`, `called_that_emptied`, `called_that_lost_water_late`,
  `called_that_kept_water`, `called_unknown`, `observed_lakes`; `passport.json`: top-level `names_note`, per lake
  `name_source` (`agency`, `osm` or `null`). Meaning: `app/PASSPORT_CONTRACT.md`, section "Change of 15 Nov 2026,
  evening".
- (15 Nov, later) `passport.json` per lake: `near_name` (OpenStreetMap name of a match more than 60 m away; shown as
  "near ..."; `name` is then `null`). See `app/PASSPORT_CONTRACT.md`.
- (15 Nov, night) Indicator `people` is wired (`tables/exposure_lakes.csv`, report 20). Extra fields: `people_10km`,
  `people_25km`, `people_50km` (exact integers from the table; the `line` and `facts` round them to two significant
  figures from 1,000 up), `path_km`; `reason` when the state is `not quoted` (ILE-0947) or `not measurable`. The state
  is "about N people live within 1 km of the river below the lake" or "nobody counted within 1 km of the river below
  the lake"; tone always `neutral`.
- (15 Nov, night) New file `flowpaths.geojson`: one LineString per lake (659), the flow path of report 20 (MERIT Hydro
  D8, up to 50 km, shorter where it ends at a large lake), properties `lake_id`, `region`, `path_km`, `stop_reason`,
  `people_10km`, `people_25km`, `people_50km`, `quality`. 1.55 MB; derived from MERIT Hydro, published under ODbL 1.0
  (credit in `sources.json`). Built by `pipeline/prep_flowpaths.py`.
- (15 Nov, night) `sources.json` also lists MERIT Hydro v1.0.1, GHS-POP R2023A, GeoNames, OpenStreetMap and the method
  paper Taylor et al. 2023 (14 entries).
- (15 Nov, night) Indicator `snow` is wired (`tables/snow_ice_lakes.csv`, report 19). State: "ice or snow on the lake
  from between A and B" or "no lasting ice or snow by the end of the season"; tone `neutral`, `unknown` only when none
  of the three dates is a bracket. Extra fields: `n_brackets`, `autumn_status`, `open_water_status`,
  `spring_snow_status` (the table's status words). No radar-derived date is given. The `indicators[]` entry of `snow`
  has `"figure": "snow/snow_ice_calendar.png"` and `"figure_title"`; the file is in `data/snow/`.
- (15 Nov, night) Water states added: "readings differ: loss of water seen by one team member, not by the assistant",
  "no loss of water seen", "no loss of water seen (under snow or ice)". People states now: "about N people live within
  1 km of the river below the lake" (N of 100 or more), "few or no people within 1 km of the river below the lake",
  "not quoted"; extra field `population_check`. See `app/PASSPORT_CONTRACT.md`.
- (15 Nov, night) Indicator `ice` is wired (`tables/ice_speed_lakes.csv`, column `status`, report 18). States are the
  six status words; a speed appears only for "moves measurably". For TER-0055, TER-0109 and TER-0111 the indicator
  has `"images": ["ice/<id>.json", "ice/<id>.png", "ice/<id>_layer3.png"]` (files in `data/ice/`; the JSON gives
  dates, orbit, colour range and the corners for a map overlay). No indicator is `pending` any more, and no entry of
  `indicators[]` carries `"pending"`.
- (15 Nov, night, later) Water states "readings differ ..." and "no loss of water seen (under snow or ice)" removed;
  see `app/PASSPORT_CONTRACT.md`.
