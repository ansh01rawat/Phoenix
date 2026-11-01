# Phoenix — Phase 6 reliability audit

Audit performed 1 November 2026. The user explicitly prioritized all P0/P1 fixes before minor aesthetic work. Astra Max was requested but could not start because its usage limit was reached; the primary agent continued the audit. This report does not attribute work to Astra.

## Initial inventory — before application changes

The existing routes, layouts, shared primitives, feature modules, centralized fixtures, mock services, persisted stores, preview policy, diff implementation, and automated tests were reviewed before changes. Earlier delivery evidence remains in `phase-4-5-qa.md`.

| ID  | Priority | Finding and reproduced evidence                                                                                                                                                                                | Initial status                                          |
| --- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| R1  | P1       | Rejecting browser `Storage.setItem` with `QuotaExceededError` makes **Use sample project** reject without navigation. The same persistence path serves diagnosis, verification, decisions, and UI preferences. | Reproduced in Edge; fix first                           |
| R2  | P1       | A null saved project crashes `/app/projects`; a saved ready session with `tests: null` crashes the repair shell. Reload retains the bad records and repeats the failure.                                       | Reproduced in Edge; fix first                           |
| R3  | P1       | Aborting the lazy Monaco module request triggers the application-wide fatal fallback. The already available readable diff and navigation disappear.                                                            | Reproduced in Edge; fix first                           |
| R4  | P2       | Earlier responsive tests used height 900 for laptop and tablet. The final audit must use the exact requested 1280×800 and 768×1024 dimensions.                                                                 | Validation gap                                          |
| R5  | P2       | The lazy Monaco bundle remains large, but it is excluded from the initial dashboard and mobile diff.                                                                                                           | Known non-blocking warning; do not hide                 |
| R6  | P3       | Historical foundation pages and starter assets remain unused, and feature CSS contains repeated local shades.                                                                                                  | Preserve files; no cosmetic refactor before reliability |

No P0 issue has been identified in the source and fault scenarios inspected so far. This is an audit finding, not a security certification.

Follow-up finding R7 / P1: the expanded desktop axe audit found unnamed Original/Repaired Monaco inputs (`aria-input-field-name`). Add distinct filename-specific editor labels before cosmetic work, then repeat the accessibility check.

Instrumentation finding: Playwright trace snapshots cause four exact Chrome **Blocked script execution in about:srcdoc** messages when inspecting the opaque preview. A standalone reproduction produced zero messages without tracing and four with tracing; the document contains zero script elements. The audit records these exact diagnostics as a test attachment and fails on every other console error. Sandbox permissions are unchanged, and no accessibility rule is disabled.

## Verification scope

Add focused regression coverage for storage failure, malformed-state recovery, and unavailable Monaco. Then run the complete browser journey, exact responsive sizes, screenshot inspection, keyboard/dialog checks, axe, production build, lint, and explicit TypeScript checks. Keep simulation labels, opaque script-free previews, approval gating, `application: not_applied`, rejection semantics, and original-source protection intact.

## A. Overall application status

Final result: **PASS for the tested frontend demonstration. Identified open P0: 0. Identified open P1: 0. All 33 browser tests passed.**

The frontend demonstration meets the tested live-demo acceptance criteria. All four identified P1 defects have focused verified fixes. No P0 defect was found in the inspected implementation. This is a frontend demonstration assessment, not a claim of production readiness or real website repair.

The final complete regression run is recorded below. No decorative redesign, dependency replacement, backend integration, deployment, or original-website file application was introduced.

## B. Screens inspected

Dashboard, project list, project detail, repair history, import, completed diagnosis, code comparison, website preview, test results, final review, and settings were captured at all four target sizes. Screenshot inspection included desktop dashboard/projects/import/diagnosis/diff/tests, laptop project detail, tablet preview, phone history/review/settings, the unavailable editor fallback, and the production session-only recovery notice. Approval, rejection, preview loading/error/retry, and expanded phone review retain the inspected evidence from `phase-4-5-qa.md` and the current regression checks.

The current screenshots are in `docs/screenshots/phase6/`, named `{screen}-{width}x{height}.png`. The desktop, tablet, and mobile compositions were inspected from actual browser output; screenshots were not treated as proof without review.

## C–D. Functional findings and implemented fixes

| Finding                                                                | Final status         | Fix and evidence                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1 / P1: unavailable storage interrupts the demo                       | PASS — fixed         | `browser-storage.ts` catches read/write failures, retains the tab's state in memory, and displays **Session-only mode** with an explicit refresh limitation. Both rejected writes and denied storage access pass the full sample-import → diagnosis → changes → preview → checks → confirmed approval journey. Preferences remain interactive.                                                                                                                |
| R2 / P1: malformed saved records cause repeat crashes                  | PASS — fixed         | `saved-state.ts` validates restored records, IDs, dates, fields, and report entries; preserves valid projects/sessions; drops invalid records; invalidates damaged reports; and normalizes source-application state to `not_applied`. UI hydration accepts only the two boolean preferences and cannot replace action functions. Recovery is visible and new verification is required. Damaged pre-diagnosis records do not manufacture a completed proposal. |
| R3 / P1: optional editor failure takes down the app                    | PASS — fixed         | A feature-local `DiffBoundary` preserves the readable comparison, selected file, session, and navigation when the rich editor import fails. File switching and the onward preview journey were tested with the request deliberately aborted.                                                                                                                                                                                                                  |
| R7 / P1: unnamed Monaco inputs                                         | PASS — fixed         | Both editor panes receive distinct filename-specific accessible names through the public sub-editor API, including after file changes. Desktop axe and explicit role/name assertions verify the actual inputs. Construction labels alone were insufficient; the initial failed check was investigated rather than excluded.                                                                                                                                   |
| R4 / P2: inaccurate viewport heights in earlier coverage               | PASS — addressed     | Added exact 1440×900, 1280×800, 768×1024, and 390×844 coverage for all eleven major screens.                                                                                                                                                                                                                                                                                                                                                                  |
| R5 / P2: large optional editor bundle                                  | PASS with limitation | The editor remains lazy and local. The size warning is retained; no claim of bundle-size optimization is made. Failure now has a usable fallback.                                                                                                                                                                                                                                                                                                             |
| R6 / P3: unused historical assets and small style/copy inconsistencies | Deferred             | Existing historical files were preserved. No cosmetic cleanup displaced reliability work. For example, the project-detail session count still uses a generic plural label.                                                                                                                                                                                                                                                                                    |

## E. Responsive testing

| Viewport | Status | Result                                                                                                            |
| -------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| 1440×900 | PASS   | Full navigation, session context, rich diff, and major screens remain usable.                                     |
| 1280×800 | PASS   | Laptop density and panels stay within the document width.                                                         |
| 768×1024 | PASS   | Drawer navigation, compact session details, and readable diff replace wider structures.                           |
| 390×844  | PASS   | Stacked content, scrollable workflow tabs, readable code, preview controls, and review actions remain accessible. |

The browser assertions check every major screen for document overflow. The preview's explicit target viewport may be scaled inside its frame; the document itself does not scroll horizontally. The retained resize regression verifies the active stage stays visible without moving the document.

## F. Accessibility and product integrity

| Check                                  | Status                      | Evidence or limit                                                                                                                                                                                                        |
| -------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WCAG 2 A/AA and 2.1 AA automated audit | PASS                        | All eleven major outer application screens at desktop and phone widths, plus retained dialog/error checks. The unnamed Monaco inputs were fixed.                                                                         |
| Keyboard navigation and dialogs        | PASS                        | Command palette, drawer, Escape handling, safe confirmation focus, focus restoration, and motion preferences are covered by retained browser tests.                                                                      |
| Preview isolation                      | PASS                        | Empty sandbox permissions, no script elements, restrictive CSP, no same-origin capability, static trusted fixture, and explicit demo labels. The opaque frame is checked separately rather than made scriptable for axe. |
| Simulated checks and decisions         | PASS                        | In-app results remain fixtures, every required demo check gates approval, and confirmation records a decision only. Application remains `not_applied`; rejection discards only the simulated copy.                       |
| Obvious secret/execution patterns      | PASS — limited static check | No matches for the inspected API-key, unsafe HTML/eval, or sandbox privilege patterns in app/public source. This is not a penetration test or comprehensive secret-scanner result.                                       |
| Full screen-reader review              | NOT TESTED                  | Automated accessibility and keyboard checks do not substitute for testing NVDA, JAWS, or VoiceOver.                                                                                                                      |
| Actual OS clipboard readback           | NOT TESTED                  | The copy control's success/failure handling was reviewed; an end-to-end system clipboard readback was not part of this audit.                                                                                            |

## G. Performance and maintainability

Dashboard and mobile routes do not request Monaco. Heavy workspace modules remain lazy. Fonts and the editor worker are served locally, with no runtime CDN dependency. The normal application entry is approximately 306.74 kB minified / 97.16 kB gzip; the optional Monaco chunk is approximately 2,719.31 kB / 699.36 kB gzip. Vite's size warning remains visible.

No unnecessary dependency or new abstraction layer was introduced. Changes add a small shared storage adapter, record validation, a visible storage notice, a local error boundary, and public editor labeling. Existing fixtures, workflow guards, design tokens, layout hierarchy, and sandbox policy were retained.

## H. Build and test results

| Check                    | Status                   | Result                                                                                                                                                                                             |
| ------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build`          | PASS                     | TypeScript and Vite production output succeeded; only the known editor-size warning remains.                                                                                                       |
| `npm run typecheck`      | PASS                     | Explicit TypeScript project check succeeded.                                                                                                                                                       |
| `npm run lint`           | PASS                     | Oxlint completed without warnings.                                                                                                                                                                 |
| Formatting               | PASS                     | Repository-wide Prettier check passed after documentation completion.                                                                                                                              |
| `npm run test:e2e`       | PASS                     | 33 passed in 3.2 minutes, including every retained regression and the new reliability and responsive audits.                                                                                       |
| Production browser smoke | PASS                     | The built app completed the full approval journey with storage writes denied and Monaco unavailable simultaneously. Normal production Monaco names and the independent rejection flow also passed. |
| Browser runtime errors   | PASS in completed checks | No uncaught application errors in the normal or deliberate fallback journeys. The final suite also rejects unexpected console errors.                                                              |

The browser tests execute real frontend interactions in installed Microsoft Edge/Chromium. They are separate from the mock verification results displayed inside Phoenix.

Expected instrumentation diagnostics are recorded rather than hidden: Playwright trace snapshots attempt evaluation inside the opaque sample frame, which Chrome blocks. The audit attaches the exact known diagnostic and still fails on every other console error. No preview permissions or accessibility rules were weakened to obtain a pass.

## I. Remaining bugs and limitations

No known open P0/P1 issues remain among the reproduced and tested cases. R5's optional bundle size and R6's minor historical/style/copy cleanup remain lower priority. Firefox, Safari, full assistive-technology testing, and system clipboard readback were not run. Refresh necessarily loses newly created state when the browser denies persistence; the interface now states that limitation and the current demo remains usable.

ZIP checks are bounded metadata validation, not a malware or complete archive-integrity scan. Imported code is not extracted, uploaded, or executed. Actual source diagnosis, project builds, verification, preview hosting, and application are outside this frontend and remain explicitly unimplemented. No production-readiness certification is implied.

## J. Final repository structure

```text
C:\phoenix
├── src/
│   ├── components/{navigation,shared,ui}/
│   │   └── shared/StorageNotice.tsx
│   ├── config/                        # Navigation and workflow labels
│   ├── features/
│   │   ├── dashboard/ projects/ import/ diagnosis/
│   │   ├── code-diff/                 # Monaco, readable view, local boundary
│   │   └── preview/ testing/ approval/
│   ├── hooks/ layouts/ lib/ pages/
│   ├── services/{contracts.ts,mock/}   # Central sample and service boundaries
│   ├── store/                         # UI/project stores, safe storage, saved-state validation
│   ├── styles/                        # Preserved Phoenix design system
│   └── types/
├── public/demo/                       # Downloadable static sample ZIP
├── tests/e2e/                         # Existing regressions + reliability and final audit
├── docs/{screenshots/,phase-6-audit.md,...}
├── design.md
├── README.md
├── package.json / package-lock.json
└── Vite, TypeScript, Playwright, and lint configuration
```

Historical foundation pages/assets were retained. No source files were deleted and no commit, push, or deployment was performed.

## K. Run locally

In PowerShell from `C:\phoenix`:

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:5173/app. Start **New repair → Use sample project** for a fresh demonstration. The existing dev server is retained. For a production preview, run `npm run build`, then `npm run preview` and open http://127.0.0.1:4173/app. Do not run two servers on the same configured port. Run `npm run test:e2e`, `npm run lint`, and `npm run typecheck` for repeatable checks. Tests use installed Edge on Windows; other environments may require installing Playwright Chromium or setting `PLAYWRIGHT_CHANNEL`.

## L. Recommended backend connection steps

1. Implement authenticated, revision-scoped services behind the existing contracts. Use server-owned job IDs, idempotent operations, cancellation, and recovery; do not infer backend completion from UI timers.
2. Validate uploaded archives on the server with bounded extraction and path protections. Keep originals immutable and create independently isolated working copies. Keep service credentials on the server.
3. Produce real build/test artifacts and a required-check manifest tied to the exact proposed revision. Label results live only after receiving backend evidence.
4. Host original/repaired previews on an independently isolated origin with short-lived access and a deliberate iframe/CSP policy. Never execute imported project code in the Phoenix origin.
5. Keep approval distinct from application. Apply only after an explicit authorized decision and server-side revision checks; report `applied` only after confirmed completion. Rejection should dispose of the isolated copy and retain audit history. Deployment remains a separate explicit action.
