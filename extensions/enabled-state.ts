// ─── EnabledState ──────────────────────────────────────────────────────────────

/**
 * EnabledState module — owns load/save against sessionManager + appendEntry.
 * Hides the reverse-walk logic, the ENABLED_CUSTOM_TYPE constant,
 * and the "default true" semantics.
 */

export interface BranchEntry {
  type: string;
  customType?: string;
  data?: { enabled?: boolean };
}

export interface EnabledStatePort {
  getBranch(): BranchEntry[];
  appendEntry(customType: string, data: unknown): void;
}

export interface EnabledState {
  load(): boolean;
  save(enabled: boolean): void;
}

const ENABLED_CUSTOM_TYPE = "pi-roast-enabled";

/**
 * Creates an EnabledState that manages the on/off toggle persistence.
 * The port is a narrow slice of ExtensionAPI — sessionManager.getBranch + appendEntry.
 */
export function createEnabledState(port: EnabledStatePort): EnabledState {
  function load(): boolean {
    const entries = port.getBranch();
    // Walk in reverse to find the most recent enabled state
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      if (entry.type === "custom" && entry.customType === ENABLED_CUSTOM_TYPE) {
        return entry.data?.enabled ?? true;
      }
    }
    return true; // default: enabled
  }

  function save(enabled: boolean): void {
    port.appendEntry(ENABLED_CUSTOM_TYPE, { enabled });
  }

  return { load, save };
}
