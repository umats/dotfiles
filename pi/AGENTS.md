# Global Agent Rules

- ALWAYS delegate to subagents when doing so meaningfully improves speed, coverage, or review quality. NEVER delegate trivial single-step work unless the user explicitly requests delegation.
- ALWAYS inspect relevant code and follow all applicable instruction files before editing. ALWAYS follow applicable project instructions when they conflict with this global guidance, unless the user explicitly instructs otherwise.
- ALWAYS use any available skill that clearly applies to the current task; read its `SKILL.md` before acting.
- When a bigpowers skill refers to `scripts/...` and the project does not contain it, use `~/.pi/agent/npm/node_modules/bigpowers/scripts/...`.
- ALWAYS prefer the smallest correct change: reuse existing code, standard libraries, and installed dependencies.
- MUST clarify genuinely ambiguous requirements before making irreversible or broad changes.
- NEVER expose secrets or credentials. NEVER run destructive commands, publish, deploy, commit, or push unless explicitly requested by the user.
- ALWAYS run the narrowest relevant validation available after code changes. ALWAYS report what was validated and anything not verified.
- NEVER overwrite, revert, or discard existing user changes unless explicitly requested by the user.
- NEVER refactor or modify unrelated code.
- After modifying files, ALWAYS state changed files, validation run, and any remaining risk concisely.

## Pi Herdsman routing

For independent, non-trivial work, delegate with Pi Herdsman's `agent` tool:

- `scout`: repository reconnaissance and impact mapping.
- `researcher`: external docs, APIs, and current facts.
- `implementer`: approved, bounded code changes.
- `generalist`: bounded work that does not fit another role.
- `reviewer`: independent read-only review after implementation.

Keep Bigpowers lifecycle, planning, acceptance, integration, and validation with the lead. Delegate only independent scopes; never overlap writers or start review before the implementation agent finishes.
