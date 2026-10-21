# From a puzzle report to a playable workbench

PourLab asks a concrete question: can a level designer change a water-sort layout, test it by hand, and inspect a verified exact route without installing a tool or editing a source file?

The delivered product accepts user-created levels, not just a dropdown of fixtures. It connects editing, legal manual play, bounded exact solving, step-by-step replay, named local persistence and portable backups. The default puzzle is a synthetic starting point, not evidence of demand or player difficulty.

[Use the studio](https://builtbyhuy.github.io/pourlab-puzzle-studio/) · [Public guide and case study](https://builtbyhuy.github.io/pourlab-puzzle-studio/about.html)

## Decisions that shape the product

**Let the game occupy the stage.** The user selected OBSIDIAN after trying separate visual prototypes. A compact headline names a water-sort maker/solver, then the real board dominates a dark stage. Original live Three.js tube geometry represents the current production level in Play and Solution. A lime action dock and condensed Barlow type contrast with QuoteLens's warm paper desk and Instrument Sans. Editing uses precise numbered 2D slots; 2D is also available during Play and as a fallback. [Inspected Board and Form + Fidget references](DESIGN-SOURCES.md) inform composition and action-linked movement, with no copied artwork or code.

**Three modes share one rule contract.** Edit changes the draft. Play starts a separate manual session with undo/reset. Solution shows immutable frames of a verified path. Editing cannot leave a stale solution attached to the new level. Fill order is explicit: arrays and slots run bottom to top; erasing a slot removes it and everything above it so a bottle can never contain gaps. Shrinking capacity is refused if it would discard liquid.

**Exact search has an honest stop.** BFS explores by move count. A* prioritizes `g + h`, where `h = color segments − target full bottles`. A maximal pour reduces the number of segments by at most one; solved states have one segment per target bottle. The heuristic is therefore a lower bound (and consistent). Canonical sorting removes equivalent bottle permutations from the visited key. Actual states retain labeled bottle indices, and immutable node IDs retain the correct witness path. The reported number is a shortest legal path under these rules, not a human-difficulty score.

State, depth and elapsed-time limits are separate from mathematical impossibility. A run can return `solved`, `unsolvable`, `exhausted` or `invalid`. The UI additionally distinguishes user cancellation. A module worker keeps enumeration off the main thread, and terminating the worker makes cancellation immediate without requiring the search loop to service queued messages.

**Small architecture, real boundaries.** Buildless static files implement the app with native browser APIs. Solver and portability modules are pure enough for Node tests. There is no account service to operate, API credential to leak, backend quota or required model. In return, saves belong to one browser origin, large puzzles may exceed search limits, and sharing sends the actual level in a URL rather than producing a short cloud ID.

**Drafts can be useful before they are solvable.** Import and save accept structurally valid but unbalanced inventories. Play and search require balanced inventories. Library import validates the whole payload before storage mutation; unknown fields and unsupported versions are rejected. Imported names are literal text. All destructive library actions require confirmation, and JSON backup is always available independently of local storage.

**An error message is not data protection.** A later recovery audit found that an unreadable stored library could be replaced by the next save, despite an initial warning. The repair locks writes, preserves the original raw text for download and requires a separate confirmed reset. Failed draft saves stay visible instead of disappearing into a catch block. Nine regressions execute the production storage functions, and real-browser checks verify backup bytes, recovery controls, mobile rendering and normal save/reload/search. [Recorded scope and limits](evidence/STORAGE-RECOVERY-QA.md).

## Verification design

The production solvers do not certify themselves. A separate labeled-bottle BFS oracle implements its own transitions without canonicalization or the production heuristic. Both algorithms are checked against it on exhaustive small layouts and novel deterministic layouts. Every shown solution is replayed twice: once by the worker engine and once by the main thread. Tests also cover zero-move completion, trapped levels, color conservation, illegal pours, mutation boundaries, budget outcomes and malicious-name roundtrips.

These tests establish behavior on the checked corpus. They do not establish complete accessibility, human usability, design expertise, demand, commercial value, employment readiness or the author's ability to explain every line without assistance. Browser interaction, real storage behavior and visual acceptance are separate checks from pure-module tests.

Earlier browser verification on 21 October 2026 exercised a novel three-color level through the real worker. A* visited 48 states and BFS visited 93; both found seven pours, and playback reached step 7/7. The browser also verified named save/reload, a clear illegal-pour error, Undo, and a one-state budget reported as unresolved rather than unsolvable. [Desktop evidence](evidence/desktop-solver.jpg) and [mobile evidence](evidence/mobile-solver.jpg) record that earlier interface. These are checks of the observed flows, not complete accessibility or human usability acceptance.

The earlier white/glass interface received a separate browser check on the same date. A new capacity-three level imported through the visible JSON dialog solved with real A* in seven pours after visiting 48 states; keyboard replay reached the sorted final arrangement at 7/7. A manual legal pour and Undo, erase-induced inventory error, disabled Play/search while unbalanced, repair via Undo, named saving and the library dialog all worked in those controls. The editor and case-study page had no horizontal document overflow at a 390px viewport. The eight existing rule/portability tests passed after those presentation changes. These historical checks are not acceptance of the later instrument redesign or evidence of player preference.

## Provenance and references

The rule contract, exact-search framing and warning against labeling classical search as RL build on the author's earlier independent Python **Puzzle Level Lab** learning prototype. Its README was consulted read-only; PourLab is a new JavaScript/browser implementation. No game studio source, assets or player data are included.

The selected direction uses [Board by Luciana Botines](https://www.behance.net/gallery/223777003/Board-Brand-Identity-Web-Design) for a physical game stage, strong typography and restrained action color, alongside [Form + Fidget by Noodle Studio](https://www.behance.net/gallery/222516693/Form-Fidget) for input-responsive graphic play. Full presentations and the latter's live interaction were inspected on 21 October 2026. No gallery artwork, code or brand assets are included. Quick, Draw! and Lichess remain earlier interaction research. [GOV.UK’s error-summary guidance](https://design-system.service.gov.uk/components/error-summary/) remains a conceptual reference for actionable validation.

The earlier violet/lilac design drew on [Michael Redfearn’s dark playful mobile interface](https://www.cosmos.so/e/513931804) and [Whipsaw’s Sound Workshop instrument](https://www.cosmos.so/e/624718523), inspected visually on Cosmos on the same date. Those static sources informed rounded forms, tactile controls and grouping; no source timing, artwork or code was copied. They remain recorded as superseded visual research.

The active studio uses native browser APIs with locally vendored Three.js 0.180.0 (MIT) for presentation. Barlow Condensed and Manrope are self-hosted under their bundled SIL Open Font License notices. Tube geometry is original. An adjacent legal pour or replay step animates the corresponding source and destination; state updates immediately and Undo, edits and slider jumps do not invent pouring transitions. Manual Motion off and system reduced motion show the same final content without that transition. The vector board remains usable if 3D cannot initialize; an explicit bounded retry can recover a temporary module failure. This is stylized geometry animation, not fluid simulation. Rubik, the generated glass hero and the older shared renderer are historical resources. [Asset provenance](../dist/assets/SOURCES.md) records current and historical resources separately.

## Next useful tests

Ask an unfamiliar person to build a two-color level, intentionally unbalance its inventory, fix it, save it and share it without instructions. Observe where they stop. Then evaluate larger layouts against the same exact baseline before considering alternate search or heuristics. If human-difficulty prediction is a goal, collect consented real play traces and define a held-out evaluation; synthetic shortest-path length alone is insufficient.


## Earlier play-first verification

The play-first revision on 21 October 2026 retained the solver, portable data and storage protection contracts. The existing **17 checks** passed: eight rule/portability checks and nine regressions executing production storage functions. [Historical play-first browser findings](evidence/CLARITY-REDESIGN-QA.md) record an imported capacity-two level, `[[0,1],[1,2],[2,0],[],[]]`, solved by the actual worker in **four shortest checked pours after 17 states**, with replay reaching 4/4. An unbalanced edit disabled Play/search and the old solution; Undo repaired the input without reviving that stale solution. The visible Motion control also worked.

[Earlier desktop](evidence/clarity-desktop.png) and [mobile](evidence/clarity-mobile.png) captures show the goal and playable opening. The default warm-up was separately exercised on the public GitHub Pages address: the real module worker returned seven pours after 48 states and replay reached 7/7. These checked paths do not establish user preference, a complete accessibility audit or behavior on every device.

The separate [frozen solver evaluation](SOLVER-EVALUATION.md) compares A* and BFS across 40 configurations and 34 distinct layouts. Its independent optimality coverage, replay checks and timing limits are explicit. Earlier [Cosmos browser findings](evidence/COSMOS-REDESIGN-QA.md), [desktop](evidence/cosmos-desktop.jpg) and [mobile](evidence/cosmos-mobile.jpg) retain their original workflow evidence and superseded appearance; they are not current screenshots.

## Selected OBSIDIAN integration, 21 October 2026

The full production model remains 2–12 bottles, capacity 2–6 and eight numbered colors. The selected design adds live 3D presentation to Play and Solution while keeping the production rules, worker, storage and portable-level contract. The real imported capacity-three paired-run level solved in four checked pours after 17 A* states, even after a manual move. Illegal moves, Undo, replay, invalid inventory, stale-solution invalidation, one-state unresolved search, save/reload/export and sharing were checked through the browser. Dense 12-bottle, capacity-six boundaries and 2D fallback were independently inspected. Two discovered integration bugs—stale 3D positions in Edit and cached failed-module retry—were repaired and retested.

The suite has 20 checks: eight rules/portability, nine storage and three presentation regressions. The fixed 40-configuration solver corpus remains separate from visual acceptance and customer evidence. [Current QA and limits](evidence/SELECTED-DESIGN-QA.md) · [Desktop](evidence/selected-desktop.png) · [Phone](evidence/selected-mobile.png) · [Checked replay](evidence/selected-replay.png).
