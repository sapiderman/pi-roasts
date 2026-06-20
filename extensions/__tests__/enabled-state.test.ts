import { describe, it, expect } from "vitest";
import { createEnabledState, type EnabledStatePort, type BranchEntry } from "../enabled-state.js";

function createFakePort(entries: BranchEntry[] = []): EnabledStatePort & { appended: Array<{ type: string; data: unknown }> } {
  const port = {
    entries: [...entries],
    appended: [] as Array<{ type: string; data: unknown }>,
    getBranch() {
      return this.entries;
    },
    appendEntry(customType: string, data: unknown) {
      this.appended.push({ type: customType, data });
    },
  };
  return port;
}

describe("EnabledState", () => {
  describe("load", () => {
    it("returns true for empty branch (default enabled)", () => {
      const port = createFakePort();
      const state = createEnabledState(port);
      expect(state.load()).toBe(true);
    });

    it("returns the stored enabled value from a custom entry", () => {
      const port = createFakePort([
        { type: "custom", customType: "pi-roast-enabled", data: { enabled: false } },
      ]);
      const state = createEnabledState(port);
      expect(state.load()).toBe(false);
    });

    it("returns the newest value when multiple entries exist", () => {
      const port = createFakePort([
        { type: "custom", customType: "pi-roast-enabled", data: { enabled: false } },
        { type: "other", data: {} },
        { type: "custom", customType: "pi-roast-enabled", data: { enabled: true } },
      ]);
      const state = createEnabledState(port);
      expect(state.load()).toBe(true);
    });

    it("defaults to true if entry has no data.enabled", () => {
      const port = createFakePort([
        { type: "custom", customType: "pi-roast-enabled" },
      ]);
      const state = createEnabledState(port);
      expect(state.load()).toBe(true);
    });
  });

  describe("save", () => {
    it("appends an entry with the correct customType and data", () => {
      const port = createFakePort();
      const state = createEnabledState(port);
      state.save(false);
      expect(port.appended).toEqual([
        { type: "pi-roast-enabled", data: { enabled: false } },
      ]);
    });
  });
});
