// ─── Context Matcher ────────────────────────────────────────────────────────────

/**
 * Data-driven context matcher that replaces the 30-branch if-chain.
 * Rule definition, rule execution, and insult delivery are separate concerns.
 */

type Signal = "command" | "path" | "message" | "toolName";

export interface MatchRule {
  signal: Signal;
  /** regex tested against the signal value */
  pattern: RegExp;
  /** key into insults.contextual */
  category: string;
  /** optional toolName gate — rule only fires when toolName matches exactly */
  toolGate?: string;
  /** optional negative path gate — rule is skipped when this regex matches the path */
  negativePathGate?: RegExp;
}

export interface ToolSignal {
  toolName: string;
  command?: string;
  path?: string;
  message?: string;
}

/**
 * Rule table — order = priority. First match wins.
 * Preserves the exact source order from the original getContextInsult if-chain.
 */
export const MATCH_RULES: MatchRule[] = [
  // Bash / Git command patterns (gated on toolName === "bash")
  { signal: "command", toolGate: "bash", pattern: /\brm\s+-rf\b/, category: "rm_rf" },
  { signal: "command", toolGate: "bash", pattern: /git\s+push\s+(-f\b|--force\b|--f\b)/, category: "force_push" },
  { signal: "command", toolGate: "bash", pattern: /git\s+commit\b/, category: "git_commit" },
  { signal: "command", toolGate: "bash", pattern: /\bsudo\b/, category: "sudo" },
  { signal: "command", toolGate: "bash", pattern: /\b(npm\s+install|yarn\s+add|pnpm\s+add)\b/, category: "npm_install" },
  { signal: "command", toolGate: "bash", pattern: /\bcurl\b/, category: "curl" },
  { signal: "command", toolGate: "bash", pattern: /\bchmod\b/, category: "chmod" },
  { signal: "command", toolGate: "bash", pattern: /\bdocker-compose\b/, category: "docker_compose" },
  { signal: "command", toolGate: "bash", pattern: /\bdocker\b/, category: "docker" },
  { signal: "command", toolGate: "bash", pattern: /\bkill\b/, category: "kill" },
  { signal: "command", toolGate: "bash", pattern: /\bssh\b/, category: "ssh" },
  { signal: "command", toolGate: "bash", pattern: /\baws\b/, category: "aws" },
  { signal: "command", toolGate: "bash", pattern: /\b(kubectl|helm)\b/, category: "kubernetes" },
  { signal: "command", toolGate: "bash", pattern: /\bcrontab\b/, category: "cron" },
  { signal: "command", toolGate: "bash", pattern: /\bcargo\b/, category: "rust" },
  { signal: "command", toolGate: "bash", pattern: /\bgo\s+(build|run|test|mod|get|generate)\b/, category: "go_lang" },
  { signal: "command", toolGate: "bash", pattern: /\b(make|makefile)\b/i, category: "makefile" },
  { signal: "command", toolGate: "bash", pattern: /\bgrep\b/, category: "grep" },
  { signal: "command", toolGate: "bash", pattern: /\bpython[23]?\b/, category: "python" },
  { signal: "command", toolGate: "bash", pattern: /\bpsql\b|\bmysql\b|\bsqlite3\b/, category: "sql" },

  // Git commit via wrapper tool — requires non-empty message
  { signal: "message", toolGate: "git", pattern: /.+/, category: "git_commit" },
  { signal: "message", toolGate: "git_commit", pattern: /.+/, category: "git_commit" },
  { signal: "message", toolGate: "github", pattern: /.+/, category: "git_commit" },

  // AI assistant tool names
  { signal: "toolName", pattern: /^(ask|prompt|ai_|llm_|gpt_|copilot|anthropic|gemini)/i, category: "ai_assist" },

  // File path patterns
  { signal: "path", pattern: /\.env\b/, category: "env_file" },
  { signal: "path", pattern: /package\.json$/, category: "package_json" },
  { signal: "path", pattern: /\.(yaml|yml)$/i, category: "yaml" },
  { signal: "path", pattern: /\b(temp|tmp|hack|wip|fix)\b/i, category: "temp_file" },
  { signal: "path", pattern: /README/i, category: "readme" },
  { signal: "path", pattern: /config/i, category: "config", negativePathGate: /node_modules/ },
  { signal: "path", pattern: /node_modules/, category: "node_modules" },
  { signal: "path", pattern: /\.(test|spec)\./i, category: "test_file" },
  { signal: "path", pattern: /\.rs$/, category: "rust" },
  { signal: "path", pattern: /\.go$/, category: "go_lang" },
  { signal: "path", pattern: /\.(ts|tsx)$/, category: "typescript" },
  { signal: "path", pattern: /\/(cron|crontab(\.d)?)\//i, category: "cron" },
];

/**
 * Returns the first matching category in priority order, or null.
 * The matcher returns a category name, not an insult — drawing the insult
 * is a separate step owned by the RoastEngine.
 */
export function matchContext(rules: MatchRule[], signal: ToolSignal): string | null {
  for (const rule of rules) {
    // Positive gate: skip if toolName doesn't match
    if (rule.toolGate && signal.toolName !== rule.toolGate) continue;

    // Negative gate: skip if the path matches the exclusion regex
    if (rule.negativePathGate && rule.negativePathGate.test(signal.path ?? "")) continue;

    const value = signal[rule.signal] ?? "";
    if (rule.pattern.test(value)) {
      return rule.category;
    }
  }
  return null;
}
