// Evaluation-only reference. Deliberately imports no production solver code.
// Bottle labels remain distinct: no symmetry reduction, heuristic or A* heap.
import assert from 'node:assert/strict';

const copy = bottles => bottles.map(bottle => [...bottle]);
const finished = (bottles, capacity) => bottles.every(bottle =>
  bottle.length === 0 || bottle.length === capacity && new Set(bottle).size === 1);
const inventory = bottles => {
  const counts = Array(8).fill(0);
  for (const bottle of bottles) for (const color of bottle) counts[color]++;
  return counts;
};

function transition(bottles, capacity, from, to) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= bottles.length || to >= bottles.length || from === to) return null;
  const source = bottles[from], target = bottles[to];
  if (!source.length || target.length === capacity) return null;
  const color = source[source.length - 1];
  if (target.length && target[target.length - 1] !== color) return null;
  const next = copy(bottles);
  let amount = 0;
  while (next[from].length && next[from][next[from].length - 1] === color && next[to].length < capacity) {
    next[to].push(next[from].pop()); amount++;
  }
  return { bottles: next, amount, color };
}

export function checkPath(level, moves) {
  assert.ok(Array.isArray(moves), 'the path must be an array');
  let bottles = copy(level.bottles);
  const originalCounts = inventory(bottles);
  for (const [index, move] of moves.entries()) {
    const next = transition(bottles, level.capacity, move.from, move.to);
    assert.ok(next, `illegal move at index ${index}`);
    assert.equal(move.amount, next.amount, `non-maximal or incorrect pour at index ${index}`);
    assert.equal(move.color, next.color, `wrong color at index ${index}`);
    bottles = next.bottles;
    assert.deepEqual(inventory(bottles), originalCounts, `inventory changed at index ${index}`);
    assert.ok(bottles.every(bottle => bottle.length <= level.capacity));
  }
  assert.ok(finished(bottles, level.capacity), 'the path must reach a solved arrangement');
  return true;
}

export function labeledBfs(level, maxStates = 50000) {
  const start = copy(level.bottles), queue = [{ bottles: start, distance: 0 }];
  const seen = new Set([JSON.stringify(start)]);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const { bottles, distance } = queue[cursor];
    if (finished(bottles, level.capacity)) return { status: 'solved', distance, visited: seen.size };
    for (let from = 0; from < bottles.length; from++) for (let to = 0; to < bottles.length; to++) {
      const next = transition(bottles, level.capacity, from, to);
      if (!next) continue;
      const key = JSON.stringify(next.bottles);
      if (seen.has(key)) continue;
      if (seen.size >= maxStates) return { status: 'exhausted', distance: null, visited: seen.size };
      seen.add(key); queue.push({ bottles: next.bottles, distance: distance + 1 });
    }
  }
  return { status: 'unsolvable', distance: null, visited: seen.size };
}

export function checkReference() {
  const crossed = { capacity: 2, bottles: [[0, 1], [1, 0], [], []] };
  const witness = [{ from: 0, to: 2, amount: 1, color: 1 }, { from: 1, to: 0, amount: 1, color: 0 }, { from: 1, to: 2, amount: 1, color: 1 }];
  assert.equal(labeledBfs(crossed).distance, 3);
  assert.equal(labeledBfs({ capacity: 2, bottles: [[0, 1], [1, 0]] }).status, 'unsolvable');
  assert.equal(labeledBfs({ capacity: 2, bottles: [[0, 0], []] }).distance, 0);
  checkPath(crossed, witness);
  assert.throws(() => checkPath(crossed, []), /solved/);
  assert.throws(() => checkPath(crossed, [{ ...witness[0], to: 1 }]), /illegal/);
  assert.throws(() => checkPath(crossed, [{ ...witness[0], amount: 2 }]), /pour/);
  assert.throws(() => checkPath(crossed, [{ ...witness[0], color: 0 }]), /color/);
}
