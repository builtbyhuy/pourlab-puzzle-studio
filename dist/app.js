import { clone, validateLevel, isSolved, applyMove, pourAmount, replay, generateLevel } from './solver.js';
import { parsePortable, normalizeLevel, packLevel, encodeShare, decodeShare } from './portable.js';

const $ = id => document.getElementById(id);
const COLORS = ['Coral', 'Sea glass', 'Blue', 'Honey', 'Lilac', 'Rose', 'Leaf', 'Caramel'];
const STORE = 'pourlab-library-v1', RECOVERY = 'pourlab-draft-v1';
const initial = generateLevel('little-chaos', 4, 4, 2);
let draft = clone(initial), name = 'Four-color study', mode = 'edit', paint = 0, selected = null;
let game = clone(draft), history = [], moves = [], frames = [], step = 0, timer = null;
let worker = null, job = 0, revision = 0, dirty = false, currentId = null, noticeTimer;
let saved = [], editorHistory = [], comparisons = {}, searchStatus = 'ready';
const el = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node; };
const liquid = (node, color) => node.style.setProperty('--liquid', `var(--c${color})`);
const tell = message => { $('notice').textContent = message; $('notice').hidden = false; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => $('notice').hidden = true, 5500); };
function storeDraft() {
  try { localStorage.setItem(RECOVERY, JSON.stringify({ ...packLevel(draft, name || 'Untitled study'), currentId, dirty })); } catch { /* A blocked draft store never prevents editing. */ }
}
function persistLibrary(next = saved) {
  try { localStorage.setItem(STORE, JSON.stringify(next)); saved = next; $('saved-count').textContent = saved.length; return true; }
  catch { tell('Browser storage is unavailable or full. Export JSON to keep your work.'); return false; }
}
function loadStorage() {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) { const parsed = JSON.parse(raw); if (!Array.isArray(parsed) || parsed.length > 50) throw new Error(); saved = parsed.map(x => ({ id: String(x.id), updated: Number(x.updated) || 0, ...normalizeLevel({ name: x.name, capacity: x.capacity, bottles: x.bottles }) })); }
  } catch { tell('Saved levels could not be read. Your browser data has not been overwritten.'); }
  try {
    const raw = localStorage.getItem(RECOVERY);
    if (raw) { const parsed = JSON.parse(raw); const item = normalizeLevel({ name: parsed.name, capacity: parsed.capacity, bottles: parsed.bottles }); draft = clone(item); name = item.name; currentId = typeof parsed.currentId === 'string' ? parsed.currentId : null; dirty = parsed.dirty !== false; }
  } catch { /* A malformed recovery record does not change the sample. */ }
  $('saved-count').textContent = saved.length;
}
function stopPlayback() { clearInterval(timer); timer = null; $('autoplay').textContent = 'Play solution'; }
function stopSearch(announce = false) {
  if (worker) { worker.terminate(); worker = null; job++; searchStatus = 'ready'; if (announce) result('Stopped. Solvability is still unknown.', ''); }
  $('cancel').hidden = true; $('solve').textContent = 'Analyze original level ↗';
}
function invalidate() {
  stopSearch(); stopPlayback(); revision++; frames = []; moves = []; step = 0; comparisons = {}; selected = null;
  $('review-tab').disabled = true; searchStatus = 'ready'; result('Level changed. Find a new solution when ready.');
}
function changed(snapshot = true) {
  if (snapshot) editorHistory.push(clone(draft));
  if (editorHistory.length > 50) editorHistory.shift();
  invalidate(); dirty = true; game = clone(draft); history = []; storeDraft(); render();
}
function mutate(callback) { const before = clone(draft); callback(); editorHistory.push(before); changed(false); }
function result(message, cls = '') {
  const area = $('solver-result'); area.className = `solver-result ${cls}`;
  area.replaceChildren(el('span', 'result-dot'), el('p', '', message));
}
function safeReplace() { return !dirty || window.confirm('Replace the current draft? Save or export it first if you want to keep it.'); }
function setLevel(level, nextName, id = null) {
  stopSearch(); stopPlayback(); draft = clone(level); name = nextName; currentId = id;
  editorHistory = []; history = []; dirty = !id; invalidate(); mode = 'edit'; game = clone(draft); storeDraft(); render();
}
function currentLevel() { return mode === 'play' ? game : mode === 'review' && frames.length ? frames[step] : draft; }

function renderBoard() {
  const active = document.activeElement;
  const focusSlot = active?.dataset.slot, focusBottle = active?.dataset.bottle;
  const board = $('bottle-board'); board.replaceChildren();
  const level = currentLevel();
  level.bottles.forEach((bottle, index) => {
    const wrap = el('div', 'bottle-wrap'), glass = el('div', 'bottle-glass');
    for (let slot = 0; slot < level.capacity; slot++) {
      const color = bottle[slot];
      const layer = el(mode === 'edit' ? 'button' : 'span', `slot${color === undefined ? ' empty' : ''}`, color === undefined ? '–' : color + 1);
      if (color !== undefined) { layer.dataset.color = color; liquid(layer, color); }
      if (mode === 'edit') {
        layer.dataset.slot = slot; layer.dataset.bottle = index;
        layer.setAttribute('aria-label', `Bottle ${index + 1}, slot ${slot + 1} from bottom: ${color === undefined ? 'empty' : `${COLORS[color]} (color ${color + 1})`}. ${paint === null ? 'Erase this and above.' : `Paint ${COLORS[paint]}.`}`);
        layer.onclick = () => {
          if (paint !== null && slot > bottle.length) { tell('Fill the lowest empty slot first. Bottles cannot have gaps.'); return; }
          if (paint === null && slot >= bottle.length || paint === color) return;
          mutate(() => { if (paint === null) draft.bottles[index].splice(slot); else draft.bottles[index][slot] = paint; });
        };
      }
      glass.append(layer);
    }
    if (mode === 'play') {
      const trigger = el('button', `bottle-play${selected === index ? ' selected' : ''}${selected !== null && pourAmount(game, selected, index) ? ' legal-target' : ''}`);
      trigger.dataset.bottle = index; trigger.setAttribute('aria-pressed', selected === index);
      trigger.setAttribute('aria-label', `Bottle ${index + 1}: ${bottle.length ? bottle.map(c => `${COLORS[c]} ${c + 1}`).join(', ') + ', bottom to top' : 'empty'}`);
      trigger.append(glass); trigger.onclick = () => playBottle(index); wrap.append(trigger);
    } else wrap.append(glass);
    const label = el('div', 'bottle-label', String(index + 1).padStart(2, '0'));
    if (mode === 'edit') {
      const remove = el('button', 'remove-bottle', '×'); remove.setAttribute('aria-label', `Remove bottle ${index + 1}`); remove.disabled = draft.bottles.length <= 2;
      remove.onclick = () => { if (bottle.length && !window.confirm(`Remove bottle ${index + 1} and its colors?`)) return; mutate(() => draft.bottles.splice(index, 1)); }; label.append(remove);
    }
    wrap.append(label); board.append(wrap);
  });
  if (focusBottle !== undefined) {
    const selector = focusSlot !== undefined ? `[data-bottle="${focusBottle}"][data-slot="${focusSlot}"]` : `[data-bottle="${focusBottle}"]`;
    board.querySelector(selector)?.focus({ preventScroll: true });
  }
}

function renderInventory() {
  const validation = validateLevel(draft), { counts } = validation;
  const holder = $('inventory'); holder.replaceChildren();
  counts.forEach((count, c) => {
    if (!count) return;
    const item = el('span', `inventory-item${count % draft.capacity ? ' invalid' : ''}`), dot = el('i'); liquid(dot, c);
    item.append(dot, el('span', '', `${c + 1}: ${count}/${draft.capacity}`));
    item.title = `${COLORS[c]}: ${count} units. Needs a multiple of ${draft.capacity}.`; holder.append(item);
  });
  if (!counts.some(Boolean)) holder.append(el('span', 'muted', 'No colors yet.'));
  $('unit-count').textContent = `${counts.reduce((a, b) => a + b, 0)} units`;
  $('validation').textContent = validation.valid ? '✓ Balanced. Ready to play or solve.' : validation.errors.join(' ');
  $('validation').classList.toggle('invalid', !validation.valid);
  $('solve').disabled = !validation.valid || !!worker;
  document.querySelector('[data-mode="play"]').disabled = !validation.valid;
}
function render() {
  $('level-name').value = name; $('draft-state').textContent = dirty ? 'Unsaved draft' : currentId ? 'Saved on this browser' : 'Example level';
  $('capacity').value = draft.capacity; $('bottle-total').textContent = draft.bottles.length;
  $('add-bottle').disabled = draft.bottles.length >= 12;
  $('paint-tools').hidden = mode !== 'edit'; $('editor-footer').hidden = mode !== 'edit';
  $('playback').hidden = mode !== 'review'; $('play-summary').hidden = mode !== 'play';
  $('undo').disabled = mode === 'play' ? !history.length : mode === 'edit' ? !editorHistory.length : true;
  $('reset').hidden = mode === 'edit';
  $('reset').textContent = mode === 'review' ? 'First step' : 'Reset';
  document.querySelectorAll('[data-mode]').forEach(button => { const on = button.dataset.mode === mode; button.classList.toggle('active', on); button.setAttribute('aria-pressed', on); });
  $('stage-title').textContent = mode === 'edit' ? 'Every good puzzle starts with a mess.' : mode === 'play' ? isSolved(game) ? 'A little order, beautifully restored.' : 'Your move.' : 'There is a way through the chaos.';
  $('stage-instruction').textContent = mode === 'edit' ? 'Choose a color, then paint a slot. Fill each bottle from bottom to top.' : mode === 'play' ? 'Choose a source bottle, then a matching or empty target. Dashed bottles are legal targets.' : 'A shortest legal solution. Follow each pour, at your own pace.';
  if (mode === 'play') $('play-summary').textContent = isSolved(game) ? `Solved in ${history.length} ${history.length === 1 ? 'pour' : 'pours'}. Try the solver to compare with the shortest route.` : `${history.length} ${history.length === 1 ? 'pour' : 'pours'} so far. ${selected === null ? 'Select a source bottle.' : `Bottle ${selected + 1} selected. Choose a target or select it again to cancel.`}`;
  if (mode === 'review') {
    $('step-slider').max = moves.length; $('step-slider').value = step;
    $('step-label').textContent = step ? `Pour ${step}: bottle ${moves[step - 1].from + 1} → ${moves[step - 1].to + 1} (${moves[step - 1].amount} ${COLORS[moves[step - 1].color]} ${moves[step - 1].amount === 1 ? 'unit' : 'units'})` : 'The starting arrangement';
    $('step-total').textContent = `${step} / ${moves.length}`;
    $('previous').disabled = step === 0; $('next').disabled = step >= moves.length;
    $('autoplay').disabled = moves.length === 0;
  }
  renderInventory(); renderBoard();
}

function playBottle(index) {
  if (selected === null) { if (!game.bottles[index].length) { tell('Choose a bottle with colors to pour first.'); return; } selected = index; }
  else if (selected === index) selected = null;
  else {
    const poured = applyMove(game, selected, index);
    if (!poured) { tell('That pour is not legal. Choose an empty bottle or one with the same top color and space.'); return; }
    history.push(clone(game)); game = poured.level; selected = null;
  }
  render();
}

function setMode(next) {
  if (next === 'review' && !frames.length) return;
  if (next === 'play' && !validateLevel(draft).valid) return;
  stopPlayback(); selected = null;
  if (next === 'play' && mode !== 'play') { game = clone(draft); history = []; }
  mode = next; render();
}

function solveDraft() {
  if (!validateLevel(draft).valid || worker) return;
  const stateInput = $('max-states'), timeInput = $('max-seconds'), depthInput = $('max-depth');
  if (![stateInput, timeInput, depthInput].every(field => field.reportValidity() && field.value !== '')) { tell('Choose search limits within the shown ranges.'); return; }
  stopPlayback();
  const id = ++job, runRevision = revision, startLevel = clone(draft);
  const options = { algorithm: $('algorithm').value, maxStates: +stateInput.value, maxMs: +timeInput.value * 1000, maxDepth: +depthInput.value };
  searchStatus = 'searching'; result('Searching… you can keep using the workbench.', 'busy');
  try { worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }); }
  catch { worker = null; result('Search could not start. Serve this app over HTTP or HTTPS; opening a file directly cannot run its worker.', 'error'); return; }
  $('cancel').hidden = false; $('solve').disabled = true; $('solve').textContent = 'Searching…';
  worker.onmessage = event => {
    if (event.data.id !== id || runRevision !== revision) return;
    const data = event.data;
    if (data.type === 'progress') { result(`Searching… ${data.progress.visited.toLocaleString()} states found · ${(data.progress.elapsedMs / 1000).toFixed(1)}s`, 'busy'); return; }
    const answer = data.result; stopSearch();
    if (data.type === 'error') { result(`Search failed: ${data.message}`, 'error'); renderInventory(); return; }
    searchStatus = answer.status;
    const method = answer.algorithm === 'bfs' ? 'BFS' : 'A*';
    const stats = `${answer.visited.toLocaleString()} states · ${(answer.elapsedMs / 1000).toFixed(2)}s`;
    if (answer.status === 'solved') {
      try { frames = replay(startLevel, answer.moves); }
      catch { frames = []; result('The returned path failed legal replay. No solution is shown.', 'error'); render(); return; }
      moves = answer.moves; step = 0; comparisons[answer.algorithm] = moves.length;
      const matched = comparisons.bfs !== undefined && comparisons.astar !== undefined ? ` A* and BFS both found ${moves.length} pours on this level.` : '';
      result(`${moves.length} ${moves.length === 1 ? 'pour' : 'pours'}, shortest & checked. ${method}: ${stats}.${matched}`, 'solved');
      $('review-tab').disabled = false; setMode('review');
    } else if (answer.status === 'exhausted') result(`${method} reached the ${answer.reason} limit. Solvability is still unknown. ${stats}. Increase a limit or simplify the level.`, 'error');
    else if (answer.status === 'unsolvable') result(`No solution under these rules. The complete reachable space was searched. ${method}: ${stats}.`, 'error');
    else result(answer.errors?.join(' ') || 'Invalid level.', 'error');
    renderInventory();
  };
  worker.onerror = () => { stopSearch(); result('The search worker failed to load. Check that worker.js and solver.js are served from the same site.', 'error'); renderInventory(); };
  worker.postMessage({ id, level: startLevel, options });
}

function saveLevel() {
  name = $('level-name').value.trim();
  try { normalizeLevel({ name, ...draft }); } catch (error) { tell(error.message); $('level-name').focus(); return; }
  if (!currentId && saved.length >= 50) { tell('This library has 50 levels. Export a backup, then delete a level to make room.'); return; }
  const id = currentId || crypto.randomUUID(), item = { id, name, ...clone(draft), updated: Date.now() };
  const next = saved.filter(x => x.id !== id); next.unshift(item);
  if (persistLibrary(next)) { currentId = id; dirty = false; storeDraft(); render(); tell('Level saved on this browser.'); }
}
function renderLibrary() {
  const list = $('library-list'); list.replaceChildren();
  if (!saved.length) list.append(el('p', 'library-empty', 'Your shelf is empty. Save a level from the workbench to keep it here.'));
  for (const item of saved) {
    const row = el('div', 'saved-item'), info = el('div');
    info.append(el('strong', '', item.name), el('p', 'muted', `${item.bottles.length} bottles · capacity ${item.capacity} · ${validateLevel(item).valid ? 'balanced' : 'draft inventory'}`));
    const buttons = el('div', 'saved-buttons'), open = el('button', 'secondary', 'Open'), remove = el('button', 'text-button delete-level', 'Delete');
    open.setAttribute('aria-label', `Open ${item.name}`); remove.setAttribute('aria-label', `Delete ${item.name}`);
    open.onclick = () => { if (!safeReplace()) return; setLevel(item, item.name, item.id); dirty = false; render(); $('library-dialog').close(); tell('Saved level opened.'); };
    remove.onclick = () => { if (!window.confirm(`Delete “${item.name}” from this browser? Export a backup first if you need a copy.`)) return; if (persistLibrary(saved.filter(x => x.id !== item.id))) { if (currentId === item.id) { currentId = null; dirty = true; storeDraft(); render(); } renderLibrary(); tell('Saved level deleted.'); } };
    buttons.append(open, remove); row.append(info, buttons); list.append(row);
  }
  $('export-library').disabled = !saved.length;
}
function download(data, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = el('a'); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function importText(text) {
  $('import-error').textContent = '';
  try {
    const parsed = parsePortable(text);
    if (parsed.type === 'library') {
      if (saved.length + parsed.levels.length > 50) throw new Error('This import would exceed 50 saved levels. Export and remove some existing levels first.');
      const imported = parsed.levels.map(level => ({ id: crypto.randomUUID(), updated: Date.now(), ...level }));
      if (!persistLibrary([...imported, ...saved])) return;
      tell(`${imported.length} ${imported.length === 1 ? 'level' : 'levels'} added to My levels.`);
    } else { if (!safeReplace()) return; const level = parsed.levels[0]; setLevel(level, level.name); tell('Level imported. Check the inventory before playing.'); }
    $('portable-dialog').close(); $('import-json').value = ''; $('import-file').value = '';
  } catch (error) { $('import-error').textContent = error.message; }
}

loadStorage();
try { const shared = decodeShare(location.hash); if (shared) { draft = clone(shared); name = shared.name; currentId = null; dirty = true; tell('Shared level opened. Save a copy to keep it.'); } } catch (error) { tell(error.message); }
game = clone(draft);
COLORS.forEach((color, i) => { const button = el('button', 'swatch', i + 1); liquid(button, i); button.setAttribute('aria-label', `${color}, color ${i + 1}`); button.setAttribute('aria-pressed', i === paint); button.onclick = () => { paint = i; renderPaint(); renderBoard(); }; $('palette').append(button); });
function renderPaint() { [...$('palette').children].forEach((button, i) => button.setAttribute('aria-pressed', paint === i)); $('eraser').setAttribute('aria-pressed', paint === null); }
$('eraser').onclick = () => { paint = null; renderPaint(); renderBoard(); };
document.querySelectorAll('[data-mode]').forEach(button => button.onclick = () => setMode(button.dataset.mode));
$('level-name').addEventListener('input', event => { name = event.target.value; dirty = true; $('draft-state').textContent = 'Unsaved draft'; storeDraft(); });
$('save').onclick = saveLevel;
$('add-bottle').onclick = () => { if (draft.bottles.length < 12) mutate(() => draft.bottles.push([])); };
$('capacity').onchange = event => {
  const capacity = +event.target.value;
  if (draft.bottles.some(b => b.length > capacity)) { tell('Empty the upper slots first. Changing capacity will never silently remove colors.'); event.target.value = draft.capacity; return; }
  mutate(() => draft.capacity = capacity);
};
$('clear').onclick = () => { if (!draft.bottles.some(b => b.length) || !window.confirm('Clear all colors? You can undo this in Create mode.')) return; mutate(() => draft.bottles = draft.bottles.map(() => [])); };
$('undo').onclick = () => { if (mode === 'play' && history.length) { game = history.pop(); selected = null; render(); } else if (mode === 'edit' && editorHistory.length) { draft = editorHistory.pop(); changed(false); } };
$('reset').onclick = () => { if (mode === 'review') { stopPlayback(); step = 0; } else if (mode === 'play') { game = clone(draft); history = []; selected = null; } else { tell('Reset applies to a play session. Use Undo to reverse your edits.'); } render(); };
$('solve').onclick = solveDraft; $('cancel').onclick = () => { stopSearch(true); renderInventory(); };
$('previous').onclick = () => { stopPlayback(); step = Math.max(0, step - 1); render(); };
$('next').onclick = () => { stopPlayback(); step = Math.min(moves.length, step + 1); render(); };
$('step-slider').oninput = event => { stopPlayback(); step = +event.target.value; render(); };
$('autoplay').onclick = () => {
  if (timer) { stopPlayback(); return; }
  if (step >= moves.length) step = 0;
  $('autoplay').textContent = 'Pause'; render();
  timer = setInterval(() => { step++; render(); if (step >= moves.length) stopPlayback(); }, 950);
};
$('generate-form').onsubmit = event => { event.preventDefault(); if (!safeReplace()) return; const seed = $('seed').value.trim() || 'little-chaos'; const colors = +$('colors').value; setLevel(generateLevel(seed, colors, draft.capacity, 2), `Shuffle · ${seed}`.slice(0, 60)); tell('Repeatable shuffle created. Its inventory is balanced; use search to check solvability.'); };
$('blank').onclick = () => { if (safeReplace()) setLevel({ capacity: draft.capacity, bottles: [[], [], [], []] }, 'Untitled study'); };
$('library-open').onclick = () => { renderLibrary(); $('library-dialog').showModal(); };
$('portable-open').onclick = () => { $('import-error').textContent = ''; $('portable-dialog').showModal(); };
$('help-open').onclick = () => $('help-dialog').showModal();
document.querySelectorAll('[data-close]').forEach(button => button.onclick = () => button.closest('dialog').close());
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } }));
$('export-level').onclick = () => { try { download(packLevel(draft, name), 'pourlab-level.json'); } catch (error) { tell(error.message); } };
$('export-library').onclick = () => { download({ format: 'pourlab-library', version: 1, levels: saved.map(({ name, capacity, bottles }) => ({ name, capacity, bottles })) }, 'pourlab-library.json'); };
$('import-paste').onclick = () => importText($('import-json').value);
$('import-file').onchange = async event => { const file = event.target.files[0]; if (!file) return; if (file.size > 300000) { $('import-error').textContent = 'JSON must be smaller than 300 KB.'; return; } try { importText(await file.text()); } catch { $('import-error').textContent = 'That file could not be read. Choose a JSON file again.'; } };
$('share').onclick = async () => {
  try {
    const hash = encodeShare(draft, name); const link = `${location.origin}${location.pathname}${hash}`;
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(link); tell('Level link copied. Anyone with this link can open the level.'); }
    else { $('import-json').value = link; $('import-error').textContent = 'Copy this level link from the text box. This is a link, not import JSON.'; $('portable-dialog').showModal(); $('import-json').focus(); $('import-json').select(); }
  } catch (error) { tell(`Link could not be copied. ${error.message} Use Export this level instead.`); }
};
window.addEventListener('hashchange', () => { try { const shared = decodeShare(location.hash); if (shared && safeReplace()) setLevel(shared, shared.name); } catch (error) { tell(error.message); } });
window.addEventListener('beforeunload', () => { if (dirty) storeDraft(); });
render();

