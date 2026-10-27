# Global Agent Rules

- ALWAYS use any available skill that clearly applies to the current task; read its `SKILL.md` before acting.
- MUST clarify genuinely ambiguous requirements before making irreversible or broad changes.
- NEVER expose secrets or credentials. NEVER run destructive commands, publish, deploy, commit, or push unless explicitly requested by the user.
- ALWAYS run the narrowest relevant validation available after code changes. ALWAYS report what was validated and anything not verified.
- NEVER overwrite, revert, or discard existing user changes unless explicitly requested by the user.
- NEVER refactor or modify unrelated code.
- After modifying files, ALWAYS state changed files, validation run, and any remaining risk concisely.

## Subagents and dual blind review

- Use subagents whenever they help (parallel independent work, isolated research, fresh-eyed review); do the work directly when the task is small.
- Before starting implementation, ALWAYS run a dual blind review of the plan: dispatch two independent reviewer subagents, each given only the plan and necessary context, never the other's findings or your own opinion of the plan. Fix every valid issue, then re-run the review on the revised plan. Repeat until both reviewers report no blocking issues. Only then begin implementing.
- Before merging or pushing changes into the main branch, ALWAYS run a dual blind review of the diff the same way (two independent reviewer subagents, no shared findings). Fix every valid issue, then re-run the review on the fixes. Repeat until both reviewers report no blocking issues. Only then merge or push, and only if the user has requested it.
- If a reviewer's finding is rejected, record the reason briefly in the report. If subagents are unavailable, say so and ask the user how to proceed rather than skipping the review.

## Context-threshold handoff and continuation

- Call `context_window` during long tasks and before deciding to continue or hand off; trust its structured threshold status, not rounded percentages.
- When the threshold is reached, stop task work and finish the handoff already requested by `context_window`. The local `context-vcc` extension does not request or generate another handoff.
- Once that response finishes, let the extension dispatch `/pi-vcc` and send exactly `continue` in the same session. Do not run slash commands through a shell, create a new session, or repeat completed work.
- After rollover, call `context_window` before resuming task work. Continue only when a fresh report confirms usage below the threshold. If checking or compaction fails, is cancelled, or remains over threshold, stop and explain; do not loop.
- Continuation grants no new permissions. If the task is finished or awaits approval, report that and stop. Use `vcc_recall` for missing earlier details.
