/** Pure water-sort rules and bounded exact search. Bottle arrays run bottom to top. */
export const LIMITS = Object.freeze({ minCapacity: 2, maxCapacity: 6, minBottles: 2, maxBottles: 12, maxColors: 8 });
export const clone = level => ({ capacity: level.capacity, bottles: level.bottles.map(b => b.slice()) });

export function validateLevel(input, { inventory = true } = {}) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { valid: false, errors: ['A level must be a JSON object.'], counts: [] };
  const { capacity, bottles } = input;
  if (!Number.isInteger(capacity) || capacity < 2 || capacity > 6) errors.push('Capacity must be an integer from 2 to 6.');
  if (!Array.isArray(bottles) || bottles.length < 2 || bottles.length > 12) errors.push('Use between 2 and 12 bottles.');
  const counts = Array(8).fill(0);
  if (Array.isArray(bottles)) bottles.forEach((b, i) => {
    if (!Array.isArray(b)) { errors.push(`Bottle ${i + 1} must be an array.`); return; }
    if (b.length > capacity) errors.push(`Bottle ${i + 1} exceeds capacity ${capacity}.`);
    b.forEach(c => { if (!Number.isInteger(c) || c < 0 || c > 7) errors.push(`Bottle ${i + 1}: colors must be integers from 0 to 7.`); else counts[c]++; });
  });
  if (inventory && Number.isInteger(capacity) && capacity >= 2 && capacity <= 6) {
    if (!counts.some(Boolean)) errors.push('Add at least one color before playing or solving.');
    counts.forEach((n, c) => { if (n % capacity !== 0) errors.push(`Color ${c + 1} has ${n} units; use a multiple of ${capacity}.`); });
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)], counts };
}

export function isSolved(level) {
  return level.bottles.every(b => !b.length || (b.length === level.capacity && b.every(c => c === b[0])));
}

export function pourAmount(level, from, to) {
  const bottles = level.bottles;
  if (!Number.isInteger(from) || !Number.isInteger(to) || from === to || !bottles[from] || !bottles[to]) return 0;
  const a = bottles[from], b = bottles[to];
  if (!a.length || b.length >= level.capacity || (b.length && b.at(-1) !== a.at(-1))) return 0;
  let run = 1;
  while (run < a.length && a[a.length - 1 - run] === a.at(-1)) run++;
  return Math.min(run, level.capacity - b.length);
}

export function applyMove(level, from, to) {
  const amount = pourAmount(level, from, to);
  if (!amount) return null;
  const next = clone(level), color = next.bottles[from].at(-1);
  next.bottles[from].splice(-amount);
  next.bottles[to].push(...Array(amount).fill(color));
  return { level: next, move: { from, to, amount, color } };
}

export function replay(level, moves) {
  let current = clone(level);
  const frames = [current];
  for (const [i, move] of moves.entries()) {
    const result = applyMove(current, move.from, move.to);
    if (!result || result.move.amount !== move.amount || result.move.color !== move.color) throw new Error(`Illegal move at step ${i + 1}.`);
    current = result.level; frames.push(current);
  }
  if (!isSolved(current)) throw new Error('The replay does not end in a solved level.');
  return frames;
}

export const stateKey = level => level.bottles.map(b => b.join('')).sort().join('|');
export function heuristic(level) {
  let segments = 0, units = 0;
  for (const b of level.bottles) { units += b.length; b.forEach((c, i) => { if (!i || c !== b[i - 1]) segments++; }); }
  return Math.max(0, segments - units / level.capacity);
}

class Heap {
  constructor() { this.data = []; }
  push(value) {
    const a = this.data; a.push(value); let i = a.length - 1;
    while (i) { const p = (i - 1) >> 1; if (a[p].f <= value.f) break; a[i] = a[p]; i = p; } a[i] = value;
  }
  pop() {
    const a = this.data, first = a[0], last = a.pop();
    if (a.length) { let i = 0; while (i * 2 + 1 < a.length) { let c = i * 2 + 1; if (c + 1 < a.length && a[c + 1].f < a[c].f) c++; if (a[c].f >= last.f) break; a[i] = a[c]; i = c; } a[i] = last; }
    return first;
  }
  get length() { return this.data.length; }
}

/** Exact shortest-path search; all budgets apply to a single invocation. */
export function solve(input, options = {}, onProgress = () => {}) {
  const validation = validateLevel(input);
  if (!validation.valid) return { status: 'invalid', errors: validation.errors, moves: [] };
  const algorithm = options.algorithm === 'bfs' ? 'bfs' : 'astar';
  const budget = {
    maxStates: Math.max(1, Math.min(200000, Number(options.maxStates) || 80000)),
    maxMs: Math.max(1, Math.min(15000, Number(options.maxMs) || 5000)),
    maxDepth: Math.max(0, Math.min(200, Number.isFinite(Number(options.maxDepth)) ? Number(options.maxDepth) : 100))
  };
  const startTime = performance.now();
  const start = clone(input), nodes = [{ level: start, parent: -1, move: null, depth: 0 }];
  const best = new Map([[stateKey(start), 0]]), heap = new Heap(), queue = [0];
  heap.push({ id: 0, f: heuristic(start) });
  let cursor = 0, expanded = 0, depthCut = false, peakFrontier = 1, lastProgress = startTime;
  const stats = () => ({ algorithm, visited: best.size, expanded, elapsedMs: Math.round(performance.now() - startTime), peakFrontier, budgets: budget });
  const finish = (status, reason, moves = []) => ({ status, reason, moves, ...stats() });
  while (algorithm === 'bfs' ? cursor < queue.length : heap.length) {
    if (performance.now() - startTime >= budget.maxMs) return finish('exhausted', 'time');
    const id = algorithm === 'bfs' ? queue[cursor++] : heap.pop().id;
    const node = nodes[id];
    if (node.depth !== best.get(stateKey(node.level))) continue;
    if (isSolved(node.level)) {
      const moves = []; for (let n = id; nodes[n].parent !== -1; n = nodes[n].parent) moves.push(nodes[n].move);
      moves.reverse(); replay(start, moves);
      return finish('solved', null, moves);
    }
    expanded++;
    for (let from = 0; from < node.level.bottles.length; from++) for (let to = 0; to < node.level.bottles.length; to++) {
      const result = applyMove(node.level, from, to); if (!result) continue;
      const key = stateKey(result.level), depth = node.depth + 1;
      if (best.has(key) && best.get(key) <= depth) continue;
      if (depth > budget.maxDepth) { depthCut = true; continue; }
      if (best.size >= budget.maxStates && !best.has(key)) return finish('exhausted', 'states');
      best.set(key, depth);
      const child = nodes.length; nodes.push({ level: result.level, parent: id, move: result.move, depth });
      if (algorithm === 'bfs') queue.push(child); else heap.push({ id: child, f: depth + heuristic(result.level) });
    }
    peakFrontier = Math.max(peakFrontier, algorithm === 'bfs' ? queue.length - cursor : heap.length);
    const now = performance.now();
    if (now - lastProgress > 150) { onProgress(stats()); lastProgress = now; }
  }
  return finish(depthCut ? 'exhausted' : 'unsolvable', depthCut ? 'depth' : 'complete');
}

export function generateLevel(seed, colors = 4, capacity = 4, empty = 2) {
  colors = Math.max(2, Math.min(8, Math.trunc(colors)));
  capacity = Math.max(2, Math.min(6, Math.trunc(capacity)));
  empty = Math.max(0, Math.min(12 - colors, Math.trunc(empty)));
  let h = 2166136261;
  for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const random = () => { h += 0x6D2B79F5; let t = Math.imul(h ^ h >>> 15, 1 | h); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const units = Array.from({ length: colors * capacity }, (_, i) => Math.floor(i / capacity));
  for (let i = units.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [units[i], units[j]] = [units[j], units[i]]; }
  return { capacity, bottles: [...Array.from({ length: colors }, (_, i) => units.slice(i * capacity, (i + 1) * capacity)), ...Array.from({ length: empty }, () => [])] };
}
