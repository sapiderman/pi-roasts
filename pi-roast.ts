import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import insultsData from "./insults.json";

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

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface RoastConfig {
  idleMinMs: number;
  idleMaxMs: number;
  readInsultChance: number;
  failureInsultChance: number;
  unclassifiedToolChance: number;
  highPriorityTools: string[];
  lowPriorityTools: string[];
}

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── ShuffleBag ─────────────────────────────────────────────────────────────────

class ShuffleBag<T> {
  private pool: T[];
  private remaining: T[];
  private lastDrawn: T | null = null;

  constructor(items: T[]) {
    this.pool = [...items];
    this.remaining = [];
  }

  private shuffle(): void {
    for (let i = this.remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.remaining[i], this.remaining[j]] = [this.remaining[j], this.remaining[i]];
    }
  }

  next(): T {
    if (this.remaining.length === 0) {
      this.remaining = [...this.pool];
      this.shuffle();
      // Prevent cross-cycle repeat
      if (this.lastDrawn !== null && this.remaining.length > 1) {
        const lastIdx = this.remaining.length - 1;
        if (this.remaining[lastIdx] === this.lastDrawn) {
          const swapIdx = Math.floor(Math.random() * (this.remaining.length - 1));
          [this.remaining[lastIdx], this.remaining[swapIdx]] = [
            this.remaining[swapIdx],
            this.remaining[lastIdx],
          ];
        }
      }
    }
    const item = this.remaining.pop()!;
    this.lastDrawn = item;
    return item;
  }
}

// ─── Context-Aware Insult Matchers ────────────────────────────────────────────

// Build ShuffleBags for each contextual category — guarantees no-repeat per category
const contextualBags = new Map<string, ShuffleBag<string>>();
for (const [category, lines] of Object.entries(insults.contextual)) {
  contextualBags.set(category, new ShuffleBag(lines));
}

function getContextInsult(toolName: string, input: unknown, bags: Map<string, ShuffleBag<string>>): string | null {
  if (typeof input !== "object" || input === null) return null;
  const inp = input as Record<string, unknown>;
  const command = typeof inp.command === "string" ? inp.command : "";
  const path = typeof inp.path === "string" ? inp.path : "";
  const message = typeof inp.message === "string" ? inp.message : "";

  // Bash / Git command patterns
  if (toolName === "bash" && command) {
    if (/\brm\s+-rf\b/.test(command)) return bags.get("rm_rf")?.next() ?? null;
    if (/git\s+push\s+--(-force|f)\b/.test(command)) return bags.get("force_push")?.next() ?? null;
    if (/git\s+commit\b/.test(command)) return bags.get("git_commit")?.next() ?? null;
    if (/\bsudo\b/.test(command)) return bags.get("sudo")?.next() ?? null;
    if (/\b(npm\s+install|yarn\s+add|pnpm\s+add)\b/.test(command)) return bags.get("npm_install")?.next() ?? null;
    if (/\bcurl\b/.test(command)) return bags.get("curl")?.next() ?? null;
    if (/\bchmod\b/.test(command)) return bags.get("chmod")?.next() ?? null;
    if (/\bdocker\b/.test(command)) return bags.get("docker")?.next() ?? null;
    if (/\bkill\b/.test(command)) return bags.get("kill")?.next() ?? null;
  }

  // Git commit via a wrapper tool — match exact tool names, not loose substring
  if (message && (toolName === "git" || toolName === "git_commit" || toolName === "github")) {
    return bags.get("git_commit")?.next() ?? null;
  }

  // File path patterns
  if (path) {
    if (/\.env\b/.test(path)) return bags.get("env_file")?.next() ?? null;
    if (/package\.json$/.test(path)) return bags.get("package_json")?.next() ?? null;
    if (/\.(yaml|yml)$/i.test(path)) return bags.get("yaml")?.next() ?? null;

    // Exact word match for temp dirs/files to avoid path false positives
    if (/\b(temp|tmp|hack|wip|fix)\b/i.test(path)) return bags.get("temp_file")?.next() ?? null;

    if (/README/i.test(path)) return bags.get("readme")?.next() ?? null;
    if (/config/i.test(path) && !/node_modules/.test(path)) return bags.get("config")?.next() ?? null;
    if (/node_modules/.test(path)) return bags.get("node_modules")?.next() ?? null;
    if (/\.(test|spec)\./i.test(path)) return bags.get("test_file")?.next() ?? null;
  }

  return null;
}

// ─── Model-switch roasts ──────────────────────────────────────────────────────

const MODEL_ROASTS = [
  "Switching models? Running from your problems again.",
  "New model, same mistakes.",
  "Good luck with that one. It'll need it.",
  "The model changed but your code didn't.",
  "Maybe this one can fix what you broke.",
  "Different model, same skill issues.",
  "A new model won't save you from yourself.",
];

// ─── Constants & Settings ───────────────────────────────────────────────────────

const WIDGET_KEY = "pi-roast";
const ENABLED_CUSTOM_TYPE = "pi-roast-enabled";

const DEFAULT_CONFIG: RoastConfig = {
  idleMinMs: 45_000,
  idleMaxMs: 120_000,
  readInsultChance: 0.3,
  failureInsultChance: 0.5,
  unclassifiedToolChance: 0.15,
  highPriorityTools: ["bash", "write", "edit"],
  lowPriorityTools: ["read"],
};

// ─── Extension ──────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  const bag = new ShuffleBag(insults.general);
  const failureBag = new ShuffleBag(insults.failures);

  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let lastCtx: any = null;
  let enabled = true;

  // ── Helpers ──

  function getConfig(): RoastConfig {
    return DEFAULT_CONFIG;
  }

  function getConfigSets(): { high: Set<string>; low: Set<string> } {
    const cfg = getConfig();
    return {
      high: new Set(cfg.highPriorityTools),
      low: new Set(cfg.lowPriorityTools),
    };
  }

  async function loadEnabledState(ctx: any): Promise<void> {
    enabled = true;
    const entries = ctx.sessionManager.getBranch();
    // Walk in reverse to find the most recent enabled state
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      if (entry.type === "custom" && entry.customType === ENABLED_CUSTOM_TYPE) {
        enabled = entry.data?.enabled ?? true;
        return;
      }
    }
  }

  async function saveEnabledState(): Promise<void> {
    pi.appendEntry(ENABLED_CUSTOM_TYPE, { enabled });
  }

  // ── Core roast functions ──

  function roast(insult?: string): void {
    if (!lastCtx) return;
    const text = "🔥 " + (insult ?? bag.next());
    lastCtx.ui.setWidget(WIDGET_KEY, [text]);
  }

  function roastAndResetIdle(insult?: string): void {
    if (!enabled) return;
    roast(insult);
    // Don't schedule idle here — the agent is actively working.
    // Idle roast resumes on turn_end.
  }

  function clearStatus(): void {
    if (lastCtx) {
      lastCtx.ui.setWidget(WIDGET_KEY, undefined);
    }
  }

  // ── Idle timer ──

  function scheduleIdleRoast(): void {
    stopIdleRoast();
    const config = getConfig();
    const delay = randomBetween(config.idleMinMs, config.idleMaxMs);
    idleTimer = setTimeout(() => {
      if (enabled && lastCtx) roast();
      // Don't reschedule — pause roasting until next activity.
      // turn_end / agent_end events will restart the cycle when the user is back.
    }, delay);
  }

  function stopIdleRoast(): void {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  }

  // ── Commands ──

  pi.registerCommand("roast", {
    description: "Toggle pi-roast on/off",
    handler: async (_args, ctx) => {
      lastCtx = ctx;
      enabled = !enabled;
      await saveEnabledState();

      if (enabled) {
        ctx.ui.notify("🔥 pi-roast activated", "info");
        ctx.ui.setWidget(WIDGET_KEY, ["🔥 " + bag.next()]);
        scheduleIdleRoast();
      } else {
        ctx.ui.notify("🔇 pi-roast muted", "info");
        stopIdleRoast();
        clearStatus();
      }
    },
  });

  pi.registerCommand("roast-me", {
    description: "Get roasted on demand (works even when muted)",
    handler: async (_args, ctx) => {
      lastCtx = ctx;
      ctx.ui.setWidget(WIDGET_KEY, ["🔥 " + bag.next()]);
    },
  });

  // ── Events ──

  pi.on("session_start", async (_event, ctx) => {
    lastCtx = ctx;
    await loadEnabledState(ctx);

    if (enabled) {
      ctx.ui.notify("🔥 pi-roast activated", "info");
      ctx.ui.setWidget(WIDGET_KEY, ["🔥 " + bag.next()]);
      scheduleIdleRoast();
    }
  });

  // ── Turn lifecycle: pause idle during active work, resume when idle ──

  pi.on("turn_start", async () => {
    stopIdleRoast();
  });

  pi.on("turn_end", async (_event, ctx) => {
    lastCtx = ctx;
    if (enabled) scheduleIdleRoast();
  });

  pi.on("agent_end", async (_event, ctx) => {
    lastCtx = ctx;
    if (enabled) scheduleIdleRoast();
  });

  // ── Tool events ──

  pi.on("tool_call", async (event: ToolCallEvent, ctx) => {
    lastCtx = ctx;
    if (!enabled) return;

    const config = getConfig();
    const { high, low } = getConfigSets();
    const contextInsult = getContextInsult(event.toolName, event.input, contextualBags);

    if (high.has(event.toolName)) {
      roastAndResetIdle(contextInsult ?? undefined);
    } else if (low.has(event.toolName)) {
      if (Math.random() < config.readInsultChance) {
        roastAndResetIdle(contextInsult ?? undefined);
      }
    } else {
      // Unclassified tools get a small chance to roast
      if (Math.random() < config.unclassifiedToolChance) {
        roastAndResetIdle(contextInsult ?? undefined);
      }
    }
  });

  pi.on("tool_result", async (event: ToolResultEvent, ctx) => {
    lastCtx = ctx;
    if (!enabled) return;

    const config = getConfig();
    const isError = Boolean(event.isError ?? event.result?.isError);

    if (isError && Math.random() < config.failureInsultChance) {
      roastAndResetIdle(failureBag.next());
    }
  });

  // ── Model events ──

  pi.on("model_select", async (event, ctx) => {
    lastCtx = ctx;
    if (!enabled) return;

    const insult = MODEL_ROASTS[Math.floor(Math.random() * MODEL_ROASTS.length)];
    roastAndResetIdle(insult);
  });

  // ── Session lifecycle ──

  pi.on("session_before_switch", async () => {
    stopIdleRoast();
    clearStatus();
    lastCtx = null;
  });

  pi.on("session_shutdown", async () => {
    stopIdleRoast();
    clearStatus();
    lastCtx = null;
  });
}