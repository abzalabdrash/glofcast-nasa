# GLOFcast

**Which glacial lake needs a look this week?**

Live site: https://abzalabdrash.github.io/glofcast-nasa/

NASA Space Apps Challenge 2026, challenge "Dancing with the SARs". A team of six from Almaty, Kazakhstan.

GLOFcast reads the opening season (18 June to 25 October 2026) of NISAR, the L-band radar of NASA and ISRO, on 659
glacial lakes of the northern Tien Shan, next to Europe's C-band radar Sentinel-1 and optical images. The site replays
that season week by week: which lakes asked for a look, and why, from what was known by then. Every lake has a
passport of seven lines: water, history, ground at the dam, ice beside the lake, snow and lake ice, people living
along the river below, and agency reports.

It is a replay of what was known, not a forecast. Nothing here says when a lake will burst.

## What was measured

Each number is printed by a script and was recomputed by a second, separate calculation.

- NISAR HH told a full lake from flat ground on 648 of 657 lakes; Sentinel-1 VV on 641.
- On 546 lakes that kept their water all season, Sentinel-1 raised a false "emptying" step on 96 lakes, NISAR on 30.
- Lake Merzbacher, 17 July 2026: Sentinel-2 photographed open water in the morning; NISAR, eight hours later, found
  about a third of the dark water it had seen on 5 July.
- The season was read through small windows of the NISAR files: 13.4 GB travelled instead of 408.5 GB.
- NISAR interferometry measured the ground at the dams of 591 lakes. Dams do not move more often than the ground
  next to them: a negative result, kept.
- Guesses that turned out wrong stay on the Results page of the site.

## Repository

| Path | What |
|---|---|
| `app/` | The web app: Vite, React, TypeScript, MapLibre GL. Static, no server, no login, no keys |
| `app/public/data/` | The data the site shows, written by the analysis scripts of the project |
| `app/CONTENT_FROM_MAIN.md` | Every result with its wording, its numbers and its limits |

```bash
cd app
npm install
npm run dev      # http://localhost:5183/
npm run build    # static site in app/dist/
```

## Earlier work of the team

The lake outlines, the half-month optical record and a Sentinel-1 test of 13 November 2026 come from the team's
earlier project GLOFcast (https://glofcast.org), as do the name, the wordmark and the map shell of the site.
Everything that uses NISAR, the control patches, the scores and this application were made during the hackathon,
14 and 15 November 2026.

## Prior work by others

Detecting emergent mountain lakes as a radar anomaly is the idea of THAW (Miles, Fugger, Allen, Steiner, Huggel:
"Early detection of emergent high-mountain lakes using Sentinel-1", EGU General Assembly 2026, EGU26-16809,
https://doi.org/10.5194/egusphere-egu26-16809). Our question is narrower: what NISAR adds to Sentinel-1 on the same
lakes.

## Use of SI

We used an SI coding and research assistant (Claude) to search the literature, write the data-reading and analysis
scripts, build this application and draft texts. The subject, the study area and the decisions were the team's.
Scripts carry a header saying they are SI-assisted. No image on the site is SI-generated: all are satellite data or
charts drawn from data.

## Data and credits

NISAR (NASA, ISRO) through the Alaska Satellite Facility; Sentinel-1 and Sentinel-2 (Copernicus); Landsat (USGS,
NASA); NASA GIBS; Sentinel-2 cloudless by EOX (CC BY-NC-SA 4.0); OpenFreeMap and OpenStreetMap contributors (ODbL);
Terrain Tiles (Mapzen); MERIT Hydro; GHS-POP (JRC). The full list with licences is on the Method page of the site.

## Licence

Code: Apache-2.0 (see `LICENSE`). Data and imagery keep the licences of their sources.
