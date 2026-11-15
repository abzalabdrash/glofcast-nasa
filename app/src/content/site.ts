// SI-assisted (Claude), NASA Space Apps 2026
// Names and links that the team may still change. One place.
export const SITE = {
  /** Name decided by the user on 15 Nov 2026; the wordmark is written in lower case as on glofcast.org. */
  name: 'GLOFcast',
  wordmark: 'glofcast',
  /** The earlier site of the team; its look, map shell and name are carried over and named as earlier work. */
  earlierSite: 'https://glofcast.org',
  challenge: 'NASA Space Apps Challenge 2026, "Dancing with the SARs"',
  team: 'Team from Almaty',
  /** Public repository URL; empty until the main session fills it. */
  repo: 'https://github.com/abzalabdrash/glofcast-nasa',
  licence: 'Apache-2.0',
}

/** Places drawn for orientation on the study-area plot. Coordinates are general knowledge, not project data. */
export const PLACES = [
  { name: 'Almaty', lat: 43.238, lon: 76.946, kind: 'city' },
  { name: 'Bishkek', lat: 42.875, lon: 74.59, kind: 'city' },
  { name: 'Taldykorgan', lat: 45.017, lon: 78.38, kind: 'city' },
  { name: 'Karakol', lat: 42.49, lon: 78.39, kind: 'city' },
  { name: 'Lake Issyk-Kul', lat: 42.2, lon: 77.25, kind: 'water' },
] as const
