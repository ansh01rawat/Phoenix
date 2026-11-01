# Phoenix — Phases 4–5 and Phase 6 follow-up

Historical delivery evidence. The subsequent reliability audit and current 33-test result are in [phase-6-audit.md](phase-6-audit.md).

Completed 1 November 2026 in the existing `C:\phoenix` project. The Phase 4–5 result was reported before proceeding to Phase 6. Existing architecture, tokens, components, and source files were preserved.

## Phase 4 — preview and verification

- Original/Repaired static sample comparison, exact Desktop/Tablet/Mobile viewport widths, frame refresh, and visible display scale.
- An opaque, script-free `sandbox=""` iframe with restrictive CSP, disabled capabilities, no referrer, and no external resources. Imported source is never executed.
- Cancellable async sample loading, stale-response protection, a six-second loading deadline, unavailable and frame-error states, and retry. The demo scenario menu exposes the unavailable sample explicitly.
- Simulated verification dashboard with All/Passed/Failed/Skipped filters, expandable logs, accurate counts, optional skipped checks, rerun scenarios, and a shared completeness summary.

## Phase 5 — review and decisions

- Final issue/proposal summary, file counts and line totals, expandable explanations, exact-file diff links, report navigation, and the original-project protection notice.
- Separate approval and rejection confirmation dialogs, safe initial focus, Escape cancellation, focus restoration, and protected pending state.
- Every canonical required demo check must occur exactly once and pass. Missing checks, skipped required checks, failures, and duplicate IDs block approval. The optional external-service check may remain skipped.
- Session operations are serialized. Approval evidence is rechecked when the decision is recorded. Interrupted approval returns to review and requires a new explicit confirmation.
- Approval records `decision: approved`, retains `application: not_applied`, and does not deploy. Rejection discards the simulated proposal and preview while retaining history and original-project protection.

## Verification evidence

| Check                            | Result                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Production TypeScript/Vite build | Passed; on-demand Monaco size warning remains                                   |
| Complete Playwright suite        | 20 passed in Microsoft Edge/Chromium                                            |
| Production browser smoke         | Preview, report, exact-file Monaco diff, mobile review, and both dialogs passed |
| Oxlint                           | Passed with no warnings after Phase 6 cleanup                                   |
| Prettier                         | Source, tests, configuration, and Markdown checked                              |
| Responsive layouts               | 1440, 1280, 768, and 390 px; no document overflow in tested combinations        |
| Automated accessibility          | Tested outer screens and dialogs passed WCAG 2 A/AA and 2.1 AA axe checks       |
| Local application                | Development server running at http://127.0.0.1:5173/app                         |

The 20 tests include the retained dashboard/import/diagnosis/diff and shell regressions, nine dedicated Phase 4–5 checks, and a Phase 6 resize regression. Coverage includes a new sample session all the way from import to explicit approval, exact-file navigation, unavailable preview and retry, a deliberately unready frame and deadline recovery, rapid version changes, repeated active-version selection, missing/skipped/duplicate-check guards, serialized pending decisions, interrupted approval recovery, rejection, persisted decisions, and phone accessibility.

These are real browser tests of the Phoenix frontend. The checks displayed inside Phoenix remain mock fixture results and do not verify an imported website.

## Phase 6 inspection and cleanup

Desktop preview, phone error handling, review explanations, test results, and confirmation layouts were inspected through saved browser screenshots. Responsive coverage retained the established four widths. Source-only navigation helpers and the toast hook were separated from component modules to preserve Fast Refresh boundaries, without changing behavior. Formatting and documentation were updated. Existing completed screens were not replaced.

Visual inspection caught a selected workflow tab becoming clipped when a desktop window was resized to phone width. A scoped ResizeObserver now reveals the active tab inside its own strip without scrolling the document; a dedicated browser assertion covers both visibility and unchanged page position.

An intermittent settings accessibility assertion sampled the 220 ms page-entry fade at partial opacity. The trace confirmed intermediate rendered colors. That assertion now waits for full page opacity before auditing contrast and includes element-level failure diagnostics; no contrast rule was disabled.

Screenshots: `docs/screenshots/batch2-{preview,tests,review}-{1440,1280,768,390}.png`, plus `docs/screenshots/phase45/preview-loading.png`, `preview-error.png`, `preview-error-mobile.png`, `review-explanations-mobile.png`, and the `production-*` screenshots of the built application. The production smoke test found no uncaught browser errors.

## Outstanding limitations

There are no known blocking frontend issues in the tested journey. The lazy desktop Monaco chunk is approximately 2.7 MB minified / 699 kB gzip and retains Vite's size warning; normal entry is approximately 306 kB / 97 kB gzip. Mobile uses the readable diff without loading Monaco.

Browser automation used Edge/Chromium. Firefox, Safari, and a complete screen-reader review were not run. The opaque preview frame is checked separately for content and sandbox attributes; axe intentionally audits the outer application without weakening the frame. The built-in preview does not represent a live imported build.

Real diagnosis, source verification, isolated preview hosting, and application of approved files require future backend infrastructure. This delivery does not add those services or claim their effects. No original project files are modified by a demo decision, and no deployment is performed.
