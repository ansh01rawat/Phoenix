# Phoenix Backend Architecture and API Audit

## Current architecture

Phoenix is a single Node.js/Express process backed by local SQLite and filesystem storage. `server/index.js` currently combines HTTP routes, demo repair orchestration, database access, preview serving, approval, and rollback. `server/projects.js` contains local import path/name/size validation. `server/verify.js` contains the Northstar Coffee interaction checker. The React/Vite frontend is separate and calls the API.

This is a suitable 12-hour MVP shape: one process and a few modules, without microservices. The repair lifecycle implementation adds a small `server/lifecycle.js` service so state rules are shared and testable.

## Reusable modules and current capabilities

- **Import Manager:** `server/projects.js` validates relative paths, duplicate paths, excluded generated/credential files, base64 input, 200-file and 20 MB limits, safe display names, and best-effort framework/package-manager metadata. The route persists distinct source and sandbox folders under `.phoenix/projects/` and records import activity. Import does not execute project code.
- **Verification Engine (demo only):** `server/verify.js` checks the Northstar button interaction using a stub document. This is a deterministic fixture check, not a browser or general website test runner.
- **Persistence and Activity Logger:** SQLite tables `projects`, `project_audit`, `sessions`, and `audit_log` store imports, repair state, and timestamped events.
- **Demo repair:** `POST /api/sessions` copies Northstar into `.phoenix/sandboxes/`, applies a hardcoded selector replacement, and verifies it.
- **Preview, approval, rejection, rollback:** routes serve two allowlisted demo files, apply changes to the bundled demo source only after approval, discard rejected sandbox state, and restore the previous app file on rollback.

## Small MVP module boundaries

| Module | Responsibility |
| --- | --- |
| Project Manager | Project identity, metadata, state, source/sandbox paths, project listing/details. |
| Import Manager | Upload validation, credential exclusions/limits, framework metadata, source copy and sandbox copy creation. No execution. |
| Sandbox Manager | `server/sandbox.js` defines a Docker-only execution boundary with no network, read-only container root, dropped capabilities, non-root user, resource limits, sandbox-only writes, optional read-only source mount, timeout, and forced cleanup. Docker is unavailable in this environment, so real container execution remains unverified and fails closed. Docker alone is not a complete defense against kernel/runtime vulnerabilities. |
| Diagnostic Engine | Produces evidence-based issue records from a running sandbox. Not implemented for imported sites. |
| AI Repair Orchestrator | `server/repair-orchestrator.js` defines bounded Observer/Architect/Coder and real verifier handoffs. A provider must be injected; explicit mock mode is marked and never approval-ready. No real AI provider is wired without credentials/rule approval. |
| Patch Manager | `server/patches.js` validates sandbox paths and symlink targets, checks before hashes, writes atomically, records hashes/diffs, and supports conflict-safe discard. The Northstar API still uses its deterministic hardcoded repair. |
| Verification Engine | Runs defined checks and persists structured results; current implementation only covers the demo interaction. |
| Preview Manager | Exposes a session preview URL only after verification; current allowlist is Northstar `index.html` and `app.js`. |
| Approval and Commit Manager | Requires explicit approval, checks verification/source baseline, applies controlled changes, records commit/audit metadata. Current implementation writes the bundled demo file directly; no Git commit exists. |
| Rollback Manager | Restores a saved baseline only when the approved source still matches; current implementation covers the demo `app.js`. |
| Activity Logger | Timestamped state transitions and action details in SQLite. |

Keep these as modules/services in the existing backend process. Split route/controller files only when the API surface grows; avoid services or queues for the hackathon MVP.

## Current API endpoints

All API responses are JSON except the HTML/JavaScript preview. Errors generally use `{ "error": "human-readable message" }`.

| Method and path | Current behavior | Success |
| --- | --- | --- |
| `GET /api/health` | Backend liveness. | `200 { ok, service }` |
| `GET /api/ai/status` | Reports whether `OPENAI_API_KEY` and `OPENAI_MODEL` are configured; never returns the key. | `200 { configured, model, keyRequiredOnServer }` |
| `POST /api/ai/budget-estimate` | Accepts a confirmed diagnostic, relevant source text and bounded attempt count; returns a heuristic token and approximate cost estimate using configured per-million-token rates. The estimate endpoint does not send source to OpenAI. | `200` estimate; `400` invalid input |
| `GET /api/projects` | Lists imported projects, now including lifecycle `state: "IMPORTED"`. | `200` array of project metadata |
| `POST /api/projects/import` | Accepts `{ name, files: [{ path, data }] }`, where `data` is base64. Stores untouched source and a separate sandbox copy. Detects best-effort framework, entry point and package manager metadata; does not execute files. | `201` project ID, `state: "IMPORTED"`, framework metadata, counts, `sandboxReady`, message |
| `GET /api/projects/:id` | Project metadata including lifecycle state and import audit events. | `200` project object; `404` if missing |
| `POST /api/sessions` | Starts the bundled Northstar demo repair. It does not accept an imported project ID. | `201` session with canonical `state`, legacy-compatible `status`, allowed transitions, test result, preview URL, explanation, diff and audit |
| `GET /api/sessions/:id` | Gets demo repair state, allowed next transitions, timestamps and audit history. | `200`; `404` if missing |
| `GET /api/sessions/:id/diagnostics` | Retrieves the confirmed Northstar demo diagnostic report. | `200`; `404` if unavailable or missing |
| `GET /api/sessions/:id/progress` | Retrieves the current state and timestamped activity events. | `200`; `404` if missing |
| `GET /api/sessions/:id/patches` | Retrieves the proposed demo patch with hashes and a diff. | `200`; `404` if unavailable or missing |
| `GET /api/sessions/:id/verification` | Retrieves the actual interaction-check result. | `200`; `404` if unavailable or missing |
| `GET /api/sessions/:id/preview` | Retrieves whether the verified session preview is available and its URL. | `200`; `404` if missing |
| `GET /api/sessions/:id/versions` | Lists immutable sandbox snapshots and file hashes. | `200`; `404` if session missing |
| `GET /api/sessions/:id/versions/:versionId` | Retrieves one saved version manifest. | `200`; `404` if missing |
| `POST /api/sessions/:id/versions/:versionId/restore` | Restores a saved version inside the sandbox only, invalidates verification, and leaves the original untouched. | `200`; `409` state/hash conflict |
| `POST /api/sessions/:id/approve` | Rechecks the demo repair, then applies it to the bundled demo source. | `200`; `404` missing, `409` unverified/stale |
| `POST /api/sessions/:id/reject` | Marks the session rejected and removes its sandbox. | `200`; `404` missing, `409` already approved |
| `POST /api/sessions/:id/rollback` | Restores the prior bundled demo file if the current file still matches the approved version. | `200`; `404` missing, `409` invalid state/conflict |
| `GET /preview/:id[/:file]` | Serves allowlisted demo preview files after verification. | HTML/JS; `404` unavailable or disallowed file |

Errors from invalid state transitions return `409` with `{ "error", "from", "to" }`. Other validation/conflict errors return `400` or `409` with `{ "error" }`; missing resources return `404`; oversized uploads return `413`.

The diagnostic/progress/patch/verification/preview-information endpoints above currently serve Northstar demo data. Not implemented: those capabilities for imported projects; GitHub import; actual Git commits/merges.

## Lifecycle and data model

Projects have the `IMPORTED` lifecycle state. Repair sessions use `ANALYZING`, `ISSUE_DETECTED`, `REPAIRING`, `VERIFYING`, `PREVIEW_READY`, `AWAITING_APPROVAL`, `APPROVED`, `REJECTED`, `COMMITTED`, `FAILED`, and `ROLLED_BACK`. State changes are validated in the lifecycle service and stored with `updated_at`; each transition appends a timestamped audit event. Session API responses include the canonical uppercase `state` plus the existing lowercase `status` for frontend compatibility.

Existing SQLite entities are retained: `projects` stores project metadata (ID, name, lifecycle state, best-effort framework/entry point/package manager, import time, source/sandbox paths, file count and bytes); `sessions` stores repair metadata and verification status; `project_audit` and `audit_log` store activity. Lifecycle and import-metadata columns are added with additive migrations so existing local data is preserved. Absolute filesystem paths remain server-side and are not returned to the browser.

## Security and incomplete workflows

- The imported sandbox is currently a filesystem copy, not yet an execution environment. `server/sandbox.js` runs commands only via Docker and fails closed without it; no imported-site execution route is wired yet.
- `new Function` in `server/verify.js` executes the supplied string in the Phoenix Node process. Today it receives only bundled Northstar source; never route imported or model-generated files into it.
- Repair/patch logic, preview paths and diff are Northstar-specific and hardcoded. The current approval path directly writes the bundled demo source and does not create a Git commit.
- Import blocks traversal strings, common generated folders, `.env*`, common credential directories/files, and private-key file extensions. The browser upload contract transfers file bytes and relative names, not filesystem metadata; the backend does not follow user-provided source paths, but cannot prove whether a selected local file originated through a symlink. A native/server-side path importer must add `lstat` and real-path containment checks.
- There is no API authentication or project ownership model. The API binds to `localhost` and rejects non-loopback browser origins on state-changing API requests, but this remains a local single-user MVP rather than a multi-user security boundary.
- OpenAI credentials are read only from the backend process environment (`OPENAI_API_KEY`); the model is selected with `OPENAI_MODEL`. The key is never returned by the status endpoint or sent to the browser. Optional `OPENAI_INPUT_USD_PER_MILLION` and `OPENAI_OUTPUT_USD_PER_MILLION` settings supply current rates; without them Phoenix reports token ceilings but no dollar estimate. AI repair requests are not yet connected to an HTTP repair route because safe isolated verification is unavailable here.
- No AI provider, GitHub importer, imported-project diagnostics, imported-project preview, or general verification engine exists.

## Recommended implementation order

1. Split the current API handlers into route/controller/service modules and exercise the new demo read endpoints through HTTP integration tests.
2. Add a safe native folder importer or improve the browser selection contract to detect symlinks reliably.
3. Install Docker in a controlled development environment and run security/integration tests for the Docker manager before wiring any imported code execution.
4. Add isolated dependency installation, framework startup, preview and cleanup without host execution or default network access.
5. Add imported-site diagnostics and run the three reproducible fixtures through a browser engine, then verified sandbox-only patch application.
6. Add a bounded AI provider interface; keep it disabled unless a permitted provider and backend-only credentials are configured.
7. Add imported-project approval/commit/rollback with stale-source detection, full backups and route-level tests.
8. Add GitHub import and frontend integration only when authorized, then run end-to-end and security checks.

The lifecycle change does not claim imported-site repair, secure arbitrary-code execution, AI, GitHub, or real Git commit support.

## Roadmap implementation status

- **API contracts:** Lifecycle and Northstar demo diagnostic, progress, patch, verification and preview-information endpoints are implemented. Imported projects do not have repair-session endpoints yet; route/controller/service extraction and HTTP integration tests remain pending.
- **Import engine:** Best-effort framework/entry-point/package-manager metadata and common credential exclusions are implemented. Imports remain unexecuted.
- **Sandbox manager:** A constrained Docker-only runner is implemented and tested for path checks and fail-closed behavior. Docker is absent here; real container execution is not tested or available.
- **AI and patching:** A bounded provider-injected orchestrator, OpenAI Responses API structured-output provider and atomic sandbox-only patch manager are implemented. Explicit test mock mode cannot set approval-ready; the live provider requires backend environment configuration and is not connected to a repair HTTP route until isolated verification is available.
- **Fixtures:** Three independent sites cover a broken button, missing image and broken navigation route. Tests assert each fixture's reproduction target and expected repair. They are not run through a browser diagnostic engine.
- **Remaining phases:** Imported website execution/preview/diagnostics/repairs, real AI provider, route/controller separation, GitHub import, and imported-project approval/rollback are still pending.
