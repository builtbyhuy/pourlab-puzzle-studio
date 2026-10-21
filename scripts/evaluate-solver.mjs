import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { solve } from '../dist/solver.js';
import { checkPath, labeledBfs, checkReference } from './solver-oracle.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = new Set(process.argv.slice(2));
for (const arg of args) assert.ok(['--check', '--write-report'].includes(arg), `Unknown argument: ${arg}`);
assert.ok(!(args.has('--check') && args.has('--write-report')), 'Choose a check or a measured report.');
const checking = args.has('--check'), repeats = checking ? 1 : 5, warmups = checking ? 0 : 1;
const corpusPath = 'evaluation/solver-corpus.json';
const read = relative => fs.readFileSync(path.join(root, relative));
const sha = relative => crypto.createHash('sha256').update(read(relative)).digest('hex');
const corpus = JSON.parse(read(corpusPath));
assert.equal(corpus.version, 1);
assert.ok(corpus.cases.length > 0);
assert.equal(new Set(corpus.cases.map(entry => entry.id)).size, corpus.cases.length, 'case IDs must be unique');
checkReference();

const signature = result => ({ status: result.status, reason: result.reason ?? null,
  moves: result.status === 'solved' ? result.moves.length : null,
  visited: result.visited ?? null, expanded: result.expanded ?? null, peakFrontier: result.peakFrontier ?? null });
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const rows = [], oracleCache = new Map();
const allStarted = performance.now();
for (const entry of corpus.cases) {
  const before = JSON.stringify(entry.level), options = { ...corpus.budgets, ...entry.budgets };
  let oracle = null;
  if (entry.oracle) {
    if (!oracleCache.has(before)) oracleCache.set(before, labeledBfs(entry.level, corpus.oracleMaxStates));
    oracle = oracleCache.get(before);
    assert.notEqual(oracle.status, 'exhausted', `${entry.id}: independent oracle did not complete`);
  }
  const algorithms = {};
  for (const algorithm of ['astar', 'bfs']) {
    for (let i = 0; i < warmups; i++) solve(entry.level, { ...options, algorithm });
    const samples = [];
    let reference = null;
    for (let i = 0; i < repeats; i++) {
      const start = performance.now();
      const result = solve(entry.level, { ...options, algorithm });
      samples.push(performance.now() - start);
      assert.ok(['solved', 'unsolvable', 'exhausted', 'invalid'].includes(result.status), `${entry.id}/${algorithm}: unknown result status`);
      assert.notEqual(result.reason, 'time', `${entry.id}/${algorithm}: machine hit the time safety ceiling; no comparable measurement`);
      if (result.status === 'invalid') assert.equal(entry.expected?.status, 'invalid', `${entry.id}/${algorithm}: a valid corpus layout was rejected`);
      if (result.visited !== undefined) assert.ok(result.visited <= options.maxStates, `${entry.id}/${algorithm}: state ceiling exceeded`);
      const actual = signature(result);
      if (reference) assert.deepEqual(actual, reference, `${entry.id}/${algorithm}: nondeterministic logical result`);
      reference = actual;
      assert.equal(JSON.stringify(entry.level), before, `${entry.id}/${algorithm}: input mutated`);
      if (entry.expected) {
        assert.equal(result.status, entry.expected.status, `${entry.id}/${algorithm}: expected status`);
        if (entry.expected.reason) assert.equal(result.reason, entry.expected.reason, `${entry.id}/${algorithm}: expected limit`);
        if (entry.expected.distance !== undefined) assert.equal(result.moves.length, entry.expected.distance, `${entry.id}/${algorithm}: known optimum`);
      }
      if (result.status === 'solved') {
        checkPath(entry.level, result.moves);
        if (oracle) { assert.equal(oracle.status, 'solved'); assert.equal(result.moves.length, oracle.distance, `${entry.id}/${algorithm}: oracle optimum`); }
      } else {
        assert.deepEqual(result.moves, [], `${entry.id}/${algorithm}: unresolved/invalid run must not expose a path`);
        if (result.status === 'unsolvable' && oracle) assert.equal(oracle.status, 'unsolvable');
        if (result.status === 'invalid') assert.ok(result.errors?.length);
      }
    }
    algorithms[algorithm] = { ...reference, budgets: options,
      runtimeMs: { median: median(samples), min: Math.min(...samples), max: Math.max(...samples), samples } };
  }
  const { astar, bfs } = algorithms;
  if (['solved', 'unsolvable'].includes(astar.status) && ['solved', 'unsolvable'].includes(bfs.status)) {
    assert.equal(astar.status, bfs.status, `${entry.id}: complete solver statuses disagree`);
    assert.equal(astar.moves, bfs.moves, `${entry.id}: complete solver optimum lengths disagree`);
  }
  rows.push({ id: entry.id, group: entry.group, seed: entry.seed ?? null, capacity: entry.level.capacity,
    bottles: entry.level.bottles.length, oracle, ...algorithms });
}

let baseCommit = null;
try { baseCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* A source archive still has exact source hashes. */ }
const countStatuses = algorithm => Object.fromEntries(['solved', 'unsolvable', 'exhausted', 'invalid'].map(status => [status, rows.filter(row => row[algorithm].status === status).length]));
const completePairs = rows.filter(row => ['solved', 'unsolvable'].includes(row.astar.status) && ['solved', 'unsolvable'].includes(row.bfs.status));
const report = {
  format: 'pourlab-solver-evaluation', version: 1, measuredAt: new Date().toISOString(),
  source: { baseCommit, solverSha256: sha('dist/solver.js'), corpusSha256: sha(corpusPath),
    evaluatorSha256: sha('scripts/evaluate-solver.mjs'), oracleSha256: sha('scripts/solver-oracle.mjs') },
  environment: { node: process.version, platform: process.platform, osRelease: os.release(), architecture: process.arch,
    cpu: os.cpus()[0]?.model ?? 'unknown', logicalCpus: os.availableParallelism?.() ?? os.cpus().length },
  method: { repeats, warmupsPerCaseAndAlgorithm: warmups, oracleMaxStates: corpus.oracleMaxStates,
    timing: 'performance.now around synchronous production solve only; independent path/oracle verification excluded; no worker, DOM or browser rendering',
    order: 'fixed corpus order; A* then BFS for each case; fixed order and JIT/GC affect timings; no performance threshold' },
  summary: { cases: rows.length, uniqueLevels: new Set(corpus.cases.map(entry => JSON.stringify(entry.level))).size,
    oracleCases: rows.filter(row => row.oracle).length, uniqueOracleLevels: oracleCache.size,
    algorithmCasePairs: rows.length * 2, completeAgreementCases: completePairs.length,
    independentlyReplayedSolvedPairs: rows.reduce((sum, row) => sum + ['astar', 'bfs'].filter(algorithm => row[algorithm].status === 'solved').length, 0),
    astar: countStatuses('astar'), bfs: countStatuses('bfs'), evaluationElapsedMs: performance.now() - allStarted }, rows
};

const number = value => value === null ? '—' : String(value);
const milliseconds = value => value.toFixed(3);
const label = result => result.status === 'solved' ? `${result.moves} pours` : result.reason ? `${result.status}/${result.reason}` : result.status;
function markdown() {
  const bounded = rows.find(row => row.id === 'matrix-c6-k4-fixed-a');
  const extended = rows.find(row => row.id === 'same-layout-larger-state-budget');
  return `# Exact search under bounded budgets

Measured ${report.measuredAt}. Synthetic engineering evaluation; no player study, human-difficulty score, customer use or production-performance claim.

## Reproduce

Node 18 or newer; no installation or dependencies. From the repository root:

\`\`\`sh
node scripts/evaluate-solver.mjs --check
node scripts/evaluate-solver.mjs --write-report
\`\`\`

The first command checks correctness without writing artifacts (CI uses it). The second overwrites this measured report and [raw measurements](evidence/solver-evaluation.json) on the current machine. Plain \`node scripts/evaluate-solver.mjs\` measures without writing. Runtime values are observations, not pass/fail requirements.

## Corpus and reference

[Frozen corpus](../evaluation/solver-corpus.json): ${report.summary.cases} case configurations, ${report.summary.uniqueLevels} distinct input layouts. It includes the full 5 capacities × 3 color counts × 2 seeds matrix (capacities 2–6, colors 2–4, two empty bottles), hand-specified solved/trapped/known-optimum cases, an invalid draft, state/depth-limited repetitions, and one larger-budget repetition. Layouts are stored explicitly: the evaluator does not silently regenerate them with the production generator. The matrix and named boundary cases were defined before the measured report; they are not a random market/player sample or comprehensive search coverage.

Both production A* and production BFS run all ${report.summary.cases} cases. A separate evaluation-only labeled-bottle BFS independently enumerates ${report.summary.oracleCases} configurations (${report.summary.uniqueOracleLevels} distinct layouts) without importing production moves, symmetry reduction, goals or heuristics. Its ${corpus.oracleMaxStates.toLocaleString('en-US')}-state ceiling must not be reached on those selected small cases. Every solved production path is independently checked for legality, maximal pours, reported color/amount, inventory preservation and solved completion; the input must remain unchanged.

On cases where both production searches complete exactly, their status and optimum length must agree. Independent oracle optimality is checked only for oracle-marked cases. Agreement between two production algorithms on the remaining cases is useful but is not independent proof against a shared production-rule bug. Solved, proven-unsolvable, budget-exhausted and invalid remain separate outcomes. A time-ceiling hit fails this evaluation rather than being presented as a comparable deterministic result.

## Observed result

- ${report.summary.algorithmCasePairs} algorithm/case pairs; ${report.summary.independentlyReplayedSolvedPairs} solved pairs passed independent path checks.
- ${report.summary.completeAgreementCases} case configurations completed under both production algorithms; all agreed on status and optimum length.
- A*: ${JSON.stringify(report.summary.astar)}.
- BFS: ${JSON.stringify(report.summary.bfs)}.

### Why the budget is part of the answer

For \`matrix-c6-k4-fixed-a\`, A* returned ${bounded.astar.moves} checked pours using ${bounded.astar.visited} canonical visited states; BFS stopped at ${bounded.bfs.visited} states and returned \`${bounded.bfs.status}/${bounded.bfs.reason}\`. That budget outcome cannot mean the layout is unsolvable: the A* witness is directly replayable. Rerunning the **same input** with 20,000 states lets BFS complete with ${extended.bfs.moves} pours and ${extended.bfs.visited} visited states; the two exact lengths agree. This is a concrete reason to retain explicit limits and the UI's “solvability is still unknown” state.

The A* heuristic reduces state work on this case, but a state count is not milliseconds or memory bytes. ${repeats} measured repetitions per algorithm follow ${warmups} unrecorded warm-up per case/algorithm. The timed section wraps synchronous \`solve\`; independent validation is outside it. The fixed A*→BFS order, JIT compilation, garbage collection and machine load affect sub-millisecond results. No universal speedup or user-perceived latency conclusion follows. This does not measure worker startup, message transfer, rendering, mobile battery cost or cancellation latency.

## All measured cases

“Visited” counts production canonical keys; “frontier” is the production peak queued-entry count, **not measured bytes**. Each runtime is the median in milliseconds; all raw repetitions and bounds are in JSON. Oracle ✓ means exact status/optimum independently checked for complete runs (limited runs retain a reference answer without claiming their own completion).

| Case | Capacity / bottles | A* outcome | BFS outcome | A* / BFS visited | A* / BFS peak frontier | A* / BFS median ms | Oracle |
|---|---|---|---|---|---|---|---|
${rows.map(row => `| ${row.id} | ${row.capacity} / ${row.bottles} | ${label(row.astar)} | ${label(row.bfs)} | ${number(row.astar.visited)} / ${number(row.bfs.visited)} | ${number(row.astar.peakFrontier)} / ${number(row.bfs.peakFrontier)} | ${milliseconds(row.astar.runtimeMs.median)} / ${milliseconds(row.bfs.runtimeMs.median)} | ${row.oracle ? '✓' : '—'} |`).join('\n')}

## Environment and provenance

- Node ${report.environment.node}; ${report.environment.platform} ${report.environment.osRelease}; ${report.environment.architecture}; ${report.environment.cpu}; ${report.environment.logicalCpus} available logical CPUs. No concurrency is used.
- Git base at measurement: \`${baseCommit ?? 'unavailable'}\`. New evaluation artifacts may be uncommitted; the exact solver/corpus/evaluator/oracle SHA-256 values in JSON identify the measured files rather than implying that this base commit already contains the report.
- Solver SHA-256: \`${report.source.solverSha256}\`.
- Corpus SHA-256: \`${report.source.corpusSha256}\`.

This internal Codex-assisted measurement covers a finite corpus. It does not prove correctness for every accepted layout. Production state symmetry and the heuristic still depend on their stated rule assumptions. Larger corpora, real-browser worker measurements and consented task feedback answer different questions.
`;
}

if (args.has('--write-report')) {
  fs.mkdirSync(path.join(root, 'docs/evidence'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/evidence/solver-evaluation.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'docs/SOLVER-EVALUATION.md'), markdown());
}
console.log(JSON.stringify({ mode: checking ? 'check' : 'measurement', ...report.summary, artifactWritten: args.has('--write-report') }, null, 2));
