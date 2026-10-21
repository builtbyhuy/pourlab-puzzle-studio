# From a puzzle report to a playable workbench

PourLab asks a concrete question: can a level designer change a water-sort layout, test it by hand, and inspect a verified exact route without installing a tool or editing a source file?

The delivered product accepts user-created levels, not just a dropdown of fixtures. It connects editing, legal manual play, bounded exact solving, step-by-step replay, named local persistence and portable backups. The default puzzle is a synthetic starting point, not evidence of demand or player difficulty.

## Decisions that shape the product

**The work is the main visual.** Glass bottles sit on a lavender drafting surface; coral, sea-glass, blue and honey liquids give the tool its identity. Compact controls surround one shared board. This avoids making a creative tool feel like a metrics dashboard. The core tokens are paper `#f8f7fc`, lavender `#eeeaf8`, plum `#2d2143`, purple `#6848b4`, coral `#e96d62` and sea glass `#64b7a6`. Trebuchet/Segoe system fonts keep it independent of remote font services.

**Three modes share one rule contract.** Create edits the draft. Play starts a separate manual session with undo/reset. Review shows immutable frames of a verified path. Editing cannot leave a stale solution attached to the new level. Fill order is explicit: arrays and slots run bottom to top; erasing a slot removes it and everything above it so a bottle can never contain gaps. Shrinking capacity is refused if it would discard liquid.

**Exact search has an honest stop.** BFS explores by move count. A* prioritizes `g + h`, where `h = color segments − target full bottles`. A maximal pour reduces the number of segments by at most one; solved states have one segment per target bottle. The heuristic is therefore a lower bound (and consistent). Canonical sorting removes equivalent bottle permutations from the visited key. Actual states retain labeled bottle indices, and immutable node IDs retain the correct witness path. The reported number is a shortest legal path under these rules, not a human-difficulty score.

State, depth and elapsed-time limits are separate from mathematical impossibility. A run can return `solved`, `unsolvable`, `exhausted` or `invalid`. The UI additionally distinguishes user cancellation. A module worker keeps enumeration off the main thread, and terminating the worker makes cancellation immediate without requiring the search loop to service queued messages.

**Small architecture, real boundaries.** Six buildless static files implement the app with native browser APIs. Solver and portability modules are pure enough for Node tests. There is no account service to operate, API credential to leak, backend quota or required model. In return, saves belong to one browser origin, large puzzles may exceed search limits, and sharing sends the actual level in a URL rather than producing a short cloud ID.

**Drafts can be useful before they are solvable.** Import and save accept structurally valid but unbalanced inventories. Play and search require balanced inventories. Library import validates the whole payload before storage mutation; unknown fields and unsupported versions are rejected. Imported names are literal text. All destructive library actions require confirmation, and JSON backup is always available independently of local storage.

## Verification design

The production solvers do not certify themselves. A separate labeled-bottle BFS oracle implements its own transitions without canonicalization or the production heuristic. Both algorithms are checked against it on exhaustive small layouts and novel deterministic layouts. Every shown solution is replayed twice: once by the worker engine and once by the main thread. Tests also cover zero-move completion, trapped levels, color conservation, illegal pours, mutation boundaries, budget outcomes and malicious-name roundtrips.

These tests establish behavior on the checked corpus. They do not establish complete accessibility, human usability, design expertise, demand, commercial value, employment readiness or the author's ability to explain every line without assistance. Browser interaction, real storage behavior and visual acceptance are separate checks from pure-module tests.

Actual browser verification on 21 October 2026 exercised a novel three-color level through the real worker. A* visited 48 states and BFS visited 93; both found seven pours, and playback reached step 7/7. The browser also verified named save/reload, a clear illegal-pour error, Undo, and a one-state budget reported as unresolved rather than unsolvable. [Desktop evidence](evidence/desktop-solver.jpg) and [mobile evidence](evidence/mobile-solver.jpg) record the workbench. These are checks of the observed flows, not complete accessibility or human usability acceptance.

## Provenance and references

The rule contract, exact-search framing and warning against labeling classical search as RL build on the author's earlier independent Python **Puzzle Level Lab** learning prototype. Its README was consulted read-only; PourLab is a new JavaScript/browser implementation. No game studio source, assets or player data are included.

The local Web-reference collection was consulted before selecting the approach. [Utopia](https://utopia.fyi/) informed responsive spacing/type thinking and [GOV.UK's error-summary guidance](https://design-system.service.gov.uk/components/error-summary/) informed clear actionable errors (checked 21 October 2026). These are conceptual references, not copied component code. The liquid art, CSS and drop mark are original code; no paid template, remote image, external icon package or font asset is embedded. The project is MIT licensed.

## Next useful tests

Ask an unfamiliar person to build a two-color level, intentionally unbalance its inventory, fix it, save it and share it without instructions. Observe where they stop. Then evaluate larger layouts against the same exact baseline before considering alternate search or heuristics. If human-difficulty prediction is a goal, collect consented real play traces and define a held-out evaluation; synthetic shortest-path length alone is insufficient.

