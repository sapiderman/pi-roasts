import { ShuffleBag } from "./shuffle-bag.js";
import { matchContext, type MatchRule, type ToolSignal } from "./context-matcher.js";

// ─── RoastEngine ──────────────────────────────────────────────────────────────

export interface RoastEngineConfig {
  highPriorityTools: Set<string>;
  lowPriorityTools: Set<string>;
  readInsultChance: number;
  failureInsultChance: number;
  /** Tools whose failures never trigger a failure roast (e.g. read retries on missing files). */
  failureExcludedTools: Set<string>;
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
  onToolResult(isError: boolean, toolName?: string): string | null;
  onModelSelect(): string | null;
  onIdleTick(): string | null;
}

function extractPath(inp: Record<string, unknown>): string | undefined {
  for (const key of [
    "path",
    "filePath",
    "targetFile",
    "file",
    "file_path",
    "fileName",
    "filename",
    "target_file",
    "TargetFile",
    "destination",
    "dest",
  ]) {
    if (typeof inp[key] === "string" && inp[key]) {
      return inp[key] as string;
    }
  }
  return undefined;
}

/**
 * Extracts signal values from the tool call input.
 * Shared between the engine and the matcher.
 */
export function extractSignals(toolName: string, input: unknown): ToolSignal {
  if (typeof input !== "object" || input === null) {
    return { toolName };
  }
  const inp = input as Record<string, unknown>;
  return {
    toolName,
    command: typeof inp.command === "string" ? inp.command : undefined,
    path: extractPath(inp),
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

  function onToolResult(isError: boolean, toolName = ""): string | null {
    if (isError && !config.failureExcludedTools.has(toolName) && rng() < config.failureInsultChance) {
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
