import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import extension from "../pi-roast.js";

interface CapturedWidget {
  render: () => unknown[];
  invalidate: () => void;
}

function createFakePi() {
  const handlers = new Map<string, Array<(event: unknown, ctx: unknown) => Promise<void>>>();
  const commands = new Map<string, { description: string; handler: (args: string, ctx: unknown) => Promise<void> }>();
  const widgets = new Map<string, unknown>();
  const notifications: Array<{ message: string; level: string }> = [];
  const entries: Array<{ type: string; data: unknown }> = [];

  const setWidgetCalls: Array<{ key: string; widget: unknown }> = [];
  // Capture the rendered text at setWidget time by invoking the widget factory with a fake theme.
  const renderedTexts: string[] = [];
  const fakeTheme = { fg: (_c: string, t: string) => t };

  const api = {
    on(event: string, handler: (event: unknown, ctx: unknown) => Promise<void>) {
      if (!handlers.has(event)) handlers.set(event, []);
      handlers.get(event)!.push(handler);
    },
    registerCommand(name: string, opts: { description: string; handler: (args: string, ctx: unknown) => Promise<void> }) {
      commands.set(name, opts);
    },
    appendEntry(type: string, data: unknown) {
      entries.push({ type, data });
    },
  };

  function createCtx(overrides: { branch?: unknown[] } = {}) {
    return {
      ui: {
        setWidget(key: string, widget: unknown) {
          setWidgetCalls.push({ key, widget });
          widgets.set(key, widget);
          if (typeof widget === "function") {
            const factory = widget as (tui: unknown, theme: typeof fakeTheme) => CapturedWidget;
            const out = factory(null, fakeTheme).render();
            if (Array.isArray(out)) renderedTexts.push(out[0] as string);
          }
        },
        notify(message: string, level: string) {
          notifications.push({ message, level });
        },
      },
      sessionManager: {
        getBranch() {
          return overrides.branch ?? entries;
        },
      },
    };
  }

  async function emit(event: string, eventData: unknown = {}, ctx: unknown = createCtx()) {
    for (const h of handlers.get(event) ?? []) {
      await h(eventData, ctx);
    }
  }

  function lastRenderedText(): string | null {
    return renderedTexts.length > 0 ? renderedTexts[renderedTexts.length - 1] : null;
  }

  return { api, handlers, commands, widgets, notifications, entries, setWidgetCalls, renderedTexts, createCtx, emit, lastRenderedText };
}

describe("Integration: extension wiring (real default export)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("registers 3 commands and the expected event handlers", async () => {
    const fake = createFakePi();
    extension(fake.api as never);

    expect([...fake.commands.keys()].sort()).toEqual(["roast", "roast-color", "roast-me"]);
    const expectedEvents = [
      "session_start", "turn_start", "turn_end", "agent_end",
      "tool_call", "tool_result", "model_select",
      "session_before_switch", "session_shutdown",
    ];
    for (const ev of expectedEvents) {
      expect(fake.handlers.has(ev)).toBe(true);
    }
  });

  it("session_start notifies, renders a roast, and schedules idle roasts", async () => {
    const fake = createFakePi();
    extension(fake.api as never);

    await fake.emit("session_start");

    // Activated notification
    expect(fake.notifications.some(n => /activated/.test(n.message))).toBe(true);
    // Widget rendered with a roast (🔥 prefix)
    expect(fake.lastRenderedText()).toMatch(/^🔥 /);

    // Advancing time past idleMaxMs fires an idle roast (another setWidget call)
    const callsBefore = fake.setWidgetCalls.length;
    await vi.advanceTimersByTimeAsync(130_000);
    expect(fake.setWidgetCalls.length).toBeGreaterThan(callsBefore);
  });

  it("tool_call(bash) always renders a roast", async () => {
    const fake = createFakePi();
    extension(fake.api as never);
    await fake.emit("session_start");

    const callsBefore = fake.setWidgetCalls.length;
    await fake.emit("tool_call", { toolName: "bash", input: { command: "ls -la" } });

    expect(fake.setWidgetCalls.length).toBe(callsBefore + 1);
    expect(fake.lastRenderedText()).toMatch(/^🔥 /);
  });

  it("turn_start pauses the idle timer (no roast fires during active work)", async () => {
    const fake = createFakePi();
    extension(fake.api as never);
    await fake.emit("session_start");

    // Pause idle
    await fake.emit("turn_start");

    const callsBefore = fake.setWidgetCalls.length;
    await vi.advanceTimersByTimeAsync(130_000);
    // No new roasts while paused
    expect(fake.setWidgetCalls.length).toBe(callsBefore);
  });

  it("turn_end reschedules the idle timer", async () => {
    const fake = createFakePi();
    extension(fake.api as never);
    await fake.emit("session_start");
    await fake.emit("turn_start");

    // Resume idle scheduling
    await fake.emit("turn_end");

    const callsBefore = fake.setWidgetCalls.length;
    await vi.advanceTimersByTimeAsync(130_000);
    expect(fake.setWidgetCalls.length).toBeGreaterThan(callsBefore);
  });

  it("session_shutdown clears the widget and pauses idle", async () => {
    const fake = createFakePi();
    extension(fake.api as never);
    await fake.emit("session_start");

    await fake.emit("session_shutdown");

    // Widget cleared (setWidget called with undefined)
    expect(fake.widgets.get("pi-roast")).toBeUndefined();

    // No idle roast fires after shutdown
    const callsBefore = fake.setWidgetCalls.length;
    await vi.advanceTimersByTimeAsync(130_000);
    expect(fake.setWidgetCalls.length).toBe(callsBefore);
  });

  it("/roast command toggles enabled state and persists it", async () => {
    const fake = createFakePi();
    extension(fake.api as never);
    const ctx = fake.createCtx();
    await fake.emit("session_start", {}, ctx);

    // Toggle off
    const roastCmd = fake.commands.get("roast")!;
    await roastCmd.handler("", ctx);
    expect(fake.entries.some(e => e.type === "pi-roast-enabled" && (e.data as { enabled: boolean }).enabled === false)).toBe(true);

    // Widget should be cleared when muting
    expect(fake.widgets.get("pi-roast")).toBeUndefined();

    // Toggle on
    await roastCmd.handler("", ctx);
    expect(fake.entries.some(e => e.type === "pi-roast-enabled" && (e.data as { enabled: boolean }).enabled === true)).toBe(true);
  });

  it("tool_result error renders a failure roast", async () => {
    const fake = createFakePi();
    extension(fake.api as never);
    await fake.emit("session_start");

    // Force an error result — failure chance is 0.5, so retry until it roasts.
    // Use a deterministic approach: emit many error results and assert at least one roasts.
    let roasted = false;
    for (let i = 0; i < 50; i++) {
      const callsBefore = fake.setWidgetCalls.length;
      await fake.emit("tool_result", { isError: true });
      if (fake.setWidgetCalls.length > callsBefore) {
        roasted = true;
        break;
      }
    }
    expect(roasted).toBe(true);
  });

  it("loads disabled state from the session branch", async () => {
    const fake = createFakePi();
    extension(fake.api as never);

    // Pre-seed the branch with a "disabled" entry
    const branch = [{ type: "custom", customType: "pi-roast-enabled", data: { enabled: false } }];
    const ctx = fake.createCtx({ branch });

    await fake.emit("session_start", {}, ctx);

    // Should NOT notify "activated" when disabled
    expect(fake.notifications.some(n => /activated/.test(n.message))).toBe(false);
    // Should NOT render a roast
    expect(fake.widgets.has("pi-roast")).toBe(false);
  });
});
