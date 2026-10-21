import test from 'node:test';
import assert from 'node:assert/strict';
import { arrangeBottles } from '../dist/scene-layout.js';
import { legalPresentationMove, createBoardPresenter } from '../dist/interface-motion.js';
import { applyMove, clone } from '../dist/solver.js';

test('3D layouts retain every supported bottle with separated footprints on narrow and wide boards', () => {
  for (const width of [320, 390, 768, 1280]) for (let count = 2; count <= 12; count++) {
    const layout = arrangeBottles(count, width, 720);
    assert.equal(layout.positions.length, count);
    assert.ok(Number.isFinite(layout.height) && layout.height >= 220);
    assert.equal(new Set(layout.positions.map(p => `${p.x},${p.z}`)).size, count);
    for (let i = 0; i < count; i++) for (let j = i + 1; j < count; j++) {
      const a = layout.positions[i], b = layout.positions[j];
      assert.ok(Math.hypot(a.x - b.x, a.z - b.z) > .8, `${width}px / ${count}: glass footprints must stay apart`);
    }
  }
  assert.equal(arrangeBottles(12, 390, 844).rows, 4);
  assert.equal(arrangeBottles(12, 1280, 720).rows, 2);
});

test('pour presentation accepts only checked adjacent forward transitions, never undo, stale paths or edits', () => {
  const level = { capacity: 2, bottles: [[0, 1], [1, 0], [], []] };
  const actual = applyMove(level, 0, 2);
  const before = { level: clone(level), mode: 'play', revision: 3, pours: 0, step: 0 };
  const after = { ...before, level: actual.level, pours: 1 };
  assert.deepEqual(legalPresentationMove(before, after), actual.move);
  assert.equal(legalPresentationMove(after, before), null, 'Undo must settle immediately');
  assert.equal(legalPresentationMove(before, { ...after, revision: 4 }), null, 'a replaced design invalidates old animation');
  assert.equal(legalPresentationMove(before, { ...after, mode: 'edit' }), null);
  assert.equal(legalPresentationMove(before, { ...after, pours: 2 }), null, 'a skipped session is not one pour');
  assert.equal(legalPresentationMove(before, { ...after, level: { capacity: 2, bottles: [[], [1, 0], [0, 1], []] } }), null, 'a fabricated transfer must pass real maximal-pour rules');
  const review = { ...before, mode: 'review', step: 0 };
  assert.deepEqual(legalPresentationMove(review, { ...review, level: actual.level, step: 1 }), actual.move);
  assert.equal(legalPresentationMove(review, { ...review, level: actual.level, step: 3 }), null, 'slider jumps settle without an invented intermediate move');
});

test('a failed 3D fetch keeps 2D usable, explicit retry changes the module URL, and returning to 2D clears old projections', async () => {
  const keys = ['document', 'matchMedia', 'innerHeight', 'getComputedStyle', 'addEventListener', 'removeEventListener'];
  const originals = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const wraps = Array.from({ length: 12 }, () => ({ projected: true, removeAttribute(name) { if (name === 'style') this.projected = false; }, classList: { remove() {} } }));
  const node = () => ({ textContent: '', disabled: false, dataset: {}, clientWidth: 390, style: { setProperty() {} }, setAttribute() {}, getBoundingClientRect: () => ({ top: 0, bottom: 265 }), querySelectorAll: () => wraps });
  const nodes = new Map(['board-stage', 'puzzle-scene', 'bottle-board', 'view-toggle', 'scene-status', 'motion-preference'].map(id => [id, node()]));
  const reduced = { matches: false, addEventListener() {}, removeEventListener() {} }, urls = [];
  const engine = { update() {}, setMotion() {}, finish() {}, dispose() {}, suspend() { wraps.forEach(w => { w.projected = true; }); } };
  let presenter;
  try {
    const globals = {
      document: { getElementById: id => nodes.get(id), documentElement: { dataset: {} }, body: {}, hidden: false, addEventListener() {}, removeEventListener() {} },
      matchMedia: () => reduced, innerHeight: 844, getComputedStyle: () => ({ getPropertyValue: () => '#3359fa' }), addEventListener() {}, removeEventListener() {}
    };
    for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    presenter = createBoardPresenter({ async loadStage(url) { urls.push(url); if (urls.length === 1) throw new Error('Blocked fetch'); return { createStage: () => engine }; } });
    const state = { level: { capacity: 6, bottles: Array.from({ length: 12 }, () => []) }, mode: 'play', selected: null, revision: 1, pours: 0, step: 0 };
    presenter.update(state); await new Promise(resolve => setImmediate(resolve));
    assert.equal(nodes.get('board-stage').dataset.view, '2d');
    assert.equal(nodes.get('view-toggle').textContent, 'Retry 3D');
    assert.equal(wraps.length, 12, 'failure cannot remove supported bottles');
    nodes.get('view-toggle').onclick(); await new Promise(resolve => setImmediate(resolve));
    assert.equal(new URL(urls[0]).search, '');
    assert.equal(new URL(urls[1]).searchParams.get('retry'), '1', 'retry must avoid the document failed-module cache');
    assert.equal(nodes.get('board-stage').dataset.view, '3d');
    presenter.update({ ...state, mode: 'edit' });
    assert.equal(nodes.get('board-stage').dataset.view, '2d');
    assert.ok(wraps.every(w => !w.projected), 'suspending the old renderer must not leave its hit positions on the editor');
  } finally {
    presenter?.dispose();
    for (const key of keys) { const descriptor = originals.get(key); if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  }
});
