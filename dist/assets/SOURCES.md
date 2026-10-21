# Visual asset provenance

Updated on 2026-10-21. Current assets are listed first; earlier files below are retained historical material.

## Current display font — Barlow Condensed Bold

Unmodified font from the official Google Fonts repository: https://github.com/google/fonts/blob/main/ofl/barlowcondensed/BarlowCondensed-Bold.ttf . Copyright 2017 The Barlow Project Authors, SIL Open Font License 1.1: https://raw.githubusercontent.com/google/fonts/main/ofl/barlowcondensed/OFL.txt . The complete notice is bundled as `BarlowCondensed-OFL.txt`. File: `BarlowCondensed-Bold.ttf`, 109,912 bytes, SHA-256 `e476562ec9c1e16cf16475895b511f08c804f438cc9a9f80a44ea50a0eeb5b65`. It supplies the selected OBSIDIAN display lettering and is served locally.

## Current UI font — Manrope.ttf

Unmodified Manrope variable font downloaded from the official Google Fonts repository. Copyright 2018 The Manrope Project Authors:

- Font: https://github.com/google/fonts/blob/main/ofl/manrope/Manrope%5Bwght%5D.ttf
- Metadata: https://github.com/google/fonts/blob/main/ofl/manrope/METADATA.pb
- License: https://github.com/google/fonts/blob/main/ofl/manrope/OFL.txt
- Designer: Mikhail Sharanda / The Manrope Project Authors.
- Weight axis: 200–800. Vietnamese subset included by the upstream font.
- License: SIL Open Font License 1.1; the complete upstream notice is included as `OFL.txt`.
- SHA-256: `3ae11c49db0455a3cc33e37d380f20fdb8c7f8b41dc07625c177e3d87a9d6ae6`.

The filename has been shortened for local hosting; the font binary is unchanged. The upstream directory, metadata and license were checked using the GitHub connector before downloading the official binary. No font service or third-party request is necessary at runtime.

## Current renderer — Three.js 0.180.0 / r180

The current `stage3d.js` uses the locally vendored official browser modules under `dist/vendor/three/`. Their complete MIT notice and pinned source URLs are retained in `vendor/three/LICENSE` and `vendor/three/README.md`. The two minified core modules are unchanged upstream files; RoomEnvironment has one documented import-path rewrite for buildless static hosting. No runtime CDN, paid service, API key or account is involved.

The tubes, rims, bases, liquid-unit geometry, numeric textures, `p↗` emblem and 2D controls are original implementation. Actual puzzle state drives the geometry and bounded legal-pour transitions. This is stylized animation, not fluid physics. The precise 2D editor and explicit/failure 2D view retain the full supported model. No Board, Form + Fidget, Cosmos, Quick, Draw! or Lichess artwork, model, Rive file or source code is redistributed. Inspected references and their specific influence are recorded in `docs/DESIGN-SOURCES.md`.

## Current UI and evidence assets

`social-preview.png` is an unaltered actual browser capture of the selected OBSIDIAN interface, also saved as `docs/evidence/selected-desktop.png`. It shows a synthetic puzzle, not customer data or adoption.

`checked-replay.png` records the actual selected-interface worker result and final 4/4 checked replay, also saved as `docs/evidence/selected-replay.png`. The synthetic capacity-3 input is `[[0,1,1],[1,2,2],[2,0,0],[],[]]`; `reviewer-level.json` is its actual portable export. The result has four shortest pours and 17 A* states. These are product execution evidence, not demand or player research. `docs/evidence/SELECTED-DESIGN-QA.md` records the capture and browser-check scope.

## Historical resources — inactive in current pages

### Rubik variable font

Unmodified official Google Fonts variable font: https://github.com/google/fonts/blob/main/ofl/rubik/Rubik%5Bwght%5D.ttf . Copyright 2015 The Rubik Project Authors, SIL Open Font License 1.1, verified from https://raw.githubusercontent.com/google/fonts/main/ofl/rubik/OFL.txt on 21 October 2026. Bundled files: `Rubik-Variable.ttf` (359,804 bytes) and complete `Rubik-OFL.txt`. SHA-256: `1b3a7437ba2af80e465e773ed60c5036d1ba6ace492d89046dbcf18fb31e4e88`. Rubik supplied the superseded play-first revision through `playground.css`; neither is loaded by the selected app. Barlow/Manrope above are active again.

### glass-study.png

An original AI-generated decorative sculpture produced with the built-in image generation tool on 2026-10-21. It does not depict an in-game object, a solver result or a customer result. No artwork from the user's Lifemed reference was copied or supplied as an edit target. The reference informed broad art direction only: white space, restrained type and translucent glass.

- File: 1254 × 1254 PNG, 32-bit RGBA with transparent alpha.
- Bytes: 1,304,648.
- SHA-256: `9b85591c7d05f008fdf8f17b5dff9a7f100bb90150ee5da575737313e1b73f75`.
- Visual inspection: asymmetrical poured glass teardrop loop, lavender/cobalt/rose refraction; no logos, text or UI. The background alpha was checked separately.

#### Final generation prompt

> Use case: stylized-concept. Asset type: original premium website hero sculpture, isolated on genuine transparent alpha with no opaque backdrop. Create a refined sculptural loop of poured optical glass for a color puzzle design studio. One continuous thick fluid glass ribbon forms a gracefully tilted open teardrop loop, with a softly tapering curl at the base: dynamic and asymmetrical, a sophisticated liquid sculpture, NOT a literal water splash. Wide central opening, elegant sculptural negative space, and three-dimensional thickness. Three-quarter studio camera, entire silhouette fully visible, occupies 78 percent of square frame with breathing room. Crystal clear glass body with subtle lilac, cobalt blue and faint blush rose iridescent refraction along curved edges, broadly pale lavender translucent midtones. Highly polished ray-traced optical surfaces, realistic inner reflection and lens distortion, crisp captivating edge highlights, no colored opaque plastic. Broad white studio softboxes produce soft luminous reflections, exacting high-end art-direction and editorial CGI quality. Constraints: original standalone form, no logos, no text, no UI, no watermark, no icons, no stock cartoon, no pedestal, no dark background, no floating particles, no glitter, no surrounding objects, no copied artwork. Suitable for compositing on a clean white website. A beautiful fluid droplet-shaped glass loop, not a closed donut and not a shiny metallic ring.

### Earlier Cosmos social preview — 21 October 2026

`social-preview.jpg` was replaced for the Cosmos redesign on 21 October 2026. It is an unaltered 1280×720 CUA-controlled browser capture of that earlier local preview. It shows a first-visit interface with empty local files or an explicitly fictional starting puzzle. It is not a generated mockup or evidence of customer use. It is retained as historical material. The selected app does not load the old glass hero or its module; it does load the separate current Three.js puzzle renderer documented above. Retained third-party assets keep their separate license notices.

### Earlier play-first reviewer captures — superseded

The play-first `clarity-desktop.png`, `clarity-mobile.png` and `clarity-replay-2026-10-21.png` remain historical browser evidence. The replay used the synthetic capacity-2 layout `[[0,1],[1,2],[2,0],[],[]]` and reached 4/4. They are not captures of the selected OBSIDIAN interface or its current capacity-3 reviewer export.

### Earlier Cosmos reviewer case-study capture — superseded

An earlier `checked-replay.png` was copied from `docs/evidence/cosmos-solved-desktop.png`. That Cosmos screenshot remains historical evidence of the explicitly synthetic capacity-2 layout. The public image has since been replaced by the selected-interface capture described above.
