# Phoenix — frontend MVP

The latest presentation pass adds larger Geist typography, violet/charcoal liquid-glass controls, responsive spacing and reduced-motion-aware interactions. See `docs/visual-enhancement.md`. Service contracts and workflow logic are unchanged; authenticated onboarding/profile/workspace integration is pending the teammate's backend push.

Phoenix is a dark, code-focused website repair workspace. The full frontend journey is implemented with explicitly labeled demonstration services:

**Import → Diagnose → Inspect changes → Compare previews → Review checks → Approve or reject.**

## Run

The application lives directly in `C:\phoenix`.

```powershell
npm ci
npm run dev
npm run build
npm run test:e2e
```

Open http://127.0.0.1:5173/app. `npm run preview` serves the production build at port 4173. `npm run format` formats the source and documentation. The retained `lint` and `typecheck` scripts are also available.

## Demo walkthrough

1. Choose **New repair** and **Use sample project**, or select the included ZIP from `public/demo/forma-storefront.zip`.
2. Run the demo diagnosis. The activity timeline progresses through one stage at a time.
3. Select either issue and read its evidence and repair plan.
4. Inspect both changed files in the locally bundled Monaco diff. Narrow screens receive a readable unified diff.
5. Compare Original and Repaired in the script-free preview. Switch Desktop, Tablet, or Mobile and refresh the frame. The **Preview demo scenarios** menu includes an unavailable sample with a working retry action; requests also have a six-second loading deadline.
6. Run demo checks. Choose **Runtime failure** to demonstrate failed verification and blocked approval; rerun **Passing checks** to recover.
7. Review the summary, expand each file's **Why this change**, and follow its filename to the exact diff. Open the separate approval or rejection confirmation. Decisions persist in this browser. No source files are applied.

The preloaded `px-1041` session is ready for review; `demo` begins before diagnosis. Projects and repair history support navigation, search, and decision filtering. Project detail pages can start another demo session.

## Routes

| Route                              | Purpose                                                   |
| ---------------------------------- | --------------------------------------------------------- |
| `/app`                             | Dashboard, statistics, recent projects and repairs        |
| `/app/projects`                    | Searchable projects                                       |
| `/app/projects/:projectId`         | Project details and repair sessions                       |
| `/app/repairs`                     | Filterable repair history                                 |
| `/app/repairs/new`                 | ZIP selection, validation, simulated import, sample entry |
| `/app/repairs/:repairId/diagnosis` | Activity, findings, evidence, repair plan                 |
| `/app/repairs/:repairId/changes`   | File explorer, Monaco diff, explanation                   |
| `/app/repairs/:repairId/preview`   | Safe sample website comparison                            |
| `/app/repairs/:repairId/tests`     | Simulated checks, filters, expandable logs                |
| `/app/repairs/:repairId/review`    | Summary and explicit decisions                            |
| `/app/settings`                    | Persisted sidebar and motion preferences                  |

Root redirects to `/app`. Unknown projects, sessions, and paths have recoverable not-found views.

## Architecture

- `src/components/ui`: source-owned Radix/shadcn-style primitives.
- `src/components/navigation`, `src/components/shared`: persistent chrome, dialogs, feedback, page states.
- `src/layouts`: shared application and repair-session context.
- `src/features`: dashboard, projects, import, diagnosis, code-diff, preview, testing, approval.
- `src/types/repair.ts`: project, session, issue, plan, modification, code-line and test types.
- `src/store/project-store.ts`: browser-persisted demonstration projects and sessions; interrupted-work recovery.
- `src/store/browser-storage.ts`, `saved-state.ts`: guarded persistence, visible session-only fallback, and validated saved-data recovery.
- `src/services/mock/fixtures.ts`: centralized source snippets, issues, plan, test fixtures and seed data.
- `src/services/mock/repairService.ts`: guarded diagnosis, verification, and decision transitions.
- `src/services/mock/verification.ts`: the required demo-check manifest and shared report completeness policy.
- `src/services/mock/importService.ts`: bounded ZIP container checks without extraction.
- `src/services/mock/previewService.ts`: asynchronous trusted static preview documents and an unavailable demo scenario.
- `src/features/preview/use-sample-preview.ts`: cancellable requests, stale-response protection, loading deadline, and frame readiness.
- `src/services/contracts.ts`: future project, repair, and sample-preview API boundaries.
- `src/styles`: the preserved Phoenix tokens plus feature and verification styles.
- `tests/e2e`: shell regression, complete journey, failure recovery, viewport and accessibility checks.

The original Phase 1 page files and starter assets are retained as historical foundation references but are not active feature routes. Completed shell components were extended rather than replaced with another UI system.

## Trust and limitations

This is a frontend demonstration, not a backend repair engine. ZIP bytes stay in the browser and are not stored or executed. Only extension, bounded size, header, and ZIP end-directory metadata are checked; this is not an archive-integrity, malware, or source-code scan. Regardless of the selected filename, diagnosis and repair data come from the clearly labeled Forma fixture.

The preview is trusted static HTML with `sandbox=""`, a restrictive content security policy, no scripts, no same-origin privilege, and no external resources. It illustrates the sample failure and repair; it does not execute the archive. A real preview will require an independently isolated backend origin.

Verification is simulated. Every required check from the centralized demo manifest must appear exactly once and pass before approval is available. Missing, failed, skipped required, or duplicate checks block approval. The optional external-service check may remain skipped. Verification and decisions are serialized for each session, and the report is checked again before recording approval. An interrupted approval requires a fresh explicit confirmation.

Approval decisions and application status are distinct: the latter stays `not_applied`. Rejection marks the simulated working copy discarded and removes access to its proposal and preview; history remains. No deployment action exists.

Browser storage keys are `phoenix-ui-v1` and `phoenix-demo-v2`. They contain UI preferences, filenames, and demo metadata, never source file contents or API keys. No OpenAI or Exa credits are used by the application.

## Dependencies and performance

Monaco is lazy-loaded only for desktop code comparison, uses a local worker, and makes no CDN request. Its approximately 2.7 MB minified / 699 kB gzip chunk produces a Vite size warning; the warning threshold has not been raised. The normal application entry is approximately 307 kB minified / 97 kB gzip. The mobile diff does not load Monaco. If the optional editor fails to load, a local boundary retains the readable comparison and onward workflow.

Monaco 0.57 pins an affected DOMPurify version. A documented npm override selects the official patched DOMPurify 3.4.17 release; installation audit reports zero vulnerabilities. Preserve this override until the upstream dependency is patched.

## QA

Playwright uses installed Microsoft Edge on Windows. On other systems, install Chromium with `npx playwright install chromium` or set `PLAYWRIGHT_CHANNEL` to an installed supported channel. Tests reuse the running server or start one if the port is free. Browser launch and localhost access must be permitted by the execution environment.

Screenshots are saved under `docs/screenshots`. The isolated iframe is intentionally opaque; axe uses its documented same-origin mode for the outer application, while dedicated tests check the preview's content and sandbox attributes. Automated accessibility is a baseline rather than a complete assistive-technology audit.

The browser suite contains 33 tests, including the full import-to-decision journey, failed-check recovery, missing/skipped/duplicate-check approval guards, preview failures and timeout recovery, interrupted decisions, corrupt saved data, denied browser storage, optional-editor failure, import cancellation, exact responsive sizes, and accessibility checks.

If browser storage is unavailable, a **Session-only mode** banner explains that new state cannot survive refresh; the current demonstration can still finish. Malformed saved data is validated before use, with a visible recovery notice. A damaged report must be rerun before approving.

See `design.md` and `docs/phase-6-audit.md` for current design and validation evidence. `docs/phase-4-5-qa.md`, `docs/phase-1-qa.md`, and `docs/frontend-mvp-qa.md` retain earlier delivery history.
