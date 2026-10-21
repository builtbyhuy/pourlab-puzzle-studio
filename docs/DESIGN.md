# PourLab visual direction — Lifemed reference

Redesign requested on 2026-10-21. Reference: https://www.behance.net/gallery/252323471/Lifemed-Web-Motion . The live screenshot inspected at `job hunt/output/ui-redesign-lifemed-2026-10-21/reference-live.jpg` supplies the visual evidence; this is an interpretation for a creative workbench, not a copy of Lifemed identity or artwork.

## Direction

- White `#ffffff`, true black `#000000`, secondary text `#65676c`, lines `#e5e6e9`, drafting surface `#f7f8fa`, focus cobalt `#274bdc`. Colors belong to the liquid, not the app chrome.
- Local Manrope variable font: regular oversized display (60–104px), 14px controls, 15px explanatory copy. Plain sentence case, restrained weights and spacing.
- The opening is a quiet gallery: slim bordered navigation, one large black headline over an original iridescent glass study, short practical description, one black Open studio action. Its height is bounded so the actual tool begins within the desktop opening screen.
- The studio is the product. A pale dotted drafting surface holds larger translucent CSS bottles; a white inspector separates paint controls from search. The inventory sits beside the board rather than creating a long stack of miniature purple cards. Actions and errors remain legible at 14px.
- Flat white panels, hairline divisions, small functional corner radii. Frosting only on real translucent glass or overlays. No floating metric cards or decorative gradients behind ordinary text.
- On narrow screens the hero art remains behind the headline, navigation simplifies, the board wraps without horizontal overflow and inspector follows it. A user can jump straight to the studio. Dialogs, keyboard focus and 44px mobile touch controls remain usable.
- Motion answers actual actions (bottle selection, legal-target indication, playback, search status). Reduced-motion preferences disable decorative transition and animation.

## Reference translation

The Lifemed reference informs whitespace, normal-weight grotesk typography, black compact actions, monochrome chrome and the iridescent glass focal point. PourLab's bottles remain original functional CSS artwork. Its generated glass study is an original supporting asset, not lifted reference imagery. Root asset preparation supplies local font licensing and source details.

## Verification

Core modules and portable-data behavior are unchanged. All eight existing tests passed after the visual work. CUA browser acceptance used a novel capacity-three JSON level: import, real A* (7 pours / 48 states), keyboard End replay to a sorted 7/7 result, manual legal pour and Undo, erase-induced inventory error with disabled Play/search, repair via Undo, named save and library dialog passed. The studio and case-study page both had document scrollWidth equal to clientWidth under a 390px viewport. An observed mobile caption/art overlap and case-study decorative overflow were corrected. Reduced-motion CSS disables animation and smooth scrolling; complete assistive-technology coverage was not performed. Root owns final evidence capture and deployment.

## 21 October 2026 — project-fit sources and live motion

The approved white/black/glass design remains. [Water Sort: Game UI design](https://www.behance.net/gallery/193054545/Water-Sort-Game-UI-design) supplies task-specific tube readability and play/pause/completion hierarchy; its purple game theme, coins and store are not adopted. [Lifemed Web & Motion](https://www.behance.net/gallery/252323471/Lifemed-Web-Motion) supplies composition and glass principles. The live hero is an original geometric liquid loop with a separate droplet, rendered with locally vendored MIT-licensed Three.js; the generated PNG remains a separate fallback. The editor, legal-pour rules and visible state trace are original PourLab work. Gallery assets are not copied or covered by the project's MIT license.

Lifemed case-video movement was observed, while inspected Water Sort/GEO content was static. Reference timing and easing were not measured. PourLab chooses its own selection, trace-step and ambient-motion timing, preserving readable state changes, pause and reduced motion. See [DESIGN-SOURCES.md](DESIGN-SOURCES.md) for source choices and license boundaries, [MOTION-ENGINE.md](MOTION-ENGINE.md) for the runtime contract, and [MOTION-ACCEPTANCE.md](MOTION-ACCEPTANCE.md) for integrated browser and state-trace findings. These notes are not user acceptance.

