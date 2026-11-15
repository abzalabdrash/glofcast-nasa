// SI-assisted (Claude), NASA Space Apps 2026
// Mission constants used by the explainer. They are not project measurements.
// NISAR L-band SAR: centre frequency about 1.257 GHz, wavelength about 24 cm (NASA/ISRO mission description).
// Sentinel-1 C-band SAR: centre frequency 5.405 GHz, wavelength about 5.5 cm (ESA mission description).
export const BANDS = [
  { band: 'L-band', mission: 'NISAR', lambdaCm: 23.8, color: '#1c6787' },
  { band: 'C-band', mission: 'Sentinel-1', lambdaCm: 5.5, color: '#8a6540' },
] as const

/** Incidence angle used in the rule of thumb, in degrees (mid-swath for both missions). */
export const INCIDENCE_DEG = 40

/** Rayleigh criterion: relief below lambda / (8 cos theta) leaves the surface mirror-like. */
export function smoothLimitCm(lambdaCm: number): number {
  return lambdaCm / (8 * Math.cos((INCIDENCE_DEG * Math.PI) / 180))
}
