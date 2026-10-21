# Saved-library recovery — 21 October 2026

## Demonstrated problem and repair

Previously, malformed existing `pourlab-library-v1` data produced a warning but left an empty in-memory library writable. A later save could replace that unreadable original. The current implementation holds a write lock, offers an exact raw-text backup and requires a separate confirmation before reset. Failed reset/read/write operations retain the protected original or the last good library. Draft storage failures have persistent feedback and an export route.

The changed-value guard also refuses stale library writes. It is not an atomic cross-tab transaction, cloud synchronization or a permanent archive. Browser data can still be cleared outside the app. Downloading a backup is requested by the browser; the app cannot prove that the user kept it, so reset confirmation asks that explicitly.

## Reproduce automated checks

```sh
node --test tests/*.test.js
```

17 checks passed: eight rule/portability checks and nine recovery regressions. `tests/storage.test.js` executes the actual production storage-function block with controlled DOM/localStorage/download/confirmation boundaries. It covers malformed/non-array/oversized libraries, unchanged original text after a save attempt, backup/reset gating, cancellation, successful reset, failed reset, blocked reads, failed named and draft writes, retries, and changed-library guards. It does not start a real browser or certify download completion.

## Actual browser observations

Checks used an isolated localhost origin with explicitly synthetic fixtures; no public visitor data was corrupted.

- Malformed original: `{"recovery-fixture":"unfinished Ω archive"` (intentionally no closing brace). The warning remained visible and a save attempt left the original unchanged.
- **My levels** showed the protected-original explanation. Reset was disabled before backup request. The downloaded raw file was exactly the same string, including Ω, at 43 UTF-8 bytes; reset became available afterward. Native confirmation branches are exercised in the automated harness; a browser cancellation claim is not inferred from those tests.
- At a 390 × 720 viewport the recovery dialog was 358px wide, document width stayed 390px, and its explanation used light text on the dark panel. [Mobile capture](storage-recovery-mobile.png).
- A temporary quota-failure fixture made draft persistence fail during name editing. A persistent warning offered export, rather than repeated toasts. Reload removed the temporary fault. [Warning capture](storage-warning.png).
- Normal flow: imported a new two-color capacity-two level through the JSON dialog, saved it as **Recovery acceptance study**, reloaded, and retained its name, capacity and library entry with no warning. The actual worker found three shortest checked pours after seven A* states; keyboard replay reached 3/3. [Working flow](storage-normal-flow.png).

Browser checks are Codex observations of these paths. They do not establish unfamiliar-user acceptance, complete accessibility or customer adoption.
