# Cosmos puzzle-instrument redesign — browser checks

21 October 2026. Internal Codex checks of the current redesign; not a player study, human usability acceptance or a complete accessibility certification. Solver, worker, portable format, storage keys and app state handlers are unchanged.

## Render and interaction

- Desktop and 390 px-wide studio, import/help dialogs and project guide inspected. The current dark-plum/condensed/rounded-color instrument is visually distinct from QuoteLens in the actual working screen. Root observed document scroll width=client width=390 px. Bottles wrap within the stage; controls stay accessible.
- Motion toggle works and changes visible label, aria-pressed and the DOM preference. A live reduced-motion preference change turned motion off and disabled the toggle. Device/media overrides were reset after checking.
- Mode and legal-pour feedback are brief and interruptible; no decorative glass hero or Three.js runtime is loaded. Versioned script URLs prevent retaining the old module from a prior visit.

## Synthetic end-to-end level

Imported the user-created capacity 2 level [[0,1],[1,2],[2,0],[],[]] through visible JSON controls. An invalid color 8 first produced an actionable inline error. An illegal pour left the move count at 0 and explained the legal target. A legal pour reached 1; Undo restored 0.

The actual worker returned a shortest checked solution: 4 pours, 17 A* states in the observed run. Keyboard End reached replay 4/4 with full monochrome bottles. Editing with the eraser made one color count 1 instead of 2, disabled Play and Analyze and invalidated Review. Undo restored balance. Named save survived reload with Saved on this browser and library count 1.

A separate Codex agent independently exercised a capacity 3 level, a real 7-pour/48-state A* solution, replay 7/7, illegal play/Undo and 390 px error/help states. These are separate synthetic observations, not performance or difficulty benchmarks.

## Evidence and checks

- [Current first-visit desktop](cosmos-desktop.jpg), [mobile](cosmos-mobile.jpg), [completed custom replay](cosmos-solved-desktop.png). Captures show running local previews of the released source with fictional inputs.
- Existing 8 solver/portable tests passed after the redesign. Syntax and whitespace checks passed.
- Earlier redesign-* and motion files are historical captures of the superseded glass presentation. Retained third-party material keeps its separate license notices.
