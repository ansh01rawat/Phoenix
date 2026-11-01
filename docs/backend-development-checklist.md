# Phoenix Development Baseline Checklist

Use this checklist before and after changes. Keep the isolated-repair safeguards and the current demo/import workflows intact.

## Recorded baseline — 2026-11-01

- [x] Identified the existing commands from `package.json`.
- [x] Ran `npm test`: **passed, 6 tests, 0 failures**.
- [x] Ran `npm run build`: **passed** (Vite 4.5.14 production build).
- [x] Checked `git status`: the working tree already contains user changes. Preserve them; do not reset, clean, overwrite, commit, or push them as part of routine development.
- Commit and push remain out of scope; this checklist does not authorize either action.

## Before changing code

- [ ] Run `git status --short --branch` and note existing edits/untracked files.
- [ ] Read the affected implementation and existing tests before editing.
- [ ] Confirm the proposed change stays within the sandbox workflow; never execute imported project code in the Phoenix server process.
- [ ] Avoid rewriting working Northstar Coffee demo, local folder import, dashboard, approval/rejection, or rollback behavior.
- [ ] Keep user source untouched during diagnosis, repair, and testing. Never auto-deploy.

## After changing code

- [ ] Run `npm test` and record the test count and result.
- [ ] Run `npm run build` and confirm it succeeds.
- [ ] Run `git diff --check` and inspect `git status --short --branch`.
- [ ] Smoke-check the Northstar Coffee broken-button repair, passing verification, preview, approval, rejection, and rollback paths.
- [ ] Smoke-check local folder import: source and sandbox copies are distinct; excluded files stay excluded; imported code is not run.
- [ ] Confirm failed verification blocks approval and rejected/failed work does not alter the source.
- [ ] Review the final diff for unintended edits and keep audit/rollback behavior intact.

## Commands

Install dependencies:

```sh
npm install
```

Run the local development app (two terminals):

```sh
npm run server
npm run dev
```

Run checks:

```sh
npm test
npm run build
git diff --check
```

Run the built app:

```sh
npm start
```

The frontend development server is the Vite URL printed by `npm run dev`; the backend listens on port 3001 by default. Local session state and imported projects are stored under `.phoenix/`.
