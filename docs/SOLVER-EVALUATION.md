# Exact search under bounded budgets

Measured 2026-10-21T09:02:33.984Z. Synthetic engineering evaluation; no player study, human-difficulty score, customer use or production-performance claim.

## Reproduce

Node 18 or newer; no installation or dependencies. From the repository root:

```sh
node scripts/evaluate-solver.mjs --check
node scripts/evaluate-solver.mjs --write-report
```

The first command checks correctness without writing artifacts (CI uses it). The second overwrites this measured report and [raw measurements](evidence/solver-evaluation.json) on the current machine. Plain `node scripts/evaluate-solver.mjs` measures without writing. Runtime values are observations, not pass/fail requirements.

## Corpus and reference

[Frozen corpus](../evaluation/solver-corpus.json): 40 case configurations, 34 distinct input layouts. It includes the full 5 capacities × 3 color counts × 2 seeds matrix (capacities 2–6, colors 2–4, two empty bottles), hand-specified solved/trapped/known-optimum cases, an invalid draft, state/depth-limited repetitions, and one larger-budget repetition. Layouts are stored explicitly: the evaluator does not silently regenerate them with the production generator. The matrix and named boundary cases were defined before the measured report; they are not a random market/player sample or comprehensive search coverage.

Both production A* and production BFS run all 40 cases. A separate evaluation-only labeled-bottle BFS independently enumerates 16 configurations (11 distinct layouts) without importing production moves, symmetry reduction, goals or heuristics. Its 50,000-state ceiling must not be reached on those selected small cases. Every solved production path is independently checked for legality, maximal pours, reported color/amount, inventory preservation and solved completion; the input must remain unchanged.

On cases where both production searches complete exactly, their status and optimum length must agree. Independent oracle optimality is checked only for oracle-marked cases. Agreement between two production algorithms on the remaining cases is useful but is not independent proof against a shared production-rule bug. Solved, proven-unsolvable, budget-exhausted and invalid remain separate outcomes. A time-ceiling hit fails this evaluation rather than being presented as a comparable deterministic result.

## Observed result

- 80 algorithm/case pairs; 69 solved pairs passed independent path checks.
- 36 case configurations completed under both production algorithms; all agreed on status and optimum length.
- A*: {"solved":35,"unsolvable":2,"exhausted":2,"invalid":1}.
- BFS: {"solved":34,"unsolvable":2,"exhausted":3,"invalid":1}.

### Why the budget is part of the answer

For `matrix-c6-k4-fixed-a`, A* returned 18 checked pours using 479 canonical visited states; BFS stopped at 3000 states and returned `exhausted/states`. That budget outcome cannot mean the layout is unsolvable: the A* witness is directly replayable. Rerunning the **same input** with 20,000 states lets BFS complete with 18 pours and 3513 visited states; the two exact lengths agree. This is a concrete reason to retain explicit limits and the UI's “solvability is still unknown” state.

The A* heuristic reduces state work on this case, but a state count is not milliseconds or memory bytes. 5 measured repetitions per algorithm follow 1 unrecorded warm-up per case/algorithm. The timed section wraps synchronous `solve`; independent validation is outside it. The fixed A*→BFS order, JIT compilation, garbage collection and machine load affect sub-millisecond results. No universal speedup or user-perceived latency conclusion follows. This does not measure worker startup, message transfer, rendering, mobile battery cost or cancellation latency.

## All measured cases

“Visited” counts production canonical keys; “frontier” is the production peak queued-entry count, **not measured bytes**. Each runtime is the median in milliseconds; all raw repetitions and bounds are in JSON. Oracle ✓ means exact status/optimum independently checked for complete runs (limited runs retain a reference answer without claiming their own completion).

| Case | Capacity / bottles | A* outcome | BFS outcome | A* / BFS visited | A* / BFS peak frontier | A* / BFS median ms | Oracle |
|---|---|---|---|---|---|---|---|
| already-solved | 4 / 3 | 0 pours | 0 pours | 1 / 1 | 1 / 1 | 0.053 / 0.032 | ✓ |
| repeated-full-color | 2 / 3 | 0 pours | 0 pours | 1 / 1 | 1 / 1 | 0.024 / 0.009 | ✓ |
| trapped-capacity-two | 2 / 2 | unsolvable/complete | unsolvable/complete | 1 / 1 | 1 / 1 | 0.016 / 0.009 | ✓ |
| trapped-capacity-three | 3 / 2 | unsolvable/complete | unsolvable/complete | 1 / 1 | 1 / 1 | 0.009 / 0.009 | ✓ |
| known-three-pours | 2 / 4 | 3 pours | 3 pours | 7 / 7 | 3 / 3 | 0.110 / 0.138 | ✓ |
| three-color-ring | 3 / 5 | 7 pours | 7 pours | 48 / 93 | 34 / 30 | 0.510 / 2.372 | ✓ |
| matrix-c2-k2-fixed-a | 2 / 4 | 3 pours | 3 pours | 7 / 7 | 3 / 3 | 0.188 / 0.147 | ✓ |
| matrix-c2-k2-fixed-b | 2 / 4 | 3 pours | 3 pours | 7 / 7 | 3 / 3 | 0.108 / 0.119 | ✓ |
| matrix-c2-k3-fixed-a | 2 / 5 | 3 pours | 3 pours | 7 / 7 | 3 / 3 | 0.153 / 0.153 | ✓ |
| matrix-c2-k3-fixed-b | 2 / 5 | 0 pours | 0 pours | 1 / 1 | 1 / 1 | 0.022 / 0.012 | ✓ |
| matrix-c2-k4-fixed-a | 2 / 6 | 4 pours | 4 pours | 13 / 17 | 6 / 6 | 0.247 / 0.322 | — |
| matrix-c2-k4-fixed-b | 2 / 6 | 5 pours | 5 pours | 26 / 38 | 15 / 13 | 0.361 / 0.536 | — |
| matrix-c3-k2-fixed-a | 3 / 4 | 3 pours | 3 pours | 7 / 7 | 3 / 3 | 0.050 / 0.055 | ✓ |
| matrix-c3-k2-fixed-b | 3 / 4 | 3 pours | 3 pours | 7 / 7 | 3 / 3 | 0.051 / 0.098 | ✓ |
| matrix-c3-k3-fixed-a | 3 / 5 | 6 pours | 6 pours | 25 / 54 | 15 / 17 | 0.170 / 0.700 | ✓ |
| matrix-c3-k3-fixed-b | 3 / 5 | 6 pours | 6 pours | 37 / 58 | 23 / 20 | 0.665 / 1.591 | ✓ |
| matrix-c3-k4-fixed-a | 3 / 6 | 8 pours | 8 pours | 51 / 157 | 36 / 39 | 0.442 / 4.452 | — |
| matrix-c3-k4-fixed-b | 3 / 6 | 7 pours | 7 pours | 51 / 105 | 35 / 30 | 0.654 / 2.753 | — |
| matrix-c4-k2-fixed-a | 4 / 4 | 5 pours | 5 pours | 13 / 30 | 7 / 10 | 0.078 / 0.227 | — |
| matrix-c4-k2-fixed-b | 4 / 4 | 3 pours | 3 pours | 6 / 7 | 3 / 3 | 0.040 / 0.075 | — |
| matrix-c4-k3-fixed-a | 4 / 5 | 7 pours | 7 pours | 33 / 109 | 21 / 31 | 0.174 / 1.571 | — |
| matrix-c4-k3-fixed-b | 4 / 5 | 7 pours | 7 pours | 42 / 98 | 27 / 25 | 0.351 / 1.149 | — |
| matrix-c4-k4-fixed-a | 4 / 6 | 13 pours | 13 pours | 148 / 576 | 101 / 99 | 1.679 / 9.730 | — |
| matrix-c4-k4-fixed-b | 4 / 6 | 11 pours | 11 pours | 192 / 397 | 112 / 70 | 1.268 / 6.219 | — |
| matrix-c5-k2-fixed-a | 5 / 4 | 7 pours | 7 pours | 30 / 40 | 14 / 10 | 0.171 / 0.548 | — |
| matrix-c5-k2-fixed-b | 5 / 4 | 6 pours | 6 pours | 26 / 30 | 11 / 10 | 0.282 / 0.350 | — |
| matrix-c5-k3-fixed-a | 5 / 5 | 8 pours | 8 pours | 39 / 186 | 26 / 50 | 0.231 / 1.851 | — |
| matrix-c5-k3-fixed-b | 5 / 5 | 9 pours | 9 pours | 42 / 262 | 29 / 68 | 0.290 / 3.932 | — |
| matrix-c5-k4-fixed-a | 5 / 6 | 15 pours | 15 pours | 201 / 1842 | 154 / 316 | 1.534 / 31.912 | — |
| matrix-c5-k4-fixed-b | 5 / 6 | 12 pours | 12 pours | 270 / 692 | 156 / 109 | 2.658 / 8.410 | — |
| matrix-c6-k2-fixed-a | 6 / 4 | 7 pours | 7 pours | 22 / 107 | 14 / 32 | 0.170 / 0.877 | — |
| matrix-c6-k2-fixed-b | 6 / 4 | 7 pours | 7 pours | 45 / 68 | 25 / 22 | 0.423 / 0.932 | — |
| matrix-c6-k3-fixed-a | 6 / 5 | 11 pours | 11 pours | 116 / 247 | 63 / 43 | 0.717 / 2.965 | — |
| matrix-c6-k3-fixed-b | 6 / 5 | 13 pours | 13 pours | 313 / 653 | 162 / 119 | 2.232 / 7.448 | — |
| matrix-c6-k4-fixed-a | 6 / 6 | 18 pours | exhausted/states | 479 / 3000 | 306 / 523 | 4.745 / 53.941 | — |
| matrix-c6-k4-fixed-b | 6 / 6 | 13 pours | 13 pours | 85 / 732 | 60 / 129 | 0.759 / 12.965 | — |
| state-limit | 3 / 5 | exhausted/states | exhausted/states | 1 / 1 | 1 / 1 | 0.018 / 0.016 | ✓ |
| depth-limit | 3 / 5 | exhausted/depth | exhausted/depth | 1 / 1 | 1 / 1 | 0.035 / 0.020 | ✓ |
| unbalanced-draft | 2 / 2 | invalid | invalid | — / — | — / — | 0.003 / 0.002 | — |
| same-layout-larger-state-budget | 6 / 6 | 18 pours | 18 pours | 479 / 3513 | 306 / 523 | 3.080 / 78.131 | — |

## Environment and provenance

- Node v24.19.0; win32 10.0.26300; x64; 11th Gen Intel(R) Core(TM) i7-11850H @ 2.50GHz; 16 available logical CPUs. No concurrency is used.
- Git base at measurement: `82d072158b29ab4ef8b8cf4bc0e50e85c23bff0c`. New evaluation artifacts may be uncommitted; the exact solver/corpus/evaluator/oracle SHA-256 values in JSON identify the measured files rather than implying that this base commit already contains the report.
- Solver SHA-256: `89fd1a967483592762320f1390f9863b06762e2cd96587c22675d530aca08cfd`.
- Corpus SHA-256: `67e4c2ed738e46691712b958e247fcd93af22ff7da84baaeff25bd7ff90fbc45`.

This internal Codex-assisted measurement covers a finite corpus. It does not prove correctness for every accepted layout. Production state symmetry and the heuristic still depend on their stated rule assumptions. Larger corpora, real-browser worker measurements and consented task feedback answer different questions.
