// SI-assisted (Claude), NASA Space Apps 2026
// Types of the files described in app/DATA_SCHEMA.md.

export type SensorKey = 'nisar' | 's1' | 'optical'

export interface LakeEvent {
  kind: 'emptying' | 'filling' | string
  sensor: 'nisar' | 's1' | string
  orbit: string
  before: string
  after: string
  step_db: number | null
  pol?: string
  next?: string | null
}

export interface LakeSummary {
  id: string
  name?: string
  lat: number
  lon: number
  area_ha: number
  region: string
  elev_m: number | null
  showcase: boolean
  has_control: boolean
  n_clean: { nisar: number; s1: number; optical: number }
  events: LakeEvent[]
}

export interface IndexFile {
  mock?: boolean
  generated: string
  season: [string, string]
  lakes: LakeSummary[]
}

export interface NisarLook {
  t: string
  orbit: string
  hh: number | null
  hv: number | null
  cls: 'clean' | 'swath_edge' | 'unusable'
  granule: string
}
export interface S1Look {
  t: string
  orbit: string
  platform?: string
  vv: number | null
  vh: number | null
  usable: boolean
  image: string
}
export interface OpticalLook {
  t: string
  water: number | null
  clear: number | null
  valid: boolean
  image: string
}
export interface NisarSprite {
  orbit: string
  sprite: string
  tile_w: number
  tile_h: number
  dates: string[]
  stretch_db: [number, number]
  bbox_lonlat: [number, number, number, number]
  /** class of each tile, parallel to dates */
  cls?: ('clean' | 'swath_edge')[]
  /** the catalogue polygon in pixels of one tile */
  outline_px?: [number, number][]
}
export interface OpticalFrame {
  t: string
  file: string
  clear: number | null
  nearest_nisar: string | null
  /** scene time minus NISAR time, hours */
  gap_h?: number | null
  image?: string
  valid?: boolean
}
export interface LakeFile {
  id: string
  series: { nisar: NisarLook[]; s1: S1Look[]; optical: OpticalLook[] }
  frames?: { nisar: NisarSprite[]; optical: OpticalFrame[] }
}

export type DayValue = [number, number]
export interface TimelineLake {
  nisar: Record<string, DayValue[]>
  s1: Record<string, DayValue[]>
  optical: DayValue[]
  optical_cloudy: number[]
}
export interface TimelineFile {
  mock?: boolean
  days: string[]
  coverage: { nisar: number[]; s1: number[]; optical: number[]; optical_cloudy: number[] }
  lakes: Record<string, TimelineLake>
}

export type MerzState = 'full' | 'partial' | 'empty' | 'unclear' | string
export interface MerzFile {
  mock?: boolean
  basin_ha: number | null
  orbit_note?: Record<string, string>
  curve: {
    nisar: { t: string; orbit: string; hh_ha: number | null; hv_ha: number | null; state: MerzState; granule?: string }[]
    s1: { t: string; orbit: string; vv_ha: number | null; vh_ha: number | null; state: MerzState; image?: string }[]
    optical: { t: string; platform?: string; state: MerzState; clear: number | null; image?: string }[]
  }
  intervals: { set: string; n_looks: number | null; last_full: string; first_empty: string; full_to_empty_days: number }[]
  frames: {
    nisar: {
      t: string; orbit: string; hh: string; rgb?: string | null; state: MerzState
      water_ha_hh: number | null; water_ha_hv: number | null; s2?: string | null; s2_gap_hours?: number | null
    }[]
    optical: { t: string; file: string; state: MerzState }[]
  }
}

export type Verdict = 'held' | 'wrong' | 'partly' | 'not_seen' | 'open' | string
export interface Guess {
  /** what the analysis plan guessed before the data were pulled */
  guess: string
  outcome: string
  verdict: Verdict
  verdict_text?: string | null
}
export interface Hypothesis {
  id: string
  title: string
  /** verified, pending (waits for a person's check) or exploratory */
  status?: 'verified' | 'pending' | 'exploratory' | 'measuring' | 'people' | string
  status_note?: string | null
  sentence?: string | null
  guesses?: Guess[]
  /** numbers as text, exactly as verified; the first column is the name of the measure */
  table?: { columns: string[]; rows: string[][] } | null
  points?: string[]
  /** an image of the data folder shown with the block */
  figure?: { file: string; alt: string; caption?: string | null } | null
}
export interface Headline {
  value: string
  label: string
  line?: string | null
  hypothesis?: string | null
}
export interface ResultsFile {
  verified?: boolean
  generated?: string
  verification_note?: string | null
  headlines?: Headline[]
  /** the row of checked facts on the landing page */
  facts?: CheckedFact[]
  hypotheses?: Hypothesis[]
}

export interface Source {
  name: string
  agency?: string | null
  product?: string | null
  doi?: string | null
  url?: string | null
  licence?: string | null
  date_range?: [string, string] | null
  role?: string | null
}

export interface Loaded<T> {
  data: T
  mock: boolean
  /** Base URL for paths that the file gives relative to data/ */
  base: string
}

// ---------- weekly list and lake passport (app/PASSPORT_CONTRACT.md) ----------
export interface WeekAfter {
  kind: 'emptied' | 'kept_water' | 'lost_water_late' | 'unknown' | string
  line: string
  checked?: string | null
}
export interface WeekListed {
  id: string
  reasons: { key: string; line: string }[]
  after?: WeekAfter | null
}
export interface WeekOneRadar {
  id: string
  sensor: string
  line: string
  after?: WeekAfter | null
}
export interface Week {
  start: string
  end: string
  listed: WeekListed[]
  one_radar: WeekOneRadar[]
}
export interface WeeksFile {
  mock?: boolean
  generated?: string
  counts?: {
    weeks?: number
    lake_weeks_listed?: number
    lakes_ever_listed?: number
    listed_that_emptied?: number
    listed_that_lost_water_late?: number
    listed_that_kept_water?: number
    listed_unknown_after?: number
    one_radar_steps?: number
    /** lakes listed by record_fill or due in at least one week: calls made before the outcome */
    called_lakes?: number
    called_that_emptied?: number
    called_that_lost_water_late?: number
    called_that_kept_water?: number
    called_unknown?: number
    /** lakes listed only because both radars saw the change that week: observations, not calls */
    observed_lakes?: number
  }
  weeks: Week[]
}
export interface PassportIndicatorDef {
  key: string
  title: string
  question?: string | null
  source?: string | null
  report?: string | null
  checked?: string | null
}
export interface PassportIndicator {
  state: string
  tone: 'attention' | 'neutral' | 'unknown' | string
  line: string | null
  facts: [string, string][]
  checked: string | null
  links?: string[]
}
export interface PassportLake {
  name: string | null
  name_source?: 'agency' | 'osm' | null
  /** an OpenStreetMap name more than 60 m from the outline, often a group or neighbour name */
  near_name?: string | null
  summary?: string | null
  indicators: Record<string, PassportIndicator>
  unknowns?: string[]
}
export interface PassportFile {
  mock?: boolean
  generated?: string
  /** attribution sentence for the names */
  names_note?: string | null
  indicators: PassportIndicatorDef[]
  lakes: Record<string, PassportLake>
}
/** Sheet of one H6 case, written next to its two images in data/dam/. */
export interface DamMeta {
  lake_id: string
  product?: string
  orbit?: string
  quantity?: string
  sign?: string
  phase_png?: { file: string; pair?: [string, string]; range_mm?: [number, number]; dam_zone_mm?: number | null; grey_where?: string }
  stack_png?: { file: string; pairs?: [string, string][]; range_mm?: [number, number]; unit?: string }
}
export interface CheckedFact {
  value: string
  label: string
  line?: string | null
  /** route of the page that carries the detail */
  link?: string | null
  link_text?: string | null
}
