import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const handoffRequest = `The context threshold was reached. Stop task work and write a concise terminal response headed "## Context handoff" with: the current task, completed work, changed files, checks and results, blockers, approval limits, and the exact next step. Do not run more tools. Do not invent work if the task is complete or blocked on user approval. A local extension will compact with /pi-vcc and supply this handoff when resuming.`;

export default function contextVcc(pi: ExtensionAPI): void {
  type Phase = "idle" | "pending" | "handoff" | "dispatch" | "compacting" | "resume" | "checking";
  let phase: Phase = "idle";
  let armed = true;
  let handoff = "";
  let timer: ReturnType<typeof setTimeout> | undefined;

  function reset(rearm = false): void {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    phase = "idle";
    armed = rearm;
    handoff = "";
  }

  function stop(ctx: ExtensionContext, reason: string): void {
    reset();
    ctx.ui.notify(`Context rollover stopped: ${reason}`, "warning");
  }

  // Compaction is not safe inside an active turn. Never retry a busy or changed session.
  function whenIdle(ctx: ExtensionContext, action: () => void): void {
    const sessionId = ctx.sessionManager.getSessionId();
    const leafId = ctx.sessionManager.getLeafId();
    const expectedPhase = phase;
    timer = setTimeout(() => {
      timer = undefined;
      if (phase !== expectedPhase) return;
      if (ctx.sessionManager.getSessionId() !== sessionId || ctx.sessionManager.getLeafId() !== leafId ||
          !ctx.isIdle() || ctx.hasPendingMessages()) {
        stop(ctx, "the session changed or has other work queued; continue manually.");
        return;
      }
      try {
        action();
      } catch (error) {
        stop(ctx, error instanceof Error ? error.message : String(error));
      }
    }, 0);
  }

  pi.on("session_start", () => reset(true));
  pi.on("session_shutdown", () => reset());
  pi.on("agent_settled", (event) => {
    if (event.aborted) reset();
  });
  pi.on("input", (event) => {
    if (event.source !== "extension") reset(phase === "idle" && armed);
  });

  pi.on("tool_result", (event, ctx) => {
    if (event.toolName !== "context_window") return;
    const report = event.structuredContent;
    const valid = !event.isError && report !== null && typeof report === "object" && !Array.isArray(report) &&
      "available" in report && report.available === true && "usageKnown" in report && report.usageKnown === true &&
      "thresholdError" in report && report.thresholdError === null &&
      "thresholdReached" in report && typeof report.thresholdReached === "boolean";

    if (phase === "checking") {
      if (!valid || report.thresholdReached !== false) {
        stop(ctx, "the fresh threshold check is unavailable or still reached; continue manually.");
        ctx.abort();
      } else {
        reset(true);
      }
      return;
    }
    if (!valid || phase !== "idle") return;
    if (report.thresholdReached === false) {
      armed = true;
    } else if (armed) {
      armed = false;
      phase = "pending";
    }
  });

  pi.on("tool_call", (event) => {
    if (phase === "idle" || event.toolName === "context_window" || event.toolName === "codemode") return;
    return { block: true, reason: phase === "checking"
      ? "Call context_window first; task work is paused until usage is confirmed below the threshold."
      : "Task work is paused for context rollover. Finish the handoff without more tools." };
  });

  pi.on("turn_end", (event) => {
    if (phase !== "handoff" || event.message.role !== "assistant") return;
    const message = event.message;
    handoff = message.stopReason === "stop" && !message.content.some(part => part.type === "toolCall")
      ? message.content.flatMap(part => part.type === "text" ? [part.text] : []).join("\n").trim()
      : "";
  });

  pi.on("agent_before_settle", (event, ctx) => {
    if (phase === "idle") return;
    if (event.outcome !== "completed") {
      stop(ctx, "the run was cancelled or failed.");
      return;
    }
    if (phase === "pending") {
      if (!pi.getCommands().some(command => command.name === "pi-vcc" && command.source === "extension")) {
        stop(ctx, "/pi-vcc is not loaded. Write a handoff and compact manually.");
        return;
      }
      phase = "handoff";
      return {
        entries: [{ type: "custom_message" as const, customType: "context-vcc-handoff",
          content: handoffRequest, display: true }],
        continue: true,
      };
    }
    if (phase === "handoff") {
      if (!handoff) {
        stop(ctx, "no completed handoff was produced; compact manually.");
        return;
      }
      if (event.continue || ctx.hasPendingMessages()) {
        stop(ctx, "another continuation is pending; compact manually when idle.");
        return;
      }
      phase = "dispatch";
      whenIdle(ctx, () => {
        phase = "compacting";
        pi.sendUserMessage("/pi-vcc", { expandPromptTemplates: true });
      });
    } else if (phase === "checking") {
      stop(ctx, "the resumed agent did not complete the required threshold check.");
    }
  });

  pi.on("session_compact", (event, ctx) => {
    if (phase !== "compacting") return;
    const details = event.compactionEntry.details;
    if (!event.fromExtension || event.reason !== "manual" || !details || typeof details !== "object" ||
        !("compactor" in details) || details.compactor !== "pi-vcc") {
      stop(ctx, "compaction was not confirmed as pi-vcc; continue manually.");
      return;
    }
    const prompt = `Context rollover completed with pi-vcc. First call context_window; do not do task work until it confirms usage below the configured threshold. If unavailable or still reached, stop and explain. Then resume only the unfinished, already-authorized task from the handoff below. Preserve all approval limits; do not repeat completed work. If complete or blocked on user approval, report that and stop. Use vcc_recall for missing earlier details.\n\n${handoff}`;
    phase = "resume";
    whenIdle(ctx, () => {
      phase = "checking";
      pi.sendUserMessage(prompt);
    });
  });

  pi.on("session_compact_failed", (_event, ctx) => {
    if (phase === "compacting") stop(ctx, "compaction failed or was cancelled; continue manually.");
  });
}
