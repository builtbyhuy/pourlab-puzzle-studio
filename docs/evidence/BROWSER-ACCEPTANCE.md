# PourLab browser acceptance — 21 October 2026

Synthetic QA performed by the root agent through CUA against the local browser build. The independent reviewer inspected the retained mobile screenshot. These are product checks, not player adoption, demand, commercial value or human-difficulty validation. Anonymous public deployment is not yet verified here.

## Observed task

- Entered a new JSON puzzle in the UI: capacity 3, bottles `[[0,1,2],[1,2,0],[2,0,1],[],[]]` (bottom to top).
- Ran the actual Web Worker: A* found **7 pours / 48 visited states**; BFS found **7 pours / 93 visited states**. The path length matches an independently implemented BFS oracle.
- Replayed to step **7 / 7**, reaching uniform full bottles plus empty bottles.
- Tried an invalid manual pour and saw a meaningful error; made a legal pour and used **Undo** to restore the preceding board.
- Set a one-state search budget and saw an unresolved/unknown result, rather than a false unsolvable claim.
- Saved a custom level name and design, then reloaded; both persisted.
- Checked a 390-pixel mobile viewport: document `scrollWidth = 390`, viewport `innerWidth = 390`. Viewport was reset afterward.

## Retained evidence

- [Desktop solver view](desktop-solver.jpg)
- [Mobile solver view](mobile-solver.jpg)

The search operates on the original level design, as labeled in the UI, rather than a partially played session. It is classical BFS/A* search, not ML or reinforcement learning. A stopped or budget-limited run leaves solvability open.

Core/source checks are separate: 8 tests passed, including exhaustive small layouts and 16 seeded new layouts against a separate labeled-state BFS oracle. Independent fixtures also checked legal replay, mutation boundaries, portable JSON/share roundtrips and hostile-input rejection.

Public URL loading and worker availability, opening a copied share URL, actual edit/search cancellation and hostile-name DOM execution checks remain unrecorded in this note. The measured mobile viewport is not complete accessibility or device coverage.
