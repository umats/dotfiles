import type { HookAPI } from "@oh-my-pi/pi-coding-agent/extensibility/hooks"

/**
 * code-review-graph hook for Oh My Pi.
 *
 * Keeps the knowledge graph up-to-date and surfaces status
 * information automatically during coding sessions.
 *
 * Installed by: code-review-graph install --platform omp
 */

export default function (pi: HookAPI): void {
  // 1. Show graph status when a new session starts
  pi.on("session_start", async (_event, ctx) => {
    try {
      const result = await pi.exec("code-review-graph", ["status", "--brief"])
      if (result.stdout) {
        ctx.logger.info("[code-review-graph] " + result.stdout.trim())
      }
    } catch {
      // Swallow — not every project has a graph.
    }
  })

  // 2. Auto-update graph after file edits
  pi.on("tool_result", async (event, _ctx) => {
    try {
      if (event.toolName !== "write" && event.toolName !== "edit") return
      await pi.exec("code-review-graph", ["update", "--skip-flows"])
    } catch {
      // Swallow — graph may not be built yet for this project.
    }
  })
}
