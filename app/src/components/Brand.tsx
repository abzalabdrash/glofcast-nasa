// SI-assisted (Claude), NASA Space Apps 2026
// The mark in use and the wordmark. The six directions that were explored are on the page #/brand
// (pages/BrandPage.tsx); this file holds the one that is in use, so that changing the choice is one edit here.
import { MARKS, type MarkKey } from './marks'

/** The direction in use. The Team Owner chooses from the sheet at #/brand. */
export const MARK_IN_USE: MarkKey = 'basin'

export function Mark({ size = 22, kind = MARK_IN_USE, className }: { size?: number; kind?: MarkKey; className?: string }) {
  const M = MARKS[kind].draw
  return <M size={size} className={className} />
}

/** Mark and lower-case wordmark, as in the navigation. */
export function Brand({ size = 22, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <span className="brandmark">
      <Mark size={size} />
      {wordmark ? <span className="brandmark__word">glofcast</span> : null}
    </span>
  )
}
