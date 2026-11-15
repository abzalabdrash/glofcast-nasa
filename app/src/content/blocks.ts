// SI-assisted (Claude), NASA Space Apps 2026
// Every text block of the site that the team may reword lives in this file.
// Source of the wording: app/CONTENT_FROM_MAIN.md (main session, 14 Nov 2026). Numbers in these texts may not
// change without a script. One string per paragraph; web addresses are turned into links when the page is drawn.
//
// A block with `placeholder: true` is drawn with a dashed frame and its `brief` instead of text.

export interface Block {
  id: string
  title: string
  placeholder?: true
  brief?: string
  text?: string[]
  bullets?: string[]
}

/** Blocks of the page "Method, limits, data and credits", in the order they are shown. */
export const BLOCKS: Block[] = [
  {
    id: 'method',
    title: 'Method',
    text: [
      'For each of 659 lakes we compare the radar echo inside the lake outline with a ring of ground 30 to 120 m around it. Calm water sends the pulse away from the radar, so a full basin is darker than its ring. One number per look, per radar, per polarisation and per orbit; orbits are never mixed. The same number is computed for 311 control patches: copies of a lake outline moved onto flat dry ground. Optical images say whether a lake held water on a given week. Every threshold was written down on 14 November before the catalogue-wide data were pulled; one deviation (three NISAR passes that contain zeros are dropped) was recorded before any score was computed.',
    ],
  },
  {
    id: 'definitions',
    title: 'Definitions and thresholds',
    text: [
      'Signal of one look: the mean backscatter of the basin minus the mean backscatter of its ring, in decibels. Negative means the basin is darker than its surroundings.',
      'A look is usable when at least 90% of the pixels of the basin and of the ring are valid. NISAR looks at the edge of the swath form a class of their own and are never mixed with clean looks. A control patch is a copy of the lake outline shifted by 200 to 400 m onto flat ground that shows no water.',
      'A radar step is a change of at least 3 dB between two consecutive usable looks of one orbit that the next look of the same radar, within 12 days, does not take back by more than half. The optical reference is the share of clear pixels of the basin classed as water in Sentinel-2 scenes that are at least 90% clear, with the sun no lower than 50 degrees above the horizon.',
    ],
  },
  {
    id: 'weekly',
    title: 'The weekly list',
    text: [
      'The start page replays the season in weeks of 7 days from 18 June 2026. Only data up to the end of a week may put a lake on the list of that week. It is a replay of what was known, not a forecast.',
      'A lake is on the list of a week when at least one of three things holds. One: it is fuller than in any earlier year (area at least 1.25 times the largest of any earlier year, at least 0.5 ha, in two consecutive valid looks) and has not emptied yet. Two: it emptied in at least half of the summers 2019 to 2025, the week lies inside the window of its earlier emptyings, and it has not emptied yet this year. Three: both radars show a held step of the same sign whose later looks lie within 7 days of each other.',
      'A step seen by one radar only is shown under the list as "one radar, not confirmed". The order is the number of reasons, then the lake id: there is no score and there are no weights. For every listed lake the page shows what happened afterwards, also when nothing happened.',
    ],
  },
  {
    id: 'passport',
    title: 'The lake passport',
    text: [
      'Each lake page opens with a passport: one line per indicator, with the state in plain words, the number behind it, its source, and how far it was checked. "Not measurable" is a state of its own and never a zero. An indicator whose measurement is not finished would be shown as "being measured" and carry no number; in this version every layer is measured.',
    ],
    bullets: [
      'Water: how full the lake is against its own record and whether it changed (NISAR, Sentinel-1, Sentinel-2).',
      'History: whether it emptied in earlier summers (half-month optical record of 2019 to 2025, earlier work of the team).',
      'Ground at the dam: line-of-sight motion of the ground 30 to 150 m below the lake against stable ground 300 to 800 m away, from NISAR interferograms of 12 days. A dam "moves" when its median motion lies beyond the band of the control patches in at least one orbit.',
      'Ice beside the lake: apparent speed of the glacier within 300 m of the lake from NISAR pixel offsets (80 m), against stable ground near the lake. Most small glaciers cannot be read in this product; that is said, never read as still ice.',
      'Snow and lake ice: when the basin was free of snow and ice, from clear Sentinel-2 scenes, with the two radars measured against those dates.',
      'People below: people living within 1 km of the river along the first 50 km below the lake, after Taylor et al. (2023), on flow paths of MERIT Hydro and the GHS-POP population grid. This is exposure, not risk: a map of who lives downstream, not of who would be flooded.',
      'Agency reports: what the emergency agency reported about the lake in 2026, where a lake could be matched.',
    ],
  },
  {
    id: 'reading',
    title: 'Reading windows, not files',
    text: [
      'A NISAR granule is about 2 GB. The scripts never download one: they read the few hundred kilobytes that cover a lake by HTTP range requests. The season of radar brightness cost 13.4 GB over the wire against 408.5 GB for the same granules as whole files; the interferometry of the dams 21.5 GB instead of 386 GB.',
    ],
  },
  {
    id: 'people',
    title: 'The check by people',
    text: [
      'Two team members answered all 123 items of a checking page by eye: 105 water bodies missing from the catalogue, the 17 optical events of 2026, and one Landsat scene at Merzbacher. The rule for reading their answers was written into the plan before any score was recomputed.',
      'An event is confirmed real when both said yes and confirmed false when both said no. Otherwise it is disputed and keeps the verdict proposed by the assistant, marked "not confirmed". Every score that rests on events is given on the proposed set and on the set confirmed by both people.',
      'The two agree weakly (Cohen\'s kappa 0.27 on the events, 0.28 on the missing water bodies). The water bodies were answered at a median of 1.4 and 1.6 seconds each and the page had no blind controls. It is a glance check by two team members, not a validation.',
      'In a second round only the cases the first two readers had not agreed on were shown again, mixed with 15 blind controls with a known answer, and the buttons unlocked after 5 seconds. One team member has read it so far and got 14 of the 15 controls right, so his answers count; he knew the items were candidates, so this reading is not blind. A second, independent reader of round 2 is still owed.',
    ],
  },
  {
    id: 'agency',
    title: 'Agency reports',
    text: [
      'ILE-0876 is the agency\'s "lake No. 19, Talgar": OpenStreetMap names a water body "No. 19" 30 m from our outline, and basin and elevation agree. Kazselezashchita launched siphons there by 8 August 2026 and had released more than 38 thousand cubic metres by 12 August. Both radars saw the lake lose its water from late September; the agency was lowering it with siphons in August and September, and a 2024 report says it empties every winter. From orbit we cannot tell the two apart.',
      'ILE-0962 is only a candidate for "lake No. 9" of the Aksai basin: the agency publishes no coordinates.',
      'Sources: https://informburo.kz/novosti/monitoring-selevoi-opasnosti-usilivaiut-v-gorax-almatinskoi-oblasti (8 August 2026), https://www.caravan.kz/news/uroven-vody-v-morennyh-ozerah-snizili-na-1-2-mln-kubometrov/ (12 August 2026), https://www.inform.kz/ru/selevaya-obstanovka-vgorah-kazahstana-ostaetsya-stabilnoy-mchs-34febec2 (10 September 2026; this page could not be opened and is quoted from the team\'s compilation), https://24.kz/ru/news/social/664523-sostoyanie-morennogo-ozera-19-vyzyvaet-opaseniya-spetsialistov , https://glofca.org/en/pilot-projects/kazakhstan/ , https://bes.media/news/shest-morennyh-ozer-v-almaty-ostayutsya-potentsialno-opasnymi-kak-gorod-zaschischayut-ot-seley/ .',
    ],
  },
  {
    id: 'limits',
    title: 'Limits',
    text: [
      'One season and one region. Radar brackets are set by the 12-day repeat of each orbit. Lakes under about 1 ha are seen when full but their draining was missed. Radar alone cannot find unknown lakes: glacier ice, flat grass and bare sediment are as dark as water. Almost all NISAR products of this season are provisional. The optical rule is valid only until about 10 September (low sun), so later events rest on radar and on eye checks. Nothing here predicts an outburst; it shows whether water is present in a basin on each pass.',
    ],
  },
  {
    id: 'earlier',
    title: 'Earlier work of the team',
    text: [
      'The lake outlines and the half-month optical record come from our earlier project GLOFcast (2026), as does a Sentinel-1 test of 13 November 2026 on nine sites. Everything that uses NISAR, the control patches, the scores and this application were made during the hackathon, 14 and 15 November 2026.',
      'The name GLOFcast, the visual design and the map shell of this application come from the team\'s earlier site GLOFcast (https://glofcast.org, Apache-2.0). Its hazard scores, rankings and forecasts were not carried over: every number here comes from the data of this project.',
      'Lake names come from OpenStreetMap, matched to the catalogue by the team\'s earlier name audit (accepted matches only); a name used by the emergency agency replaces it. Lakes without a name show their catalogue id.',
    ],
  },
  {
    id: 'prior',
    title: 'Prior work by others',
    text: [
      'Detecting emergent mountain lakes as a radar anomaly is the idea of THAW (Miles, Fugger, Allen, Steiner, Huggel: "Early detection of emergent high-mountain lakes using Sentinel-1", EGU General Assembly 2026, EGU26-16809, https://doi.org/10.5194/egusphere-egu26-16809; code https://github.com/mountainhydro/THAW). Short-lived lakes of the Tien Shan were described by Narama et al. (2018, NHESS 18, 983) and Daiyrov and Narama (2021, NHESS 21, 2245; 2026, NHESS 26, 1001). Our question is narrower: what NISAR adds to Sentinel-1 on the same lakes.',
    ],
  },
  {
    id: 'si',
    title: 'Use of SI (AI) tools',
    // Draft by the main session: the team must confirm that it is true before the site is published.
    text: [
      'We used an SI coding and research assistant (Claude) to search the literature, write the data-reading and analysis scripts, build this application and draft texts. The subject, the study area and the decisions were the team\'s. Every number on this site is printed by a script in the repository; scripts carry a header saying they are SI-assisted. No image on this site is SI-generated: all are satellite data or charts drawn from data.',
    ],
  },
  {
    id: 'software',
    title: 'Software and basemap',
    bullets: [
      'Map and globe: MapLibre GL JS (BSD-3-Clause).',
      'Globe imagery: NASA Global Imagery Browse Services (GIBS), Blue Marble shaded relief and bathymetry (NASA Earth Observatory).',
      'Mountain imagery on the start page and the satellite ground of the dashboard: Sentinel-2 cloudless 2024 by EOX IT Services GmbH (https://s2maps.eu), licensed CC BY-NC-SA 4.0, contains modified Copernicus Sentinel data.',
      'Basemap of the dashboard: OpenFreeMap "Positron" vector tiles, recoloured, © OpenMapTiles, data © OpenStreetMap contributors (ODbL).',
      'Relief and elevation: Terrain Tiles (Mapzen), an open data set hosted on AWS; sources include SRTM, GMTED2010 and ETOPO1.',
      'Interface: React and Vite (MIT). Charts are drawn by the app itself, with no chart library.',
      'Typefaces: Instrument Serif, Hanken Grotesk, Cormorant and Inter (the last two for lake names written in Cyrillic) and JetBrains Mono, all under the SIL Open Font License 1.1 and served from this site.',
      'Look and map shell: the team\'s earlier site GLOFcast (https://glofcast.org).',
      'Flow paths below the lakes: derived from MERIT Hydro v1.0.1 (Yamazaki et al. 2019); the flow-path file is published under ODbL 1.0.',
      'Population: GHS-POP R2023A, epoch 2025, 100 m (European Commission, Joint Research Centre), CC BY 4.0. Place names along the paths: GeoNames, CC BY 4.0.',
      'Method for people below a lake: Taylor et al. (2023), "Glacial lake outburst floods threaten millions globally", Nature Communications 14, 487, https://doi.org/10.1038/s41467-023-36033-x (CC BY 4.0).',
      'No analytics, no cookies, no login, no keys.',
    ],
  },
  {
    id: 'licence',
    title: 'Licence',
    text: [
      'The code of this application and of the processing scripts is released under the Apache License 2.0. The derived tables in the data folder may be reused under the same terms; the satellite products keep the licences of their providers, listed above.',
    ],
  },
]

/** The text of the Merzbacher page, shown under its title. */
export const MERZBACHER_TEXT: string[] = [
  'Lake Merzbacher, held back by the Inylchek glacier, empties every summer. In 2026 Sentinel-2 saw open water with ice floes on the morning of 17 July; NISAR, eight hours later, found about a third of the dark water it had seen on 5 July; Landsat 8 on the morning of 18 July (a hazy scene) and Sentinel-2 on 20 July show a floor covered by stranded ice. We found no report of this drainage. The week of 17 to 21 July was the warmest of that summer at the lake; we state the coincidence and claim no cause.',
]

/** Shown inside every placeholder so that it cannot be mistaken for finished text. */
export const PLACEHOLDER_NOTE = 'Text to be written by the team'
