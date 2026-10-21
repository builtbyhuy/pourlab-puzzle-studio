import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLevel, isSolved, clone, pourAmount, applyMove, solve, replay, generateLevel, stateKey, heuristic } from '../dist/solver.js';

// Independent labeled-bottle BFS: no canonicalization, production transition or heuristic.
function oracle(level) {
  const start = level.bottles.map(b => b.slice()), queue = [[start, 0]], seen = new Set([JSON.stringify(start)]);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const [bottles, depth] = queue[cursor];
    if (bottles.every(b => !b.length || b.length === level.capacity && new Set(b).size === 1)) return depth;
    for (let a = 0; a < bottles.length; a++) for (let b = 0; b < bottles.length; b++) {
      if (a === b || !bottles[a].length || bottles[b].length === level.capacity) continue;
      const color = bottles[a][bottles[a].length - 1];
      if (bottles[b].length && bottles[b][bottles[b].length - 1] !== color) continue;
      const next = bottles.map(x => x.slice());
      while (next[a].length && next[a][next[a].length - 1] === color && next[b].length < level.capacity) next[b].push(next[a].pop());
      const key = JSON.stringify(next);
      if (!seen.has(key)) { seen.add(key); queue.push([next, depth + 1]); }
    }
  }
  return null;
}

test('known optimum, solved input, trapped state, and legal replay', () => {
  const level = { capacity: 2, bottles: [[0, 1], [1, 0], [], []] };
  for (const algorithm of ['bfs', 'astar']) {
    const result = solve(level, { algorithm });
    assert.equal(result.status, 'solved'); assert.equal(result.moves.length, 3);
    assert(isSolved(replay(level, result.moves).at(-1)));
    assert.equal(solve({ capacity: 2, bottles: [[0, 0], []] }, { algorithm }).moves.length, 0);
    assert.equal(solve({ capacity: 2, bottles: [[0, 1], [1, 0]] }, { algorithm }).status, 'unsolvable');
  }
  assert.throws(() => replay(level, [{ from: 0, to: 1, amount: 1, color: 1 }]), /Illegal/);
  assert.throws(() => replay(level, []), /does not end/);
});

test('validation bounds, repeated-color inventory and draft distinction', () => {
  assert(validateLevel({ capacity: 2, bottles: [[0, 0], [0, 0]] }).valid);
  assert(!validateLevel({ capacity: 2, bottles: [[0], []] }).valid);
  assert(validateLevel({ capacity: 2, bottles: [[0], []] }, { inventory: false }).valid);
  for (const bad of [null, [], { capacity: 1, bottles: [[], []] }, { capacity: 7, bottles: [[], []] }, { capacity: 2, bottles: [[8, 8], []] }, { capacity: 2, bottles: [[0, 0, 0], []] }, { capacity: 2, bottles: [[]] }, { capacity: 2, bottles: Array.from({ length: 13 }, () => []) }, { capacity: 2, bottles: ['bad', []] }]) assert(!validateLevel(bad).valid);
});

test('maximal pour respects a run, target space, top color and immutability', () => {
  const level = { capacity: 4, bottles: [[1, 0, 0, 0], [2, 2, 0], []] }, before = JSON.stringify(level);
  assert.equal(pourAmount(level, 0, 1), 1);
  const next = applyMove(level, 0, 2);
  assert.deepEqual(next.level.bottles, [[1], [2, 2, 0], [0, 0, 0]]);
  assert.equal(JSON.stringify(level), before);
  assert.equal(applyMove(level, 0, 0), null); assert.equal(pourAmount(level, 5, 0), 0);
  assert.equal(pourAmount({ capacity: 2, bottles: [[0], [1]] }, 0, 1), 0);
});

test('state, depth and time limits remain unresolved, never unsolvable', () => {
  const level = { capacity: 3, bottles: [[0, 1, 2], [1, 2, 0], [2, 0, 1], [], []] };
  assert.equal(solve(level, { maxStates: 1 }).reason, 'states');
  assert.equal(solve(level, { maxDepth: 0 }).reason, 'depth');
  for (const budget of [{ maxStates: 1 }, { maxDepth: 0 }]) assert.equal(solve(level, budget).status, 'exhausted');
  const big = generateLevel('bounded-search', 8, 6, 2);
  const timed = solve(big, { maxMs: 1, maxStates: 200000 });
  assert.equal(timed.status, 'exhausted'); assert.equal(timed.reason, 'time');
});

test('A* and canonical BFS agree with independent labeled BFS on exhaustive small arrangements', () => {
  const arrangements = new Map();
  function fill(bottles, remaining) {
    if (!remaining.length) { const key = JSON.stringify(bottles); arrangements.set(key, { capacity: 2, bottles }); return; }
    for (const color of new Set(remaining)) {
      const rest = remaining.slice(); rest.splice(rest.indexOf(color), 1);
      for (let b = 0; b < 4; b++) if (bottles[b].length < 2) {
        const next = bottles.map(x => x.slice()); next[b].push(color); fill(next, rest);
      }
    }
  }
  fill([[], [], [], []], [0, 0, 1, 1]);
  assert(arrangements.size > 50);
  for (const level of arrangements.values()) {
    const expected = oracle(level);
    for (const algorithm of ['bfs', 'astar']) {
      const answer = solve(level, { algorithm, maxStates: 50000 });
      assert.equal(answer.status, expected === null ? 'unsolvable' : 'solved');
      if (expected !== null) { assert.equal(answer.moves.length, expected); replay(level, answer.moves); assert(heuristic(level) <= expected); }
    }
  }
});

test('seeded novel levels preserve inventory and match the labeled oracle', () => {
  for (let seed = 0; seed < 16; seed++) {
    const level = generateLevel(`property-${seed}`, 3, 3, 2), before = clone(level), expected = oracle(level);
    assert(validateLevel(level).valid);
    assert.deepEqual(generateLevel(`property-${seed}`, 3, 3, 2), level);
    for (const algorithm of ['astar', 'bfs']) {
      const result = solve(level, { algorithm, maxStates: 100000 });
      assert.equal(result.status, expected === null ? 'unsolvable' : 'solved');
      if (result.status === 'solved') {
        assert.equal(result.moves.length, expected);
        const frames = replay(level, result.moves), counts = x => validateLevel(x).counts;
        for (const frame of frames) assert.deepEqual(counts(frame), counts(level));
      }
    }
    assert.deepEqual(level, before);
    assert.equal(stateKey(level), stateKey({ ...level, bottles: [...level.bottles].reverse() }));
  }
});
