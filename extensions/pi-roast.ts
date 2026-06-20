import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import insultsData from "./insults.json" with { type: "json" };
import { ShuffleBag } from "./shuffle-bag.js";
import { MATCH_RULES } from "./context-matcher.js";
import { createRoastEngine } from "./roast-engine.js";
import { createWidget, type ThemeFgColor } from "./widget.js";
import { createEnabledState } from "./enabled-state.js";
import { createIdleScheduler } from "./idle-scheduler.js";

// ─── Type Validation ──────────────────────────────────────────────────────────

interface InsultsData {
  general: string[];
  failures: string[];
  contextual: Record<string, string[]>;
}

function validateInsultsData(data: unknown): InsultsData {
  if (typeof data !== "object" || data === null) throw new Error("insults.json: expected object");
  const d = data as Record<string, unknown>;
  for (const key of ["general", "failures", "contextual"] as const) {
    if (!Array.isArray(d[key]) && key !== "contextual") {
      throw new Error(`insults.json: expected "${key}" to be an array`);
    }
  }
  if (typeof d.contextual !== "object" || d.contextual === null) {
    throw new Error("insults.json: expected 'contextual' to be an object");
  }
  for (const [cat, val] of Object.entries(d.contextual as Record<string, unknown>)) {
    if (!Array.isArray(val)) throw new Error(`insults.json: contextual.${cat} must be an array`);
    for (const item of val) {
      if (typeof item !== "string") throw new Error(`insults.json: contextual.${cat} must contain strings`);
    }
  }
  return data as InsultsData;
}

// Validate at load time — fail fast if the data file is malformed
const insults = validateInsultsData(insultsData);

// ─── Constants ────────────────────────────────────────────────────────────────

/** Valid theme foreground color names. */
const THEME_FG_COLORS = [
  "text", "accent", "muted", "dim",
  "success", "error", "warning",
  "border", "borderAccent", "borderMuted",
] as const;

interface ToolCallEvent {
  toolName: string;
  input: unknown;
}

interface ToolResultEvent {
  isError?: boolean;
  result?: {
    isError?: boolean;
  };
}

// ─── Model-switch roasts ──────────────────────────────────────────────────────

const modelRoasts = [
  "Switching models? Running from your problems again.",
  "New model, same mistakes.",
  "Good luck with that one. It'll need it.",
  "The model changed but your code didn't.",
  "Maybe this one can fix what you broke.",
  "Different model, same skill issues.",
  "A new model won't save you from yourself.",
  "Opus called. They want their tokens back.",
  "New model, same dev. Try harder.",
  "No. No. Don't change models. Change developers!",
  "What? You're calling ALL the models to help you.",
  "New model? Have you tried baking instead of coding?",
];

// ─── Extension ──────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  // Build ShuffleBags
  const generalBag = new ShuffleBag(insults.general);
  const failureBag = new ShuffleBag(insults.failures);
  const modelBag = new ShuffleBag(modelRoasts);
  const contextualBags = new Map<string, ShuffleBag<string>>();
  for (const [category, lines] of Object.entries(insults.contextual)) {
    contextualBags.set(category, new ShuffleBag(lines));
  }

  // Create sub-modules
  const engine = createRoastEngine({
    generalBag,
    failureBag,
    modelBag,
    contextualBags,
    rules: MATCH_RULES,
    config: {
      highPriorityTools: new Set(["bash", "write", "edit"]),
      lowPriorityTools: new Set(["read"]),
      readInsultChance: 0.3,
      failureInsultChance: 0.5,
      unclassifiedToolChance: 0.15,
    },
  });

  // Single EnabledState: branch is bound on session_start via currentBranch holder.
  let currentBranch: unknown[] = [];
  const enabledState = createEnabledState({
    getBranch: () => currentBranch as Array<{ type: string; customType?: string; data?: { enabled?: boolean } }>,
    appendEntry: (type, data) => pi.appendEntry(type, data),
  });

  const idleScheduler = createIdleScheduler({
    idleMinMs: 45_000,
    idleMaxMs: 120_000,
  });

  // Mutable state: narrow holders for current UI + enabled flag + color
  let currentUi: { setWidget: (key: string, widget: unknown) => void } | null = null;
  let enabled = true;
  let color: ThemeFgColor = "accent";

  // Widget bound to currentUi — recreated when ui changes
  function getWidget() {
    if (!currentUi) return null;
    return createWidget(currentUi);
  }

  function roast(insult?: string): void {
    const widget = getWidget();
    if (!widget) return;
    const text = insult ?? generalBag.next();
    widget.render(text, color);
  }

  // Single idle-roast schedule: roasts from generalBag if still enabled when the timer fires.
  function scheduleIdleRoast(): void {
    idleScheduler.schedule(() => {
      if (!enabled) return;
      const insult = engine.onIdleTick();
      if (insult) roast(insult);
    });
  }

  // ── Commands ──

  pi.registerCommand("roast", {
    description: "Toggle pi-roast on/off",
    handler: async (_args, ctx) => {
      currentUi = ctx.ui;
      enabled = !enabled;
      enabledState.save(enabled);

      if (enabled) {
        ctx.ui.notify("🔥 pi-roast activated", "info");
        roast();
        scheduleIdleRoast();
      } else {
        ctx.ui.notify("🔇 pi-roast muted", "info");
        idleScheduler.pause();
        getWidget()?.clear();
      }
    },
  });

  pi.registerCommand("roast-me", {
    description: "Get roasted on demand (works even when muted)",
    handler: async (_args, ctx) => {
      currentUi = ctx.ui;
      roast();
    },
  });

  pi.registerCommand("roast-color", {
    description: `Set roast text color. Options: ${THEME_FG_COLORS.join(", ")}`,
    handler: async (args, ctx) => {
      const newColor = args.trim().toLowerCase();
      if (!THEME_FG_COLORS.includes(newColor as ThemeFgColor)) {
        ctx.ui.notify(`Invalid color "${newColor}". Options: ${THEME_FG_COLORS.join(", ")}`, "error");
        return;
      }
      color = newColor as ThemeFgColor;
      ctx.ui.notify(`🔥 Roast color set to ${newColor}`, "info");
      if (enabled) {
        roast();
      }
    },
  });

  // ── Events ──

  pi.on("session_start", async (_event, ctx) => {
    currentUi = ctx.ui;
    currentBranch = ctx.sessionManager.getBranch();
    enabled = enabledState.load();

    if (enabled) {
      ctx.ui.notify("🔥 pi-roast activated", "info");
      roast();
      scheduleIdleRoast();
    }
  });

  // ── Turn lifecycle ──

  pi.on("turn_start", async () => {
    idleScheduler.pause();
  });

  pi.on("turn_end", async (_event, ctx) => {
    currentUi = ctx.ui;
    if (enabled) scheduleIdleRoast();
  });

  pi.on("agent_end", async (_event, ctx) => {
    currentUi = ctx.ui;
    if (enabled) scheduleIdleRoast();
  });

  // ── Tool events ──

  pi.on("tool_call", async (event: ToolCallEvent, ctx) => {
    currentUi = ctx.ui;
    if (!enabled) return;
    const insult = engine.onToolCall(event.toolName, event.input);
    if (insult) roast(insult);
  });

  pi.on("tool_result", async (event: ToolResultEvent, ctx) => {
    currentUi = ctx.ui;
    if (!enabled) return;
    const isError = Boolean(event.isError ?? event.result?.isError);
    const insult = engine.onToolResult(isError);
    if (insult) roast(insult);
  });

  // ── Model events ──

  pi.on("model_select", async (_event, ctx) => {
    currentUi = ctx.ui;
    if (!enabled) return;
    const insult = engine.onModelSelect();
    if (insult) roast(insult);
  });

  // ── Session lifecycle ──

  pi.on("session_before_switch", async () => {
    idleScheduler.pause();
    getWidget()?.clear();
    currentUi = null;
  });

  pi.on("session_shutdown", async () => {
    idleScheduler.pause();
    getWidget()?.clear();
    currentUi = null;
  });
}
