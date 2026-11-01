# Phoenix repair-loop starter

A local prototype for the Phoenix AI repair loop. It copies a project into a per-run baseline and workspace, sends only selected text source files from the workspace to an OpenAI Agents SDK agent, applies the agent's structured file edits only in that workspace, and writes a diff and report for later review.

This is a prototype, not a hardened sandbox. It does not execute project code, run tests, preview the site, apply changes to the user's project, or deploy. The rulebook must still confirm the SDK, model, and source-data handling are permitted. The project text selected for analysis is sent to the configured OpenAI model.

## Local setup

Use Python 3.10 or newer. From this folder:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:OPENAI_API_KEY = 'your-key'
$env:OPENAI_MODEL = 'model-approved-for-your-team'
```

Keep the API key in an environment variable. Never commit it or put it in the user project.

## Run

```powershell
python repair_agent.py "C:\path\to\input-project" "Describe the bug and expected behavior"
```

Run data is stored under `.phoenix\runs\<run-id>\` in the current directory. It contains:

- `baseline\` — copied reference snapshot
- `workspace\` — the only copy this program writes to
- `proposal.json` — diagnosis and explanation
- `diff.patch` — changes between the baseline and workspace

The input project is read only by this program. Review the diff and workspace manually. Do not treat this prototype as a strong operating-system sandbox; it does not run untrusted project code.
