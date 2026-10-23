# Global Agent Rules

- ALWAYS delegate to subagents when doing so meaningfully improves speed, coverage, or review quality. NEVER delegate trivial single-step work unless the user explicitly requests delegation.
- ALWAYS inspect relevant code and follow all applicable instruction files before editing. ALWAYS follow applicable project instructions when they conflict with this global guidance, unless the user explicitly instructs otherwise.
- ALWAYS use any available skill that clearly applies to the current task; read its `SKILL.md` before acting.
- ALWAYS prefer the smallest correct change: reuse existing code, standard libraries, and installed dependencies.
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

## Subagent routing

For independent, non-trivial work, use the available subagent tool (`subagent` with pi-subagents). Choose an available agent suited to the role:

- `scout`: repository reconnaissance and impact mapping.
- `researcher`: external docs, APIs, and current facts.
- `implementer`: approved, bounded code changes.
- `generalist`: bounded work that does not fit another role.
- `reviewer`: independent read-only review after implementation.

Keep lifecycle, planning, acceptance, integration, and validation with the lead. Delegate only independent scopes; never overlap writers or start review before the implementation agent finishes.
