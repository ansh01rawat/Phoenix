# Phoenix backend

This is the standalone Express/SQLite backend for Project Phoenix. It runs separately from the React/Vite frontend, which currently uses sample services; frontend-to-API integration is still pending.

## Requirements

- Node.js 22.12 or later
- Docker Desktop for isolated command execution (the runner fails closed when Docker is unavailable)

## Run

From this directory:

```powershell
npm ci
npm run dev
```

The API listens on `http://localhost:3001` by default. Set `PORT` to override it. Configure `OPENAI_API_KEY` and `OPENAI_MODEL` in the backend process environment to enable the provider. To estimate cost in USD, also set `OPENAI_INPUT_USD_PER_MILLION` and `OPENAI_OUTPUT_USD_PER_MILLION` using current rates for the selected model. Phoenix never returns the API key to the browser. Cost estimates use a token heuristic; actual cost is calculated from provider-reported token usage when available.

Run backend checks with:

```powershell
npm test
```

The local `.phoenix/` directory stores SQLite state, imported source and sandbox copies, and repair snapshots. It is ignored by Git.

Imported project code is not yet generally executable or repairable through the API. The currently wired repair is the bundled demo; do not treat Docker as a complete security boundary for arbitrary hostile code.
