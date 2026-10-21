import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLevel, parsePortable, packLevel, encodeShare, decodeShare } from '../dist/portable.js';

const level = { capacity: 3, bottles: [[0, 1, 2], [1, 2, 0], [2, 0, 1], [], []] };
test('JSON export/import and shared hash preserve a novel level and literal hostile name', () => {
  const name = '<img src=x onerror=alert(1)> 🧪';
  const packed = packLevel(level, name);
  assert.deepEqual(parsePortable(JSON.stringify(packed)).levels[0], { name, ...level });
  assert.deepEqual(decodeShare(encodeShare(level, name)), { name, ...level });
  assert.deepEqual(parsePortable(JSON.stringify(level)).levels[0], { name: 'Imported study', ...level });
  assert.deepEqual(decodeShare('#other'), null);
});
test('library import preserves drafts and rejects malformed, oversized or unsupported input atomically', () => {
  const levels = [{ name: 'Draft', capacity: 2, bottles: [[0], []] }, { name: 'Complete', ...level }];
  assert.deepEqual(parsePortable(JSON.stringify({ format: 'pourlab-library', version: 1, levels })).levels, levels);
  for (const raw of ['no json', '[]', 'null', '{"capacity":2,"bottles":[[],[]],"__proto__":{}}', JSON.stringify({ ...level, name: 'x'.repeat(61) }), JSON.stringify({ ...level, name: '\u0000' }), JSON.stringify({ ...level, version: 2 }), JSON.stringify({ ...level, bottles: [[8], []] }), JSON.stringify({ format: 'pourlab-library', version: 1, levels: [] }), ' '.repeat(300001)]) assert.throws(() => parsePortable(raw));
  assert.throws(() => decodeShare('#level=%ZZ'));
  assert.throws(() => decodeShare('#level=' + 'x'.repeat(10001)));
  assert.throws(() => normalizeLevel({ ...level, capacity: '3' }));
});
