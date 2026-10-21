# From a puzzle report to a playable workbench

PourLab asks a concrete question: can a level designer change a water-sort layout, test it by hand, and inspect a verified exact route without installing a tool or editing a source file?

The delivered product accepts user-created levels, not just a dropdown of fixtures. It connects editing, legal manual play, bounded exact solving, step-by-step replay, named local persistence and portable backups. The default puzzle is a synthetic starting point, not evidence of demand or player difficulty.

## Decisions that shape the product

**A playable instrument leads with the task.** The current redesign replaces the white/glass marketing hero with a deep violet play stage, vivid numbered bottles, Barlow Condensed display type and rounded physical controls. Create, Play and Review occupy a stable mode rail. The palette and exact-search tools share a lilac console below the central board. The two actual Cosmos references, their limits and source-to-decision map are recorded in [DESIGN-SOURCES.md](DESIGN-SOURCES.md). The new direction deliberately differs from the warm-paper editorial workflow in QuoteLens.

**Three modes share one rule contract.** Create edits the draft. Play starts a separate manual session with undo/reset. Review shows immutable frames of a verified path. Editing cannot leave a stale solution attached to the new level. Fill order is explicit: arrays and slots run bottom to top; erasing a slot removes it and everything above it so a bottle can never contain gaps. Shrinking capacity is refused if it would discard liquid.

**Exact search has an honest stop.** BFS explores by move count. A* prioritizes `g + h`, where `h = color segments − target full bottles`. A maximal pour reduces the number of segments by at most one; solved states have one segment per target bottle. The heuristic is therefore a lower bound (and consistent). Canonical sorting removes equivalent bottle permutations from the visited key. Actual states retain labeled bottle indices, and immutable node IDs retain the correct witness path. The reported number is a shortest legal path under these rules, not a human-difficulty score.

State, depth and elapsed-time limits are separate from mathematical impossibility. A run can return `solved`, `unsolvable`, `exhausted` or `invalid`. The UI additionally distinguishes user cancellation. A module worker keeps enumeration off the main thread, and terminating the worker makes cancellation immediate without requiring the search loop to service queued messages.

**Small architecture, real boundaries.** Buildless static files implement the app with native browser APIs. Solver and portability modules are pure enough for Node tests. There is no account service to operate, API credential to leak, backend quota or required model. In return, saves belong to one browser origin, large puzzles may exceed search limits, and sharing sends the actual level in a URL rather than producing a short cloud ID.

**Drafts can be useful before they are solvable.** Import and save accept structurally valid but unbalanced inventories. Play and search require balanced inventories. Library import validates the whole payload before storage mutation; unknown fields and unsupported versions are rejected. Imported names are literal text. All destructive library actions require confirmation, and JSON backup is always available independently of local storage.

**An error message is not data protection.** A later recovery audit found that an unreadable stored library could be replaced by the next save, despite an initial warning. The repair locks writes, preserves the original raw text for download and requires a separate confirmed reset. Failed draft saves stay visible instead of disappearing into a catch block. Nine regressions execute the production storage functions, and real-browser checks verify backup bytes, recovery controls, mobile rendering and normal save/reload/search. [Recorded scope and limits](evidence/STORAGE-RECOVERY-QA.md).

## Verification design

The production solvers do not certify themselves. A separate labeled-bottle BFS oracle implements its own transitions without canonicalization or the production heuristic. Both algorithms are checked against it on exhaustive small layouts and novel deterministic layouts. Every shown solution is replayed twice: once by the worker engine and once by the main thread. Tests also cover zero-move completion, trapped levels, color conservation, illegal pours, mutation boundaries, budget outcomes and malicious-name roundtrips.

These tests establish behavior on the checked corpus. They do not establish complete accessibility, human usability, design expertise, demand, commercial value, employment readiness or the author's ability to explain every line without assistance. Browser interaction, real storage behavior and visual acceptance are separate checks from pure-module tests.

Actual browser verification on 21 October 2026 exercised a novel three-color level through the real worker. A* visited 48 states and BFS visited 93; both found seven pours, and playback reached step 7/7. The browser also verified named save/reload, a clear illegal-pour error, Undo, and a one-state budget reported as unresolved rather than unsolvable. [Desktop evidence](evidence/desktop-solver.jpg) and [mobile evidence](evidence/mobile-solver.jpg) record the workbench. These are checks of the observed flows, not complete accessibility or human usability acceptance.

The earlier white/glass interface received a separate browser check on the same date. A new capacity-three level imported through the visible JSON dialog solved with real A* in seven pours after visiting 48 states; keyboard replay reached the sorted final arrangement at 7/7. A manual legal pour and Undo, erase-induced inventory error, disabled Play/search while unbalanced, repair via Undo, named saving and the library dialog all worked in those controls. The editor and case-study page had no horizontal document overflow at a 390px viewport. The eight existing rule/portability tests passed after those presentation changes. These historical checks are not acceptance of the later instrument redesign or evidence of player preference.

## Provenance and references

The rule contract, exact-search framing and warning against labeling classical search as RL build on the author's earlier independent Python **Puzzle Level Lab** learning prototype. Its README was consulted read-only; PourLab is a new JavaScript/browser implementation. No game studio source, assets or player data are included.

The current visual sources are [Michael Redfearn’s dark playful mobile interface](https://www.cosmos.so/e/513931804) and [Whipsaw’s Sound Workshop instrument](https://www.cosmos.so/e/624718523), inspected visually on Cosmos on 21 October 2026. They inform rounded color forms, tactile controls and functional grouping; no artwork or code was copied. Their inspected content was static, so no original timing or motion implementation is claimed. [GOV.UK’s error-summary guidance](https://design-system.service.gov.uk/components/error-summary/) remains a conceptual reference for actionable validation.

The active studio uses native browser APIs and no third-party JavaScript runtime. Barlow Condensed Bold and Manrope are self-hosted from the official Google Fonts repository, with their respective SIL Open Font License notices retained in `dist/assets/BarlowCondensed-OFL.txt` and `dist/assets/OFL.txt`. Bottles and the drop mark are original CSS/SVG. A short interruptible trace explains actual legal moves; mode changes and selected bottles receive direct feedback, with a visible off control and reduced-motion behavior. The former generated glass image, optional Three.js engine and [motion evidence](MOTION-ACCEPTANCE.md) are retained as historical source, not loaded by the current app. Three.js keeps its MIT notice even though it is no longer an active dependency. [Asset provenance](../dist/assets/SOURCES.md) records licensing.

## Next useful tests

Ask an unfamiliar person to build a two-color level, intentionally unbalance its inventory, fix it, save it and share it without instructions. Observe where they stop. Then evaluate larger layouts against the same exact baseline before considering alternate search or heuristics. If human-difficulty prediction is a goal, collect consented real play traces and define a held-out evaluation; synthetic shortest-path length alone is insufficient.


## Current redesign verification

The later Cosmos redesign was exercised in actual desktop and 390px browsers, including the complete product workflow, recovery/error states and local save/reload. See [current browser findings and limitations](evidence/COSMOS-REDESIGN-QA.md), [desktop](evidence/cosmos-desktop.jpg) and [mobile](evidence/cosmos-mobile.jpg). These current captures supersede earlier visual examples, while the historical engine evidence remains retained.
