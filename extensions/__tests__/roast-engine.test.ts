import { describe, it, expect } from "vitest";
import { ShuffleBag } from "../shuffle-bag.js";
import { createRoastEngine, type RoastEngineDeps } from "../roast-engine.js";
import { MATCH_RULES } from "../context-matcher.js";

function createTestDeps(overrides: Partial<RoastEngineDeps> = {}): RoastEngineDeps {
  return {
    generalBag: new ShuffleBag(["general insult"]),
    failureBag: new ShuffleBag(["failure insult"]),
    modelBag: new ShuffleBag(["model insult"]),
    contextualBags: new Map([
      ["rm_rf", new ShuffleBag(["rm rf insult"])],
      ["sudo", new ShuffleBag(["sudo insult"])],
    ]),
    rules: MATCH_RULES,
    config: {
      highPriorityTools: new Set(["bash", "write", "edit"]),
      lowPriorityTools: new Set(["read"]),
      readInsultChance: 0.3,
      failureInsultChance: 0.5,
      unclassifiedToolChance: 0.15,
    },
    ...overrides,
  };
}

describe("RoastEngine", () => {
  describe("onToolCall", () => {
    it("always roasts for high-priority tools (bash)", () => {
      const engine = createRoastEngine(createTestDeps());
      const result = engine.onToolCall("bash", { command: "ls" });
      expect(result).toBe("general insult");
    });

    it("returns contextual insult for matching context on high-priority tool", () => {
      const engine = createRoastEngine(createTestDeps());
      const result = engine.onToolCall("bash", { command: "rm -rf /" });
      expect(result).toBe("rm rf insult");
    });

    it("roasts for low-priority tool when rng < readInsultChance", () => {
      let callCount = 0;
      const rng = () => {
        callCount++;
        return 0.0; // below 0.3
      };
      const engine = createRoastEngine(createTestDeps({ rng }));
      const result = engine.onToolCall("read", { path: "src/index.ts" });
      expect(result).toBe("general insult");
    });

    it("does not roast for low-priority tool when rng >= readInsultChance", () => {
      const rng = () => 0.99; // above 0.3
      const engine = createRoastEngine(createTestDeps({ rng }));
      const result = engine.onToolCall("read", { path: "src/index.ts" });
      expect(result).toBeNull();
    });

    it("context match on low-priority tool is still gated by rng roll", () => {
      const rng = () => 0.99; // above 0.3
      const engine = createRoastEngine(createTestDeps({ rng }));
      const result = engine.onToolCall("read", { command: "rm -rf /" });
      // rm_rf rule is gated on bash, so no context match; but even if there were,
      // the rng roll happens first for low-priority tools
      expect(result).toBeNull();
    });

    it("roasts for unclassified tool when rng < unclassifiedToolChance", () => {
      const rng = () => 0.0; // below 0.15
      const engine = createRoastEngine(createTestDeps({ rng }));
      const result = engine.onToolCall("some_tool", {});
      expect(result).toBe("general insult");
    });

    it("does not roast for unclassified tool when rng >= unclassifiedToolChance", () => {
      const rng = () => 0.5; // above 0.15
      const engine = createRoastEngine(createTestDeps({ rng }));
      const result = engine.onToolCall("some_tool", {});
      expect(result).toBeNull();
    });

    it("falls back to general bag when context bag is empty", () => {
      const contextualBags = new Map<string, ShuffleBag<string>>();
      // rm_rf category exists but bag is empty — no entry in map
      const engine = createRoastEngine(createTestDeps({ contextualBags }));
      const result = engine.onToolCall("bash", { command: "rm -rf /" });
      // Falls through to general bag
      expect(result).toBe("general insult");
    });
  });

  describe("onToolResult", () => {
    it("returns failure insult for error when rng < failureInsultChance", () => {
      const rng = () => 0.0; // below 0.5
      const engine = createRoastEngine(createTestDeps({ rng }));
      const result = engine.onToolResult(true);
      expect(result).toBe("failure insult");
    });

    it("returns null for error when rng >= failureInsultChance", () => {
      const rng = () => 0.9; // above 0.5
      const engine = createRoastEngine(createTestDeps({ rng }));
      const result = engine.onToolResult(true);
      expect(result).toBeNull();
    });

    it("returns null for non-error", () => {
      const engine = createRoastEngine(createTestDeps());
      const result = engine.onToolResult(false);
      expect(result).toBeNull();
    });
  });

  describe("onModelSelect", () => {
    it("always returns from model bag", () => {
      const engine = createRoastEngine(createTestDeps());
      expect(engine.onModelSelect()).toBe("model insult");
      expect(engine.onModelSelect()).toBe("model insult");
    });
  });

  describe("onIdleTick", () => {
    it("always returns from general bag", () => {
      const engine = createRoastEngine(createTestDeps());
      expect(engine.onIdleTick()).toBe("general insult");
    });
  });
});
