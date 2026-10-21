import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { clone, generateLevel } from '../dist/solver.js';
import { normalizeLevel, packLevel } from '../dist/portable.js';

const STORE = 'pourlab-library-v1', RECOVERY = 'pourlab-draft-v1';
const level = { id: 'saved-one', name: 'Saved study', capacity: 2, bottles: [[0, 0], []], updated: 1 };

// Execute the real app's storage functions. The DOM and localStorage boundaries
// are controlled so failure paths cannot corrupt a browser or fixture files.
function harness(entries = []) {
  const data = new Map(entries), writes = [], nodes = new Map(), downloads = [], confirmations = [];
  const source = fs.readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8');
  const block = source.slice(source.indexOf('const $ ='), source.indexOf('function stopPlayback()'));
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { textContent: '', hidden: false, disabled: false, classList: { toggle() {} }, focus() {} });
    return nodes.get(id);
  };
  const localStorage = {
    getItem(key) { if (localStorage.failRead) throw new Error('Storage denied'); return data.get(key) ?? null; },
    setItem(key, value) { if (localStorage.failWrite) throw new Error('Quota exceeded'); writes.push([key, value]); data.set(key, value); },
    removeItem(key) { if (localStorage.failWrite) throw new Error('Storage denied'); writes.push([key, null]); data.delete(key); }
  };
  const window = { confirmed: false, confirm(message) { confirmations.push(message); return window.confirmed; } };
  const context = vm.createContext({ document: { getElementById: node }, localStorage, clone, generateLevel, normalizeLevel, packLevel,
    setTimeout() { return 0; }, clearTimeout() {}, window, downloadText: (...args) => downloads.push(args) });
  vm.runInContext(block, context);
  return { data, writes, nodes, node, localStorage, window, context, downloads, confirmations,
    run(code) { return vm.runInContext(code, context); },
    get(code) { return JSON.parse(JSON.stringify(vm.runInContext(code, context))); }
  };
}

test('unreadable existing libraries remain byte-for-byte intact when a later save is attempted', () => {
  for (const raw of ['{ damaged archive', 'null', '{}', '', JSON.stringify([null]), JSON.stringify([{ ...level, bottles: [[8], []] }]), JSON.stringify([level, level]), JSON.stringify(Array.from({ length: 51 }, (_, i) => ({ ...level, id: `saved-${i}` })))]) {
    const h = harness([[STORE, raw]]);
    h.run('loadStorage()');
    h.context.replacement = [level];
    assert.equal(h.run('persistLibrary(replacement)'), false, 'an unreadable library must lock further writes');
    assert.equal(h.data.get(STORE), raw, 'the exact original data must survive');
    assert.equal(h.writes.length, 0);
    assert.equal(h.node('storage-warning').hidden, false);
    assert.match(h.node('storage-warning-text').textContent, /protected|protect/i);
  }
});

test('original backup contains the untouched raw text and reset requires a separate confirmation', () => {
  const raw = '{ damaged library: "literal <img> and 🧪" }', h = harness([[STORE, raw]]);
  h.run('loadStorage()'); h.window.confirmed = true;
  assert.equal(h.run('resetProtectedLibrary()'), false, 'reset stays locked before a backup request');
  assert.equal(h.confirmations.length, 0);
  assert.equal(h.run('downloadOriginalLibrary()'), true);
  assert.deepEqual(h.downloads, [[raw, 'pourlab-original-library.txt', 'text/plain;charset=utf-8']]);
  assert.equal(h.data.get(STORE), raw, 'requesting backup never changes the library');
  h.window.confirmed = false;
  assert.equal(h.run('resetProtectedLibrary()'), false);
  assert.equal(h.data.get(STORE), raw);
  assert.match(h.confirmations[0], /original raw backup.*removes.*Cancel if the download did not finish/i);
  const draftBefore = h.get('draft');
  h.window.confirmed = true;
  assert.equal(h.run('resetProtectedLibrary()'), true);
  assert.equal(h.data.has(STORE), false);
  assert.deepEqual(h.get('draft'), draftBefore, 'reset does not replace the current editor');
  h.context.replacement = [level];
  assert.equal(h.run('persistLibrary(replacement)'), true, 'normal saves resume only after the confirmed reset');
});

test('a failed reset leaves the protected original and the editor intact', () => {
  const raw = 'unreadable original', h = harness([[STORE, raw]]);
  h.run('loadStorage(); downloadOriginalLibrary()');
  h.window.confirmed = true; h.localStorage.failWrite = true;
  const before = h.get('draft');
  assert.equal(h.run('resetProtectedLibrary()'), false);
  assert.equal(h.data.get(STORE), raw);
  assert.deepEqual(h.get('draft'), before);
  assert.match(h.node('storage-warning-text').textContent, /could not be reset.*protected/);
  h.context.replacement = [level];
  assert.equal(h.run('persistLibrary(replacement)'), false);
});

test('failed reads never permit overwriting or resetting an inaccessible original', () => {
  const raw = JSON.stringify([level]), h = harness([[STORE, raw]]);
  h.localStorage.failRead = true; h.window.confirmed = true;
  h.run('loadStorage()'); h.context.replacement = [level];
  assert.equal(h.run('persistLibrary(replacement)'), false);
  assert.equal(h.run('downloadOriginalLibrary()'), false);
  assert.equal(h.run('resetProtectedLibrary()'), false);
  assert.equal(h.data.get(STORE), raw);
  assert.equal(h.writes.length, 0);
  assert.match(h.node('storage-warning-text').textContent, /could not be read.*blocked/);
});

test('failed named save retains the last good library and reports failure until a retry succeeds', () => {
  const raw = JSON.stringify([level]), h = harness([[STORE, raw]]);
  h.run('loadStorage()'); h.context.replacement = [{ ...level, name: 'Not saved yet' }];
  h.localStorage.failWrite = true;
  assert.equal(h.run('persistLibrary(replacement)'), false);
  assert.equal(h.data.get(STORE), raw);
  assert.equal(h.get('saved')[0].name, 'Saved study');
  assert.match(h.node('storage-warning-text').textContent, /Level not saved/);
  assert.equal(h.node('storage-warning').hidden, false);
  h.localStorage.failWrite = false;
  assert.equal(h.run('persistLibrary(replacement)'), true);
  assert.equal(h.node('storage-warning').hidden, true);
  assert.equal(JSON.parse(h.data.get(STORE))[0].name, 'Not saved yet');
});

test('draft quota failures keep one persistent warning without generating repeated toast timers', () => {
  const h = harness();
  h.run('loadStorage()'); h.localStorage.failWrite = true;
  h.run('storeDraft(); storeDraft(); storeDraft()');
  assert.equal(h.node('storage-warning').hidden, false);
  assert.match(h.node('storage-warning-text').textContent, /Draft recovery could not be saved.*export/);
  assert.equal(h.node('notice').textContent, '', 'typing does not emit repeated disappearing notices');
  assert.equal(h.data.has(RECOVERY), false);
  h.localStorage.failWrite = false; h.run('storeDraft()');
  assert.equal(h.node('storage-warning').hidden, true);
  assert.equal(JSON.parse(h.data.get(RECOVERY)).name, 'Four-color study');
});

test('a changed library in another tab is never clobbered by a stale save or reset', () => {
  const h = harness([[STORE, JSON.stringify([level])]]);
  h.run('loadStorage()');
  const newer = JSON.stringify([{ ...level, name: 'Other tab latest' }]);
  h.data.set(STORE, newer); h.context.replacement = [{ ...level, name: 'Stale tab' }];
  assert.equal(h.run('persistLibrary(replacement)'), false);
  assert.equal(h.data.get(STORE), newer);
  assert.match(h.node('storage-warning-text').textContent, /another tab.*Reload/);
  h.run('downloadOriginalLibrary()'); h.window.confirmed = true;
  assert.equal(h.run('resetProtectedLibrary()'), false, 'a valid concurrent library is not a reset candidate');
  assert.equal(h.data.get(STORE), newer);
});

test('another-tab changes between backup and reset also leave the newer data untouched', () => {
  const h = harness([[STORE, '{ damaged']]);
  h.run('loadStorage(); downloadOriginalLibrary()'); h.window.confirmed = true;
  const newer = JSON.stringify([level]); h.data.set(STORE, newer);
  assert.equal(h.run('resetProtectedLibrary()'), false);
  assert.equal(h.data.get(STORE), newer);
  assert.match(h.node('storage-warning-text').textContent, /another tab/);
});

test('a normal stored library loads and a successful save updates storage and memory', () => {
  const h = harness([[STORE, JSON.stringify([level])]]);
  h.run('loadStorage()');
  assert.equal(h.get('saved')[0].name, 'Saved study');
  h.context.replacement = [{ ...level, name: 'Revised study' }];
  assert.equal(h.run('persistLibrary(replacement)'), true);
  assert.equal(JSON.parse(h.data.get(STORE))[0].name, 'Revised study');
  assert.equal(h.get('saved')[0].name, 'Revised study');
});
