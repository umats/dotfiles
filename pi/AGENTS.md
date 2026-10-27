# Global Agent Rules

- ALWAYS use any available skill that clearly applies to the current task; read its `SKILL.md` before acting.
- MUST clarify genuinely ambiguous requirements before making irreversible or broad changes.
- NEVER expose secrets or credentials. NEVER run destructive commands, publish, deploy, commit, or push unless explicitly requested by the user.
- ALWAYS run the narrowest relevant validation available after code changes. ALWAYS report what was validated and anything not verified.
- NEVER overwrite, revert, or discard existing user changes unless explicitly requested by the user.
- NEVER refactor or modify unrelated code.
- After modifying files, ALWAYS state changed files, validation run, and any remaining risk concisely.

## Context-threshold handoff and continuation

- Call `context_window` during long tasks and before deciding to continue or hand off; trust its structured threshold status, not rounded percentages.
- When the threshold is reached, stop task work and finish the handoff already requested by `context_window`. The local `context-vcc` extension does not request or generate another handoff.
- Once that response finishes, let the extension dispatch `/pi-vcc` and send exactly `continue` in the same session. Do not run slash commands through a shell, create a new session, or repeat completed work.
- After rollover, call `context_window` before resuming task work. Continue only when a fresh report confirms usage below the threshold. If checking or compaction fails, is cancelled, or remains over threshold, stop and explain; do not loop.
- Continuation grants no new permissions. If the task is finished or awaits approval, report that and stop. Use `vcc_recall` for missing earlier details.
