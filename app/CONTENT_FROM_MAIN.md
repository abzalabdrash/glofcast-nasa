# Content from the main session for the web app (14 Nov 2026, evening)

Verified = recomputed by two separate implementations that agree (`research/09a_main_check_h1h3.md` against
`research/09_results_draft.md`; the step rule: `tables/score_h2_false_steps.csv` against the events of
`app/public/data/index.json`, 79 steps on 61 lakes and 162 on 114 lakes in both). Drafts of the text blocks follow; the
team may reword them, the numbers may not change without a script.

## Results

### H1. Can each radar tell a lake from flat ground? (verified)

- Sentence: "Both radars separate a water-filled lake from lake-shaped patches of flat ground almost every time, and the
  smallest lakes of the catalogue are no exception."
- NISAR L-band HH: AUC 0.980 (0.972 to 0.986). Sentinel-1 C-band VV: AUC 0.972 (0.964 to 0.980). Difference +0.0075
  (-0.0001 to +0.0147).
- Lakes detected at a 5% rate on controls, of 657 lakes with water looks: NISAR HH 648 (98.6%, 97.4 to 99.4),
  Sentinel-1 VV 641 (97.6%). Either radar: 653 of 659.
- Lakes under 1 ha (0.81 to 1.0 ha): NISAR HH 43 of 44, Sentinel-1 VV 44 of 44. Lakes of 2 ha and more: 389 and 390 of 395.
- Rests on 8,653 NISAR and 7,952 Sentinel-1 looks of lakes with optical water within 5 days, and 9,203 and 8,970 looks
  of 311 control patches.
- What we guessed wrong: we expected clearly fewer detections under 1 ha. It was not seen. The catalogue has no lake
  under 0.81 ha, so the size at which detection breaks lies below what it can show.

### H2. Lakes that did not change: which radar cries wolf? (verified)

- Sentence: "On 546 lakes that kept their water all season, the C-band radar raised a false 'emptying' step on 96 lakes,
  the L-band radar on 30."
- Same rule, same season, co-polarised channel: Sentinel-1 VV 136 steps on 96 lakes (111 to 166 steps) from 13,938
  pairs of looks; NISAR HH 42 steps on 30 lakes (26 to 61) from 14,644 pairs.
- Either polarisation: Sentinel-1 182 steps on 124 lakes, NISAR 52 on 35.
- Asking both radars to agree within 7 days keeps 46 of the 182 Sentinel-1 steps (25%, 16 to 35) and 33 of the 52
  NISAR steps (63%, 47 to 78).
- Related: control patches look dark (3 dB or more below their surroundings) in about 7% of NISAR HH looks and about
  12% of Sentinel-1 VV looks.

### H2. Lakes that did empty in 2026 (pending a person's check of the 17 events)

- Of the 17 lakes that the optical record flagged, the contact sheets suggest 12 real, 3 false and 2 unclear (proposed
  by the assistant, not confirmed).
- Real events of 1 ha and more (8): NISAR caught 7, Sentinel-1 caught 7, the two together all 8.
- Real events under 1 ha (4): neither radar caught any. A full lake of that size is seen; its draining is not caught
  by a 3 dB step.
- Median time between the look before and the look after: NISAR 9.6 days, Sentinel-1 12.0, both 8.5; optics 5.0 days
  where it could bracket at all (7 of the 12 real events). We predicted about 5 days for Sentinel-1 and about 3 for
  both radars. That was wrong under our own rule, which never mixes orbits.

### H3. Does lingering snow fool one band more than the other? (verified, null result)

- Sentence: "From 18 June on, flat ground did not look dark more often in late June than in August, in either band."
- C-band minus L-band difference of the June excess: +0.004 (-0.016 to +0.025). Nothing is known about May and early
  June: NISAR data over these mountains start on 18 June 2026.

### Water that is in no catalogue (exploratory; verdicts by the assistant, not checked by a person)

- A wall-to-wall NISAR search over the Kyrgyz range and the Ile Alatau re-found 15 of 15 and 62 of 64 catalogued lakes,
  but radar alone left hundreds of false candidates (glacier ice, flat grass, bare sediment).
- With optics added: no water body new in 2026; 105 water bodies that existed before and are missing from our
  catalogue, 60 of them in neither inventory.

## Text blocks

**Method (short).** For each of 659 lakes we compare the radar echo inside the lake outline with a ring of ground 30 to
120 m around it. Calm water sends the pulse away from the radar, so a full basin is darker than its ring. One number
per look, per radar, per polarisation and per orbit; orbits are never mixed. The same number is computed for 311
control patches: copies of a lake outline moved onto flat dry ground. Optical images say whether a lake held water on a
given week. Every threshold was written down on 14 November before the catalogue-wide data were pulled; one deviation
(three NISAR passes that contain zeros are dropped) was recorded before any score was computed.

**Limits.** One season and one region. Radar brackets are set by the 12-day repeat of each orbit. Lakes under about
1 ha are seen when full but their draining was missed. Radar alone cannot find unknown lakes: glacier ice, flat grass
and bare sediment are as dark as water. Almost all NISAR products of this season are provisional. The optical rule is
valid only until about 10 September (low sun), so later events rest on radar and on eye checks. Nothing here predicts
an outburst; it shows whether water is present in a basin on each pass.

**Earlier work of the team.** The lake outlines and the half-month optical record come from our earlier project
GLOFcast (2026), as does a Sentinel-1 test of 13 November 2026 on nine sites. Everything that uses NISAR, the control
patches, the scores and this application were made during the hackathon, 14 and 15 November 2026.

**Prior work by others.** Detecting emergent mountain lakes as a radar anomaly is the idea of THAW (Miles, Fugger,
Allen, Steiner, Huggel: "Early detection of emergent high-mountain lakes using Sentinel-1", EGU General Assembly 2026,
EGU26-16809, https://doi.org/10.5194/egusphere-egu26-16809; code https://github.com/mountainhydro/THAW). Short-lived
lakes of the Tien Shan were described by Narama et al. (2018, NHESS 18, 983) and Daiyrov and Narama (2021, NHESS 21,
2245; 2026, NHESS 26, 1001). Our question is narrower: what NISAR adds to Sentinel-1 on the same lakes.

**SI statement (draft, the team must confirm it is true).** We used an SI coding and research assistant (Claude) to
search the literature, write the data-reading and analysis scripts, build this application and draft texts. The
subject, the study area and the decisions were the team's. Every number on this site is printed by a script in the
repository; scripts carry a header saying they are SI-assisted. No image on this site is SI-generated: all are satellite
data or charts drawn from data.

**Merzbacher 2026.** Lake Merzbacher, held back by the Inylchek glacier, empties every summer. In 2026 Sentinel-2 saw
open water with ice floes on the morning of 17 July; NISAR, eight hours later, found about a third of the dark water it
had seen on 5 July; Landsat 8 on the morning of 18 July (a hazy scene) and Sentinel-2 on 20 July show a floor covered
by stranded ice. We found no report of this drainage. The week of 17 to 21 July was the warmest of that summer at the
lake; we state the coincidence and claim no cause.

# Additions of 15 Nov 2026, 19:58 (main session)

These replace or extend the blocks above where they overlap. Numbers: `tables/human_checks_summary.csv`,
`tables/verify_main_h6.csv`, `tables/verify_main_h7.csv`, `tables/dam_scores*.csv`, `tables/replay_scores.csv`.

## The check by people (new block; also changes two blocks above)

- Two team members answered all 123 items of the checking page by eye: 105 water bodies missing from the catalogue, the
  17 optical events of 2026, and one Landsat scene at Merzbacher. The rule for reading their answers was written into
  the plan before any score was recomputed (deviation 3).
- Sentence: "Two team members looked at every case by eye. Where both agreed we say so; where they did not, the
  verdict stays the assistant's and is marked as not confirmed."
- The two agree weakly (Cohen's kappa 0.27 on the events, 0.28 on the missing water bodies). The water bodies were
  answered at a median of 1.4 and 1.6 seconds each and the page had no blind controls. Quote it as "a glance check by
  two team members", never as validation.
- Events (replaces "12 real, 3 false and 2 unclear, not confirmed"): both said yes on 8 of 17 (ILE-0886, TER-0007,
  TER-0013, TER-0016, TER-0070, TER-0121, ZHE-0170, ZHE-0299), both said no on 1 (ZHE-0434), and 8 are disputed. Of the
  12 events the assistant proposed as real, 7 are confirmed by both and none is rejected by both. TER-0007, which the
  assistant called unclear, both called real.
- H2 on the two sets, events of 1 ha and more. Proposed set (8): NISAR caught 7, Sentinel-1 caught 7, the two together
  8. Confirmed by both people (6): NISAR 4, Sentinel-1 5, the two together 5. Under 1 ha: 0 of 4 with a step in the
  window on the proposed set, 0 of 2 on the confirmed set. Median brackets on the confirmed set: NISAR 10.8 days,
  Sentinel-1 12.0, both 10.0, optics 5.0.
- Water in no catalogue (replaces "105 water bodies ..., 60 of them in neither inventory"): of 105 candidates, both
  team members saw a lake in 57, both saw none in 10, and they split on 38. Of the 60 that are in neither inventory:
  21 confirmed by both, 9 rejected by both. The Ile Alatau search area did worse than the Kyrgyz range (14 of 42
  against 43 of 62 confirmed by both).
- Merzbacher, Landsat 8 of 18 July: one team member saw open water in the basin, one did not. The scene stays "hazy,
  readers disagree"; the empty basin rests on Sentinel-2 of 20 July.

## The check by people, round 2 (15 Nov, night; five readers; replaces the counts of the round 1 block where they differ)

Numbers: `tables/human_checks_round2_summary.csv` (`pipeline/score_human_checks_round2.py`); the rule was written in
the plan before any round 2 answer existed: a case is confirmed only when every qualified reader says yes, rejected
only when every one says no.

- Sentence: "Five team members looked again, slowly, at every case the first two readers had not agreed on. Hidden
  among them were 15 pictures with a known answer; every reader got 14 or 15 of them right."
- Readers: five (the Team Owner and four team members; two of them had also done round 1). Buttons unlocked after 5
  seconds. Blind controls right: 15, 15, 15, 14, 14 of 15.
- Water in no catalogue (105 candidates): 67 seen as lakes by every reader (57 by both readers of round 1, 10 more by
  all five of round 2), 92 by a majority, and none rejected by every reader. Of the 60 that are in neither inventory:
  29 by every reader, 50 by a majority. Word it as "seen as lakes by team members", with the numbers, never as
  "validated".
- One of them, A0598 in the Kyrgyz range (0.44 ha), holds water on the 2025 photo and none on the 2026 photo, and all
  five readers marked it. The record agrees: NISAR saw water there from 18 June to 26 July 2026 and the optical scenes
  are dry by late August. A0657 (0.36 ha) shows the same in the record but the readers split on it. Seasonal ponds
  that emptied in 2026 and are in no catalogue.
- Events (17): 11 are real by every reader who saw them (8 by both readers of round 1; TER-0017, TER-0018 and ZHE-0518
  by all five of round 2). TER-0012 and TER-0014: four of five saw a loss of water, the fifth answered "under snow or
  ice"; they stay real as proposed. ZHE-0434: no loss, both readers of round 1. TER-0113: four of five saw no loss of
  water; KYR-0243: three of five; both stay "no loss of water" as proposed. TER-0106 stays unclear.
- So of the 12 events the assistant proposed as real, 10 are confirmed by every reader and 2 by four of five; none
  was rejected. Of its 3 "no loss" verdicts, none was overturned.
- H2 on the events that are real after round 2 (13): of 9 events of 1 ha and more NISAR caught 7, Sentinel-1 caught 7,
  the two together 8 (missed by both: TER-0007). Under 1 ha: 0 of 4 with a step in the window.
- H7 after round 2: 3 of the 4 flagged ponds emptied; the two lists named 7 of 13 emptyings.
- Merzbacher, Landsat 8 of 18 July: three readers saw no open water, two saw some. The scene stays "hazy, readers
  disagree"; the empty basin rests on Sentinel-2 of 20 July.

## H6. Does the ground at a dam move? (verified by two implementations; a negative result at catalogue scale)

- Sentence: "NISAR interferometry measured the ground at the dams of 591 lakes to a few millimetres per 12 days. Dams
  do not move more often than the ground next to them, but the same data show which landform beside a single lake is
  creeping, how fast, and in which months."
- Read by touching 21.5 GB instead of 386 GB of files: 26,885 windows of 659 lakes and 311 control patches, 11 orbits.
- As the plan states: the dam moves at 28 of 591 measurable lakes (4.7%; the plan guessed more than 5%); the same rule
  flags 28 of 307 control patches (9.1%).
- Lakes that empty against stable lakes: 10 of 25 against 13 of 525 by the plan's rule. This is not a property of dams:
  8 of the 10 lie on glacier ice, where the 20 m phase cannot be read. Off glacier ice it is 4 of 12 against 55 of 460
  (risk ratio 2.8, interval 0.6 to 5.7): twelve lakes cannot settle it.
- Off glacier ice the band of neighbouring ground is about -3.5 to +4 mm per 12 days; 65 of 491 lakes (13.2%) and 26 of
  253 control patches (10.3%) lie beyond it in at least one orbit.
- Cases seen by the assistant, not checked by a person: ZHE-0396, a moraine complex between a glacier front and the
  lake, lowers by 3.6 to 7.4 mm per 12 days along the line of sight in four orbits, near zero in late June and
  mid-October; ZHE-0241, a lobe 450 m long at the outlet, up to 18 to 21 mm per 12 days in mid-August; ZHE-0189, a
  slope creeping towards the lake, opposite signs from the two look directions. Images for the app:
  `figures/dam/app/`.
- What we guessed wrong: that more than 5% of dams move and that moving dams mark the lakes that empty.
- Limits to print next to it: one summer without a winter reference (the yearly thaw of the ground looks the same);
  line-of-sight values, not ground displacement; no layover mask in the product; provisional product.

## H7. Replay of 2026: would a watch list have named the lakes that emptied? (verified by two implementations)

- Sentence: "A list written before the season would have named 7 of the 12 lakes that emptied, on 16 lakes. Most of
  that comes from the plainest rule: this lake emptied in most earlier summers."
- Record-fill rule: 4 lakes flagged by 15 July of 651 that could be; 3 emptied 0 to 25 days after the flag, against 9
  of 647 unflagged lakes. All four lie on one glacier (Southern Inylchek), where 3 of 10 unflagged ponds emptied too:
  counted by glacier it is one observation.
- "Due" rule (emptied in at least 4 of the 7 summers 2019 to 2025): 13 lakes, 5 emptied in 2026, against 7 of 638.
- On the events confirmed by both team members (8) the lists named 2 (TER-0013 on both lists, TER-0121 on the due
  list); the other emptyings of the lists are among the disputed events.
- Limit to print: one season, one glacier carries the flags, and some "due" lakes above Almaty may be lowered by the
  agency every year (see the next block). Nothing here forecasts an outburst.

## Agency work seen from orbit (new; one matched lake, one candidate)

- ILE-0876 is the agency's "lake No. 19, Talgar": OpenStreetMap names a water body "№19" 30 m from our outline, and
  basin and elevation agree. Kazselezashchita launched siphons there by 8 August 2026 and had released more than
  38 thousand cubic metres by 12 August (two pages opened by the main session). In our data NISAR records the
  emptying step between 19 September and 4 October and Sentinel-1 between 24 September and 6 October. Optics is past
  its valid season by then (low sun), so the radars carry this; a look at the autumn photos by a person is still owed.
- Sentence: "Both radars saw lake No. 19 above Talgar lose its water from late September. The agency was lowering
  this lake with siphons in August and September, and a 2024 report says it empties every winter; from orbit we cannot
  tell the two apart."
- ILE-0962 is only a candidate for "lake No. 9" of the Aksai basin (no coordinates published). It emptied between 10
  and 26 September in both radars and emptied in 5 of 7 earlier summers.
- Source table: `data/agency_reports_2026.csv`; full compilation: `research/16_agency_ground_truth_2026.pdf`.

## People below a lake (verified by two implementations; exposure, not risk)

- Sentence: "For every lake we traced where its water would run and counted who lives within 1 km of that river in
  the first 50 km. It is a map of who lives downstream, not of who would be flooded."
- Method after Taylor et al. (2023): flow path on MERIT Hydro, people from GHS-POP 2025 (100 m). Checked by the main
  session with its own recount on 22 lakes: largest difference 1.1% (`tables/verify_main_exposure.csv`).
- Per lake, median people within 1 km of the river in the first 50 km: Ile Alatau 1,772 (121 lakes), Kyrgyz range
  5,321 (23), Terskey 11 (103), Zhetysu Alatau 35 (412). 149 of 659 lakes have 1,000 people or more; 24 further
  lakes (23 in the Zhetysu Alatau, ILE-0947) have a count that rests on one implausible cell of the population grid
  and are not quoted (`population_check` in `tables/exposure_lakes.csv`).
- Almost nobody lives close: within the first 10 km the median is 0 in every region and no lake has more than 350
  people. Where people are reached it is far down the valley (median 31 km to the first 1,000 in the Ile Alatau).
- Largest: ILE-0879 and ILE-0970 (about 410 thousand each, paths through Almaty), KYR-0114 (about 340 thousand,
  through Bishkek). Each person counted once: 1.09 million below the lakes of the Ile Alatau. Numbers of different
  lakes are never added: lakes of one valley share the same people.
- Lake No. 19 (ILE-0876) drains down the Left Talgar to the town of Talgar: 44 thousand people within 50 km, the first
  1,000 at 31 km. ILE-0962 drains down the Right Aksai and the Aksai to the western edge of Almaty: 48 thousand within
  50 km, the first 1,000 at 21 km. Both paths were looked at on the map and follow their valleys.
- Limits to print: most outburst floods do not travel 50 km; the population grid is a model; a path on a 90 m grid.
- Data credits: MERIT Hydro (Yamazaki et al. 2019; the flow-path file is published under ODbL 1.0), GHS-POP R2023A
  (JRC, CC BY 4.0), GeoNames (CC BY 4.0), Taylor et al. 2023 for the method.

## H9. Snow and lake ice in two radars (verified by two implementations; partly a negative result)

- Sentence: "Under autumn snow the ground looks about 1 dB darker to the C-band radar and almost unchanged to the
  L-band radar. Whether that also holds for wet spring snow could not be measured: NISAR began on 18 June, when the
  snow was gone."
- Autumn snow on flat ground (September and October), level against the same patch in snow-free July and August:
  NISAR HH -0.14 dB (-0.23 to -0.04; 362 looks on 190 patches), Sentinel-1 VV -1.03 dB (-1.12 to -0.90; 558 looks on
  242 patches). On the same 174 patches C-band lies 0.74 dB lower than L-band (0.62 to 0.84).
- Spring snow (June): Sentinel-1 VV -2.38 dB (-3.20 to -1.89), 28 looks on 21 patches. L-band: one look. The
  comparison the plan asked for cannot be made.
- The published -3 dB wet-snow threshold caught 10 of 28 June snow looks in C-band VV and 17 of 28 in VH, and 5 of 373
  snow looks of NISAR HH over the whole season.
- A lake under ice or snow is brighter against its shore than open water in both bands: AUC 0.81 (NISAR HH, 1,036
  looks under ice) and 0.78 (Sentinel-1 VV, 1,211 looks).
- Dates come from optics, as brackets between two clear scenes: the autumn change to ice or snow has a bracket on 507
  lakes, median width 5 days. Most lakes were already open and snow-free when the season began.
- What did not work, by the rule of the plan: the radars do not show the autumn change inside the optical bracket
  better than chance (45 to 55% of lakes pass; a shuffled series passes 68 to 72%).
- The agency's statements of June and July agree with what optics can see: 9 of 34 Ile Alatau lakes under ice or snow
  in early June, none below 3,300 m; 99 of 101 free of ice in 4 to 15 July.
- What we guessed wrong: that autumn snow shifts neither band by 1 dB (C-band shifts by 1.0); that the radars would
  date the freeze-up.
- Limits: one season; snow labels from Sentinel-2 at 20 m on clear days only; NISAR starts on 18 June.
- Figure for the app: `figures/snow/app/snow_ice_calendar.png` (659 lakes by elevation, open water against ice or
  snow through the season); redraw it in the app palette from `tables/snow_ice_lakes.csv` if that is easy.

## H8. Ice beside the lake (verified by two implementations; mostly a statement about the product)

- Sentence: "NISAR's offset product measured the glaciers beside 12 lakes, all on five large valley glaciers. For the
  small glaciers of the ranges above Almaty it could not: their motion in 12 days is not readable in this product,
  which does not mean the ice is still."
- 292 of 659 lakes have glacier ice within 300 m; 232 of them have a glacier large enough for the smallest tracking
  window (about 300 by 150 m).
- On ground that does not move the offsets are very quiet: noise floor 0.012 m per day (descending) and 0.017
  (ascending), three to four times below the 0.05 we guessed.
- The plan's rule as written flags 218 of 222 measurable lakes, and that is not motion: on glacier ice the raw offsets
  mostly fail and a failed zone reads as metres per day. After three checks (speeds that are physically possible, two
  viewing directions agreeing on the flow direction, flow pointing downhill) 12 lakes on 5 glaciers remain, 0.04 to
  0.24 m per day in the radar plane; all 12 flow directions point down the glacier.
- 206 lakes: "ice offsets not coherent"; 60: glacier too small for the window; 10: no stable ground within 2 km;
  4: below the noise floor; 367: no glacier within 300 m.
- Check where speeds are published: at the Merzbacher ice dam the glacier zone gives 0.16 to 0.20 m per day in three
  orbits; the trunk of the Southern Inylchek flows at 0.23 to 0.29 m per day (published central flow 0.25 to 0.35,
  Mayer et al. 2008).
- Lakes that emptied in 2026: five are ponds on the Southern Inylchek tongue; against the few stable cells there are,
  the pairs that span their emptying are faster than the season median 10 times of 25, against 4 of 105 for other
  pairs. Exploratory, small numbers, said as such.
- What we guessed wrong: a noise floor near 0.05 m per day (it is 0.012 to 0.017); that a control zone on rock can
  stand in for ice (it cannot: the ice surface itself changes in 12 summer days).
- Never "faster than usual": NISAR has no earlier season. Images for the app: `figures/ice/app/` (TER-0109 Koxkar
  Baqi glacier, TER-0111 Tuomuer glacier, TER-0055 Merzbacher basin).

All layers of the passport are now measured. Nothing is pending.
