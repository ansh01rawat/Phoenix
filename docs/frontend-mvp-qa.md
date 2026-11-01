# Phoenix frontend MVP — final QA

Current validation: see [phase-6-audit.md](phase-6-audit.md) for the subsequent P0/P1 reliability audit and 33 passing browser tests. Earlier counts below record their respective delivery stages.

Follow-up: Phase 4–5 hardening and the subsequent Phase 6 review are documented in [phase-4-5-qa.md](phase-4-5-qa.md). The current suite contains 20 browser tests. This report retains the original batch-delivery evidence below.

Completed 1 November 2026 in the existing C:\phoenix root. All three requested batches were completed sequentially in approximately 30 minutes.

## Batch results

| Batch          | Delivery                                                                                                                                                                                                      | Verification                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1 / Phases 2–3 | Dashboard, project search/detail/history, ZIP validation and simulated import, sample ZIP, activity timeline, issues/evidence/plan, selectable local Monaco diff and mobile readable comparison               | Production build passed; 3 browser tests passed; 4 target sizes inspected                                        |
| 2 / Phases 4–5 | Script-free isolated sample preview, Original/Repaired, Desktop/Tablet/Mobile, refresh, simulated checks and logs, failure recovery, review and separate decision confirmations                               | Production build passed; 3 browser tests passed; approval blocked on failed checks; rejection discards demo copy |
| 3 / Phase 6    | Consistent formatting, shell regressions, project/history interactions, persisted state and interrupted-work recovery, keyboard/focus/reduced-motion checks, mobile diff, accessibility and visual inspection | Production build passed; final complete suite: 10 passed in approximately 1.2 minutes                            |

## Evidence

- Responsive coverage: dashboard, import, diagnosis, preview, test results, and review at widths 1440, 1280, 768, and 390 px. Full-page screenshots are under `docs/screenshots/batch1-*` and `batch2-*`.
- Screenshot inspection included desktop dashboard, desktop code comparison, desktop and phone diagnosis, desktop preview, desktop and phone final review, and phone test results. No document overflow was found in the tested combinations.
- Dedicated browser tests verify real Monaco rendering, file switching without uncaught errors, original/repaired frame content, mobile frame width, refresh, test filtering and logs, failed-check approval guard, passing recovery, explicit confirmation, persistent decisions, and discarded proposal access.
- Shell tests cover collapsed sidebar persistence, project search and detail, repair history filters, command navigation, guide dismissal/focus, workspace menu, phone drawer, reduced motion, interrupted diagnosis recovery, and missing sessions.
- Axe WCAG 2 A/AA and 2.1 AA checks passed on the tested outer application surfaces and decision dialog. Script-free sandboxed frames cannot be audited through script injection; the documented same-origin axe mode preserves isolation. Separate tests verify preview contents and empty sandbox permissions.
- No uncaught page errors occurred in the tested import-to-diff and preview-to-decision journeys.

## Fixes made during QA

The local dev server was restarted to clear stale style transforms after new CSS imports. A regression assertion now verifies dashboard grid styling. Vite ignores generated reports and screenshots to avoid unnecessary browser reloads. Monaco models are retained for the bounded two-file sample to avoid the adapter disposing an active model during file switching. Desktop inline fallback is disabled so the code view is genuinely side by side; narrow screens use the separate readable view.

A critical transitive DOMPurify advisory was reported during Monaco installation. Feature work paused while it was inspected. The upstream patch is DOMPurify 3.4.17; an npm override and lockfile update cleared the audit to zero vulnerabilities. The dependency was verified before work continued. Advisory: https://github.com/advisories/GHSA-cg2g-xh64-v4q7

## Product boundaries

All repair operations are clearly labeled demonstrations. ZIP selection performs bounded container metadata checks and never extracts, uploads, or executes source. The sample fixture drives diagnosis, code changes, static preview, and simulated checks consistently. The included archive contains the reproducible original failure.

Approval is an explicit simulated decision, separate from application. Application remains `not_applied`; there is no real backend, application of source files, deployment, payment operation, or API key usage. Rejection discards the simulated working copy while preserving decision history. Original files are protected throughout.

## Remaining limitations

The large on-demand Monaco bundle still produces Vite's 500 kB warning (approximately 2.7 MB minified / 699 kB gzip); the warning threshold was not changed. Its worker and assets are local, and mobile does not load it. Main application entry is approximately 340 kB / 108 kB gzip.

Browser automation covers Edge/Chromium; Firefox, Safari, and a complete screen-reader review were not run. Archive metadata validation is not a full integrity or security scan. Real diagnosis, building, testing, preview hosting, and file application require future backend infrastructure and are intentionally not claimed by this frontend.

## Handoff

Run `npm run dev`; open http://127.0.0.1:5173/app. The dev server remains running. Read README.md for the walkthrough, routes, source architecture, mock explanation, and commands. The original Phase 1 QA and unused foundation references remain available. No existing files were deleted, and no Git commit, push, or deployment occurred.
