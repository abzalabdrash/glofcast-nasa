# Product

<!-- impeccable:product-schema 1 -->

Written by the site-redesign session on 15 Nov 2026 from the task brief, `STATE.md` (section "Mission") and the
references in `prep/design_refs/`. No interview was held: the brief says the Team Owner does not want questions and
chooses from pictures. Every line below is taken from those sources; nothing here is a new product decision.

## Platform

web

## Users

- The jury of the NASA Space Apps Challenge 2026 ("Dancing with the SARs"): opens a link on a laptop or a phone, gives
  it seconds, and includes radar experts who discount everything after one inflated claim.
- People who decide where to go and look: hydrologists and the debris-flow agency above Almaty, mountaineers, the team.
  Their job on the screen: which glacial lake needs a look this week, and why.

## Product Purpose

GLOFcast replays the 2026 season of 659 glacial lakes of the northern Tien Shan week by week and gives every lake a
passport of seven indicators (water, history, ground at the dam, ice beside the lake, snow and lake ice, people below,
agency reports), each measured from NISAR, Sentinel-1 or optics, each with how far it was checked. Success: the
sentence and one screen are understood in three seconds, the app works on a phone and a desktop without a bug, and no
number on screen can be caught out.

## Positioning

A measurement, not a forecast: what NISAR (L-band) adds to Sentinel-1 (C-band) and optics on the same lakes, shown as
a weekly list with a reason for every lake and the wrong guesses left visible.

## Operating Context

Static site with hash routes and `base: './'`, served from a sub-path of GitHub Pages. Data are fixed JSON and image
files in `public/data/` (contracts: `DATA_SCHEMA.md`, `PASSPORT_CONTRACT.md`); sentences and numbers come from those
files and from `CONTENT_FROM_MAIN.md`. A 30 second demo video will be recorded from the site.

## Capabilities and Constraints

- Open sources only, no key: MapLibre, NASA GIBS, EOX Sentinel-2 cloudless (with its attribution), OpenFreeMap,
  Terrarium terrain. Fonts bundled; no request to a font host.
- English only. Lake names stay as written in OpenStreetMap (Kazakh, Kyrgyz, Russian).
- Words never used: "first", "predicts", "forecast" (except as a denial), "early warning", "real time", "live",
  "sees through snow". People numbers are "living within 1 km of the river below the lake": exposure, not risk.
- The app never writes or rounds a number itself.

## Brand Commitments

- Name GLOFcast, wordmark in lower case "glofcast". The team's voice is Instrument Serif italic for display, taken
  from the team's earlier site glofcast.org (named as earlier work).
- Taste notes of the earlier site: no glitch text, no sounds, no "live" chips, no blinking, nothing theatrical.
- Rejected on 15 Nov 2026: the dark dashboard look of the first version (`prep/design_refs/rejected_v1_*.png`) and its
  three logo drafts.

## Evidence on Hand

Real radar frames of 117 lakes (`public/data/frames/`), optical frames, the Merzbacher frames, dam and ice figures,
flow paths of all 659 lakes, verified results (`public/data/results.json`). No testimonials, no users to quote.

## Product Principles

1. One sentence, one screen, one action: the week, the lakes of that week, the reason.
2. A reason, never a score: every mark on screen can be opened down to the look that produced it.
3. What could not be measured is said as plainly as what was.
4. The map and the satellite picture are the surface; panels are few and quiet.

## Accessibility & Inclusion

Phone first-class (one hand, 44 px targets, no horizontal scroll), keyboard reachable, reduced motion honoured, state
never carried by colour alone.
