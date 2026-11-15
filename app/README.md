# GLOFcast: the web app

SI-assisted (Claude), NASA Space Apps 2026. A static site: Vite, React, TypeScript, MapLibre GL. No server, no login,
no keys, no analytics. Licence: Apache-2.0.

```bash
npm install
npm run dev          # http://localhost:5183/
npm run build        # type check, then the static site in dist/
npm run preview      # serves dist/ on http://localhost:5184/
```

The site uses relative paths and hash routes, so `dist/` works from any sub-path (`https://<user>.github.io/<repo>/`)
with no configuration.

## Screens

| Route | What |
|---|---|
| `#/` | The start page: the one sentence over the globe; scrolling comes down to the lakes of the chosen week |
| `#/map` | The dashboard: the map, the week ruler, and one panel that is the list of the week or a lake passport. `?week=2026-09-03&lake=ILE-0876` opens a week and a lake |
| `#/lake/<id>` | The full record of one lake: passport, every look of both radars, frames, tables |
| `#/results`, `#/merzbacher`, `#/radar`, `#/method` | Results, the Merzbacher drainage, how radar sees a lake, method and credits |
| `#/brand` | The sheet of six mark directions; the one in use is set in `src/components/Brand.tsx` |

Ctrl/Cmd K (or `/`) opens the search for a lake by id or name on every page.

## Data

The app reads the files described in `DATA_SCHEMA.md` and `PASSPORT_CONTRACT.md` from `public/data/`. They are written
by the scripts `pipeline/prep_*.py` and `pipeline/passport_build.py` of the project, not by the app. Every sentence and
number on screen is text of those files.

`npm run mock` writes a small synthetic data set to `public/mock/` (not committed). The dev server uses it for any file
that is missing in `public/data/`, and for everything when the address carries `?mock`; a dark bar on top says so.
A production build never contains or reads mock data.

## Text the team edits

- `src/content/blocks.ts`: the text blocks of the page "Method, limits, data and credits" and the Merzbacher text.
- `src/content/site.ts`: name of the project, link to the repository.
- `public/data/results.json`: the checked facts of the start page and every hypothesis of the results page.
  Numbers are stored as text and shown as written. While `verified` is not `true` the app shows no result.

## Design

`PRODUCT.md` says who the site is for; `DESIGN.md` records the visual system (paper, ink, one accent, type, motion).
Styles: `src/styles/tokens.css` (foundation), `ui.css` (bar, menu, palette), `dash.css` (dashboard), `passport.css`,
`landing.css`, `reading.css` and the page sheets `pages.css`, `lake.css`, `misc.css`.

## Screenshots and icons

`node scripts/shots.mjs <pass> [only]` (with the dev server running) writes every screen at 1440 and 390 px to
`docs/v2/<pass>_<screen>.png`, and the two stills of the globe that the start page shows first to `public/`.
`node scripts/render-icons.mjs` renders `public/favicon.svg` to the PNG icon set.

## Credits

MapLibre GL JS (BSD-3-Clause); basemap OpenFreeMap, OpenMapTiles, OpenStreetMap contributors (ODbL); relief from the
Terrain Tiles open data set (Mapzen, on AWS); globe imagery NASA GIBS; mountain imagery Sentinel-2 cloudless 2024 by
EOX (CC BY-NC-SA 4.0); React and Vite (MIT); typefaces Instrument Serif, Hanken Grotesk, Cormorant, Inter and JetBrains
Mono (SIL OFL 1.1). The full list is on the page `#/method`.
