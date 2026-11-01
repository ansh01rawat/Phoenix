# Project Phoenix

Phoenix is an AI-powered agent that diagnoses and repairs a user's website source code. It works in an isolated sandbox, verifies proposed fixes, and applies them to the original project only after the user explicitly approves.

## Workflow

1. **Import** the website source from a GitHub repository or local project.
2. **Create an isolated sandbox** based on the imported source and record its starting commit.
3. **Diagnose** the issue from logs, errors, and the observed failure.
4. **Plan and repair** the code inside the sandbox only.
5. **Verify** the repair with automated tests and launch a preview when verification passes.
6. **Review** the preview, test results, proposed changes, and a plain-language explanation.
7. **Approve or reject:** approval applies the verified changes to the original project through a controlled Git commit or merge; rejection discards the sandbox changes.

## Safeguards

- The original project is not modified during diagnosis, repair, or testing.
- Failed tests prevent a repair from becoming ready for approval.
- Phoenix never deploys changes to a live website automatically.
- Repair actions and commits are recorded for auditing; approved changes can be rolled back.

## Hackathon MVP

Start with one reproducible website failure, a sandbox-only code repair, and a regression test that proves recovery. Then add the user preview and approval flow. Technology choices remain subject to the official hackathon rules.
