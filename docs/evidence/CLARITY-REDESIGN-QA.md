# Play-first clarity revision — 21 October 2026

Scope: make the product's purpose, puzzle goal and first action visible without requiring the case study. This is a UI/product-entry revision; exact solver, portable data and storage protection contracts remain.

## Implemented

- Literal water-sort maker/solver heading and a visual single-color goal.
- Fresh sessions begin with a small playable three-color/five-bottle puzzle rather than an editor full of paint controls. Restored/shared inputs remain intact; structurally incomplete inventory opens Edit.
- Direct Make your own and Import a puzzle entry points. Play, Edit and Solution stay in a fixed mode rail. Find a solution sits beside the board on desktop; search algorithms and limits are disclosed under Search settings.
- Warm sand/forest game workshop, locally hosted rounded Rubik, original goal/rule diagrams. Purple instrument styling and condensed type are inactive. Current references/terms: [design sources](../DESIGN-SOURCES.md).
- Active canonical and social URLs point to the repository's GitHub Pages path. This does not move origin-bound browser saves; the old host remains separately usable as described in the migration note.

## Actual checks

- Existing Node regression suite: **17/17 pass**, 21 October 2026. One test was coupled to the old starter title; it now sets an explicit `Quota recovery fixture` name and still checks that failed draft writes recover correctly. No storage assertion was weakened.
- Browser at localhost:4392, desktop viewport 1265 × 720: imported a new named JSON level with capacity 2 and `[[0,1],[1,2],[2,0],[],[]]` through the new Import a puzzle action. The actual Web Worker returned **4 shortest checked pours, 17 states**. Slider 4/4 displayed three full monochrome bottles and two empties.
- That current replay was saved to `clarity-replay-2026-10-21.png` and the public case image `dist/assets/checked-replay.png`. It is an actual render of synthetic puzzle input, not user-demand or business evidence.
- After solving, Edit → Eraser → remove the top Coral from bottle 3: inventory became 1/2 for color 1, Play and Find a solution disabled, and the old Solution tab disabled. Undo restored a balanced editable input while leaving the old solution invalidated.
- Motion on → off changed the visible control and `data-interactive-motion` to off. No horizontal page overflow was observed in that desktop state. CSS and motion module retain OS reduced-motion suppression; this check alone is not a full accessibility audit.
- Root-agent independent interaction review also reported the default starter solved with the actual worker in **7 pours / 48 states**, and mobile first-screen goal/board plus legal bottle 1→4 / Undo functioning. Root owns final desktop/mobile screenshots and published-host checks.

## Evidence and limits

Root-agent captures: `clarity-desktop.png`, `clarity-mobile.png`. Current case replay: `clarity-replay-2026-10-21.png`. Final release notes must distinguish local verification from deployment verification. No player study, paid use, professional design endorsement or guaranteed recruiter reaction is claimed.
