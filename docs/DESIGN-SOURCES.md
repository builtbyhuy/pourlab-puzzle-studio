# PourLab design sources

Recorded 21 October 2026. Preserve the approved white / black / glass design. Color identifies liquid and state; app chrome remains quiet. Designer pages were opened and their real content inspected in a browser before selection.

## Selected references and translation

### Water Sort — play states and tube readability

[Water Sort: Game UI design, Gautam Baluni](https://www.behance.net/gallery/193054545/Water-Sort-Game-UI-design), published March 2024, shows level choice, play, pause, completion and support controls. Transparent tube outlines and distinct liquid bands keep the puzzle readable; the board occupies the center and support actions sit below.

PourLab uses that task hierarchy and explicit play states, while retaining its own editor, legal-target hints, Undo, bounded A*/BFS search and step-by-step state trace. Every trace step must describe a real legal pour and agree with the displayed bottles and current step. This application-specific trace is original; the reference supplies no solver, editor or search algorithm.

The reference's purple background, yellow dimensional type, coins, store and reward presentation are excluded. [Water Sort Puzzle Game, Thu Linh Nguyen](https://www.behance.net/gallery/241712993/Water-Sort-Puzzle-Game), published January 2026, was also inspected for glass silhouettes and liquid separation, but its promotional game-art theme is not adopted.

### Lifemed — approved glass composition

[Lifemed Web & Motion, Mubien](https://www.behance.net/gallery/252323471/Lifemed-Web-Motion), published July 2026, informs whitespace, normal-weight black type, compact actions and layered glass. PourLab translates this into an **original volumetric liquid loop and separate droplet**, rendered as real geometry with changing reflections. The sculpture is an art-directed glass form, not a fluid simulation or a solver result. The game board's bottles and liquid states remain functional project artwork.

[GEO, Dennis Sucgang](https://www.behance.net/gallery/46931763/UI-and-UX-Design-for-a-3D-Puzzle-game), published January 2017, is a secondary reference for one readable central 3D object and quiet surrounding controls. It is an old concept case, not evidence of a released modern product. Its cyan/orange theme, models and mobile HUD are excluded. Ramotion's [Puzzle Website Design](https://www.behance.net/gallery/215527231/Puzzle-Website-Design) was checked and rejected as gameplay evidence: its subject is AI accounting/tax software, not a puzzle game.

## Observed motion versus PourLab timing

Lifemed's embedded video was observed advancing automatically between visual compositions. Exact source timing, easing and live-site triggers were not measured. The Water Sort and GEO sections inspected were static images: they establish layouts/states, not a demonstrated pouring animation or physics implementation.

PourLab chooses its own motion: select a source clearly, expose legal targets, then show the actual changed state and matching trace step. Suggested tuning ranges are 140–200 ms for selection, 200–350 ms for a step/Undo transition, and 550–800 ms only if a full lift/tilt/stream/lower pour is implemented. These are design ranges, not a statement that such a full pouring animation already exists. Search progress follows actual work and results; no artificial delay is added. Reduced-motion presentation keeps states and trace readable without long tilt/translation. The hero's pause, opt-in reduced-motion behavior and offscreen suspension are documented in [MOTION-ENGINE.md](MOTION-ENGINE.md).

## Source and license boundaries

- Original project code, runtime geometry, bottle artwork and state-trace presentation use the repository's [MIT license](../LICENSE). No gallery assets are included in that grant.
- Three.js **0.180.0 / r180** is vendored locally with its own [MIT license](../dist/vendor/three/LICENSE), which must remain with redistributed copies. Rendering-library rights are separate from gallery-art rights.
- Manrope keeps its SIL Open Font License. The separate original generated PNG fallback and font provenance are in [asset SOURCES.md](../dist/assets/SOURCES.md). The PNG is not used as the live sculpture's geometry.
- Both Water Sort pages displayed **All Rights Reserved**; Lifemed and GEO displayed **Attribution / Non-commercial / No Derivatives** badges. No commercial source/asset grant was verified. Gautam's displayed “Game UI Design — From US$150” is a custom-service price, not a price for downloading this case or its source.

No gallery models, images, videos, code or branded components were copied. No designer was contacted and no paid service or asset was purchased. Final integrated motion, usability and performance require their own browser evidence; these source notes are not user acceptance.

Integrated geometry, recordings, narrow-screen checks and interaction-trace findings are recorded separately in [MOTION-ACCEPTANCE.md](MOTION-ACCEPTANCE.md).
