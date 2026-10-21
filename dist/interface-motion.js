import { applyMove } from './solver.js';
import { arrangeBottles } from './scene-layout.js';

/** Only a real, adjacent forward move may receive a pouring transition. */
export function legalPresentationMove(before, after) {
  if (!before || !after || before.mode !== after.mode || after.mode === 'edit'
    || before.revision !== after.revision || before.level.capacity !== after.level.capacity
    || before.level.bottles.length !== after.level.bottles.length) return null;
  const adjacent = after.mode === 'play' ? after.pours === before.pours + 1 : after.mode === 'review' && after.step === before.step + 1;
  if (!adjacent) return null;
  const changed = before.level.bottles.map((b, i) => JSON.stringify(b) === JSON.stringify(after.level.bottles[i]) ? -1 : i).filter(i => i >= 0);
  if (changed.length !== 2) return null;
  const from = changed.find(i => before.level.bottles[i].length > after.level.bottles[i].length);
  const to = changed.find(i => before.level.bottles[i].length < after.level.bottles[i].length);
  if (from === undefined || to === undefined) return null;
  const checked = applyMove(before.level, from, to);
  return checked && JSON.stringify(checked.level) === JSON.stringify(after.level) ? checked.move : null;
}

/** Presentation consumes copies of production state; it never owns rules or storage. */
export function createBoardPresenter({ loadStage = url => import(url) } = {}) {
  const stage = document.getElementById('board-stage'), mount = document.getElementById('puzzle-scene');
  const board = document.getElementById('bottle-board'), toggle = document.getElementById('view-toggle');
  const status = document.getElementById('scene-status'), motionButton = document.getElementById('motion-preference');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let state = null, engine = null, loading = null, failed = false, chosen2D = false, disposed = false, attempt = 0;
  let enabled = !reduced.matches, keyboard = false, currentView = '2d';
  const text = (node, value) => { if (node.textContent !== value) node.textContent = value; };
  function syncMotion() {
    document.documentElement.dataset.interactiveMotion = enabled ? 'on' : 'off';
    motionButton.setAttribute('aria-pressed', String(enabled));
    text(motionButton, enabled ? 'Motion on' : 'Motion off');
    motionButton.disabled = reduced.matches;
    motionButton.title = reduced.matches ? 'Motion is off because your system requests reduced motion.' : 'Turn interactive motion on or off';
    engine?.setMotion(enabled && !reduced.matches);
  }
  function clearProjection() {
    for (const wrap of board.querySelectorAll('.bottle-wrap')) { wrap.removeAttribute('style'); wrap.classList.remove('selected', 'legal'); }
  }
  function vectorView(message) {
    currentView = '2d'; stage.dataset.view = '2d'; engine?.suspend(); clearProjection();
    text(status, message);
  }
  async function ensureEngine() {
    if (engine || loading || disposed || failed) return;
    text(status, 'Loading live 3D · the 2D board is usable');
    // A failed ESM fetch is cached for the document. A deliberate retry needs
    // a fresh module URL; attempts are bounded rather than creating an idle loop.
    const moduleURL = new URL('./stage3d.js', import.meta.url);
    if (attempt) moduleURL.searchParams.set('retry', String(attempt));
    const promise = loadStage(moduleURL.href).then(({ createStage }) => createStage(mount, {
      onFailure() {
        failed = true; engine?.dispose(); engine = null;
        vectorView('3D unavailable · all controls work in 2D');
        text(toggle, 'Retry 3D'); toggle.disabled = false; toggle.setAttribute('aria-pressed', 'true');
      }
    }));
    loading = promise;
    try {
      const ready = await promise;
      if (disposed) { ready.dispose(); return; }
      engine = ready; syncMotion(); applyView();
    } catch {
      failed = true; vectorView('3D unavailable · all controls work in 2D');
      text(toggle, 'Retry 3D'); toggle.disabled = false; toggle.setAttribute('aria-pressed', 'true');
    } finally { if (loading === promise) loading = null; }
  }
  function plan() { return arrangeBottles(state.level.bottles.length, Math.max(240, stage.clientWidth), innerHeight); }
  function applyView(move = null) {
    if (!state || disposed) return;
    document.documentElement.dataset.instrumentMode = state.mode;
    if (state.mode === 'edit') {
      vectorView('2D editor · paint individual slots'); text(toggle, '2D editor'); toggle.disabled = true; toggle.setAttribute('aria-pressed', 'true'); return;
    }
    toggle.disabled = false;
    if (chosen2D || failed) {
      vectorView(failed ? '3D unavailable · all controls work in 2D' : 'Numbered 2D board');
      text(toggle, failed ? 'Retry 3D' : '3D view'); toggle.setAttribute('aria-pressed', 'true'); return;
    }
    text(toggle, '2D view'); toggle.setAttribute('aria-pressed', 'false');
    if (!engine) { vectorView('Numbered 2D board'); ensureEngine(); return; }
    const layout = plan(); stage.style.setProperty('--scene-height', `${layout.height}px`);
    currentView = '3d'; stage.dataset.view = '3d';
    text(status, 'Live 3D · numbered colors');
    const colors = Array.from({ length: 8 }, (_, c) => getComputedStyle(document.body).getPropertyValue(`--c${c}`).trim());
    const rect = stage.getBoundingClientRect(), visible = rect.bottom > 0 && rect.top < innerHeight;
    engine.update(state.level, { layout, selected: state.selected, mode: state.mode, colors, move: enabled && !keyboard && !reduced.matches && !document.hidden && visible ? move : null });
  }
  toggle.onclick = () => {
    if (failed) {
      if (attempt >= 3) { vectorView('3D unavailable · use 2D, or export your level before reloading'); text(toggle, '2D active'); toggle.disabled = true; return; }
      attempt++; failed = false; chosen2D = false; engine?.dispose(); engine = null;
    }
    else chosen2D = !chosen2D;
    applyView();
  };
  motionButton.onclick = () => { enabled = !enabled; syncMotion(); if (state) applyView(); };
  const onKey = () => { keyboard = true; engine?.finish(); };
  const onPointer = () => { keyboard = false; };
  const onResize = () => { if (state && currentView === '3d') applyView(); };
  const onScroll = () => engine?.finish();
  const onVisibility = () => { if (document.hidden) engine?.finish(); else if (state) applyView(); };
  const onReduced = () => { if (reduced.matches) enabled = false; syncMotion(); if (state) applyView(); };
  document.addEventListener('keydown', onKey, { capture: true });
  document.addEventListener('pointerdown', onPointer, { capture: true, passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  addEventListener('resize', onResize, { passive: true });
  addEventListener('scroll', onScroll, { passive: true });
  reduced.addEventListener('change', onReduced);
  syncMotion();
  return {
    update(next) { const move = legalPresentationMove(state, next); state = next; applyView(move); },
    dispose() {
      disposed = true; engine?.dispose();
      document.removeEventListener('keydown', onKey, { capture: true }); document.removeEventListener('pointerdown', onPointer, { capture: true });
      document.removeEventListener('visibilitychange', onVisibility); removeEventListener('resize', onResize); removeEventListener('scroll', onScroll); reduced.removeEventListener('change', onReduced);
    }
  };
}
