import { ShuffleBag } from "./shuffle-bag.js";
import { matchContext, type MatchRule, type ToolSignal } from "./context-matcher.js";

// ─── RoastEngine ──────────────────────────────────────────────────────────────

export interface RoastEngineConfig {
  highPriorityTools: Set<string>;
  lowPriorityTools: Set<string>;
  readInsultChance: number;
  failureInsultChance: number;
  unclassifiedToolChance: number;
}

export interface RoastEngineDeps {
  generalBag: ShuffleBag<string>;
  failureBag: ShuffleBag<string>;
  modelBag: ShuffleBag<string>;
  contextualBags: Map<string, ShuffleBag<string>>;
  rules: MatchRule[];
  config: RoastEngineConfig;
  rng?: () => number; // defaults to Math.random; injectable for deterministic tests
}

export interface RoastEngine {
  onToolCall(toolName: string, input: unknown): string | null;
  onToolResult(isError: boolean): string | null;
  onModelSelect(): string | null;
  onIdleTick(): string | null;
}

/**
 * Extracts signal values from the tool call input.
 * Shared between the engine and the matcher.
 */
function extractSignals(toolName: string, input: unknown): ToolSignal {
  if (typeof input !== "object" || input === null) {
    return { toolName };
  }
  const inp = input as Record<string, unknown>;
  return {
    toolName,
    command: typeof inp.command === "string" ? inp.command : undefined,
    path: typeof inp.path === "string" ? inp.path : undefined,
    message: typeof inp.message === "string" ? inp.message : undefined,
  };
}

/**
 * Creates a RoastEngine that encapsulates the "when to roast, from which bag,
 * at what probability" policy. The engine returns an insult string or null.
 * It does NOT touch ui, enabled, or timers — the caller decides whether to render.
 */
export function createRoastEngine(deps: RoastEngineDeps): RoastEngine {
  const {
    generalBag,
    failureBag,
    modelBag,
    contextualBags,
    rules,
    config,
    rng = Math.random,
  } = deps;

  function onToolCall(toolName: string, input: unknown): string | null {
    const signal = extractSignals(toolName, input);
    const category = matchContext(rules, signal);
    const contextInsult = category ? (contextualBags.get(category)?.next() ?? null) : null;

    // High-priority tools always roast
    if (config.highPriorityTools.has(toolName)) {
      return contextInsult ?? generalBag.next();
    }

    // Low-priority tools roast with readInsultChance
    if (config.lowPriorityTools.has(toolName)) {
      if (rng() < config.readInsultChance) {
        return contextInsult ?? generalBag.next();
      }
      return null;
    }

    // Unclassified tools roast with unclassifiedToolChance
    if (rng() < config.unclassifiedToolChance) {
      return contextInsult ?? generalBag.next();
    }

    return null;
  }

  function onToolResult(isError: boolean): string | null {
    if (isError && rng() < config.failureInsultChance) {
      return failureBag.next();
    }
    return null;
  }

  function onModelSelect(): string | null {
    return modelBag.next();
  }

  function onIdleTick(): string | null {
    return generalBag.next();
  }

  return { onToolCall, onToolResult, onModelSelect, onIdleTick };
}
