# PourLab — a game workshop

## Selected OBSIDIAN direction, 21 October 2026

The user tried two working, isolated directions and selected OBSIDIAN. This section supersedes the play-first and Cosmos directions recorded below. The integrated product retains the production model and persistence contracts; the small prototype's bottle/capacity restrictions and current-board search semantics were not carried over.

- A compact horizontal **MAKE YOUR NEXT MOVE.** heading sits above the wide, directly playable stage. The visible eyebrow names a **water-sort puzzle maker & solver**; the purpose text, numbered colors and contextual rule explain the task. Play, Edit and Solution have a persistent rail. Undo, Start over, Find a solution and Motion share the bottom action dock. Algorithm and budget details remain below the primary interaction.
- Near-black `#10120e`, warm light `#f0f1e8` and lime `#d8f36b` frame the colored puzzle. Lime signals selected modes, focus and the main action. Locally hosted **Barlow Condensed Bold** supplies display typography; **Manrope** supplies controls and explanations. Both retain their SIL OFL notices. The typography, live physical stage, compact hierarchy and action dock distinguish this game workshop from a document-review tool.
- `stage3d.js` uses local Three.js 0.180.0 to construct original hollow tubes, rims, bases, individual colored units and numeric labels. This is actual geometry tied to the current puzzle, not an animated screenshot or decorative sculpture. It is stylized, not a fluid-physics simulation. The renderer draws on updates, resize and bounded transitions rather than running an idle decorative animation.
- `app.js` remains the authority for rules, level history, search, persistence and recovery. The presenter consumes copies of that state. A 3D transition is allowed only when the production rules verify one adjacent forward pour. Undo, design replacement, edits, stale revisions and nonadjacent replay jumps settle immediately. Search still analyzes the **original design**, even after manual play; every displayed worker solution is replay-checked.
- Native buttons are projected onto the 3D tubes; visible numbers and full accessible labels supplement color. The controller restores focus after rendering. Keyboard interaction skips transitions, and the manual Motion control can turn them off. A system reduced-motion request starts motion off and disables the toggle while that request is active. Scroll, resize, visibility changes and new state interrupt/finish transitions.
- **Edit deliberately uses the complete numbered 2D board** for precise slot painting. Play and Solution offer an explicit 2D view. If the 3D module or WebGL initialization fails, the complete 2D model remains usable. Explicit Retry 3D loads a fresh module URL to avoid the browser's failed-module cache; retries are bounded, with no idle retry loop. Level data is never held in the renderer.
- All 2–12 bottles, capacities 2–6 and eight colors remain supported. Dense desktop boards use multiple rows; a narrow 12-bottle board uses four rows rather than compressing the controls into tiny targets. Native dialogs, import/export, named levels, drafts, backup-before-reset, stale-tab and failed-storage notices remain part of the full product. No storage key or portable format changes were needed.

The active app presentation is `obsidian.css` plus the base `style.css`/`motion.css` and the state-copy presenter. `scene-layout.js` supplies pure layout; `stage3d.js` owns rendering. Source and license decisions are recorded in [DESIGN-SOURCES.md](DESIGN-SOURCES.md) and [asset provenance](../dist/assets/SOURCES.md). The [actual integration checks](evidence/SELECTED-DESIGN-QA.md) record desktop/mobile, new-input solving, dense boards, fallback/retry and reduced-motion scope. They are not player research, physical-device benchmarking or complete accessibility acceptance.

## Superseded play-first direction, earlier on 21 October 2026

The user rejected the previous vague promise, dense editor opening, purple styling and type. This revision superseded the instrument direction below and was later replaced by the selected OBSIDIAN direction above.

- The first screen says **Build & solve water-sort puzzles** and shows a miniature single-color goal. The actual five-bottle, three-color board starts in Play for a fresh session. Make your own and Import a puzzle lead directly to real input paths. Find a solution is beside the board on desktop, before advanced search settings.
- Warm sand `#f5f1e8` surrounds a forest `#184b3e` game board. Coral, blue and saffron identify the small starter puzzle. A lime active mode and legal-target outline are functional signals. Original bottle outlines and the goal/rule diagrams explain the task without opening a case study.
- Uncondensed Rubik was locally hosted under SIL OFL 1.1: 400–500 for controls, 600–750 for headings, 850 for the compact wordmark. It replaced Barlow Condensed/Manrope during this revision. Main instructions and solver helpers had priority over small secondary captions.
- Play, Edit and Solution stay in a fixed rail. Exact algorithms and budgets live under Search settings. Edit exposes palette and balanced inventory; manual play exposes Undo and target hints. The shortest-route claim and unresolved limits still use the existing real worker and legal replay.
- This revision loaded `playground.css`; older `instrument.css` was historical. Selection and legal-pour motion were state-linked, interruptible and switchable, with OS reduced-motion respected. No active 3D runtime or continuous decorative animation was introduced in that revision. `playground.css` is now also inactive.
- On a narrow screen the goal becomes a compact inline diagram, five starter bottles fit in one row, and the solver follows the real board. Recovery notices and portable level controls remain usable. Browser verification is recorded separately; these choices do not prove user acceptance.

## Superseded Cosmos instrument direction

Historical direction, earlier on 21 October 2026. It superseded Lifemed and was later replaced by the play-first revision and then OBSIDIAN.

### Historical composition and tokens

- The real board is the opening experience. A short condensed heading replaces the decorative marketing hero. The board occupies a deep violet stage; paint and exact-search tools share a lilac console underneath. Create, Play and Review stay in one pill rail.
- Base aubergine #24133d, stage violet #301b4f, console lilac #d1b5f7, warm light #fff6eb and lemon #f8ed83. Eight brighter but numbered liquid colors are used consistently in the palette, board and inventory. Color is supplemented by text, numbers and legal-target outlines.
- Locally hosted Barlow Condensed Bold carries the wordmark and display hierarchy; Manrope carries controls and explanations. Both official Google Fonts distributions retain their respective SIL OFL files. No remote font service is called.
- Rounded physical controls have short depth shadows, larger radii and action-state colors. This is deliberately unlike the sharp-cornered, warm-paper Swiss/editorial QuoteLens workstation. The contrast is in type, hierarchy, layout, controls and motion as well as color.
- A* / BFS, validation, persistence, replay and all DOM IDs retain their rule contracts. No state mutation waits for an animation. The prior shared dual-product Three.js renderer is not loaded.

### Historical interaction and responsiveness

A source bottle lifts slightly and legal targets are dashed. A brief arc explains a single actual legal transfer or adjacent replay step. Mode changes settle the bottles into the new context; this is presentation feedback, not fluid simulation. Animations are interruptible and skipped during keyboard use. The visible Motion control disables feedback; OS reduced-motion starts with feedback off. Selection and results remain understandable without motion. No decorative scene runs continuously.

At narrow widths, the board wraps and tool groups stack. Native dialogs, labels, color numbers, focus and meaningful invalid/unresolved states remain. Browser acceptance is recorded separately; source inspection and unit tests do not establish complete accessibility or user preference.

### Historical sources and verification

The [superseded Cosmos source notes](DESIGN-SOURCES.md#superseded-cosmos-instrument-direction) record the inspected elements and font licenses for that revision. Its [browser checks](evidence/COSMOS-REDESIGN-QA.md) and the later [clarity revision evidence](evidence/CLARITY-REDESIGN-QA.md) retain their historical scope. For the selected integrated interface, use the OBSIDIAN section above and [selected-design evidence](evidence/SELECTED-DESIGN-QA.md).
