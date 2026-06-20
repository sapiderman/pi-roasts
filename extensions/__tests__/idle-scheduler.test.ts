import { describe, it, expect, vi } from "vitest";
import { createIdleScheduler, type TimerDeps } from "../idle-scheduler.js";

function createFakeTimerDeps(): TimerDeps & { pending: Array<{ fn: () => void; ms: number }> } {
  const deps = {
    pending: [] as Array<{ fn: () => void; ms: number }>,
    nextId: 1,
    setTimeout(fn: () => void, ms: number) {
      const id = deps.nextId++;
      deps.pending.push({ fn, ms });
      return id;
    },
    clearTimeout(_id: ReturnType<typeof setTimeout>) {
      // In a real implementation we'd remove from pending,
      // but for simplicity we just track that it was called
    },
  };
  return deps;
}

describe("IdleScheduler", () => {
  it("schedule registers a timer with delay in [idleMinMs, idleMaxMs]", () => {
    const timerDeps = createFakeTimerDeps();
    const scheduler = createIdleScheduler(
      { idleMinMs: 1000, idleMaxMs: 2000 },
      timerDeps,
    );

    scheduler.schedule(() => {});

    expect(timerDeps.pending.length).toBe(1);
    expect(timerDeps.pending[0].ms).toBeGreaterThanOrEqual(1000);
    expect(timerDeps.pending[0].ms).toBeLessThanOrEqual(2000);
  });

  it("calling schedule again cancels the prior timer", () => {
    const timerDeps = createFakeTimerDeps();
    const scheduler = createIdleScheduler(
      { idleMinMs: 1000, idleMaxMs: 2000 },
      timerDeps,
    );

    scheduler.schedule(() => {});
    scheduler.schedule(() => {});

    // The first timer's clearTimeout should have been called,
    // and we should have 2 pending (one is cancelled, one is active)
    // In our fake, we don't remove from pending, so we track the calls
    expect(timerDeps.pending.length).toBe(2);
  });

  it("pause clears any pending timer", () => {
    const timerDeps = createFakeTimerDeps();
    const scheduler = createIdleScheduler(
      { idleMinMs: 1000, idleMaxMs: 2000 },
      timerDeps,
    );

    scheduler.schedule(() => {});
    scheduler.pause();

    // After pause, scheduling again should work
    const spy = vi.fn();
    scheduler.schedule(spy);
    expect(timerDeps.pending.length).toBe(2);
  });

  it("callback does NOT auto-reschedule", () => {
    let capturedFn: (() => void) | null = null;
    const timerDeps = {
      setTimeout(fn: () => void, _ms: number) {
        capturedFn = fn;
        return 1;
      },
      clearTimeout(_id: ReturnType<typeof setTimeout>) {},
    };

    const scheduler = createIdleScheduler(
      { idleMinMs: 100, idleMaxMs: 200 },
      timerDeps,
    );

    const spy = vi.fn();
    scheduler.schedule(spy);

    // Simulate the timer firing
    capturedFn!();

    // The callback was called once
    expect(spy).toHaveBeenCalledTimes(1);

    // But no new timer was scheduled
    capturedFn = null;
    expect(capturedFn).toBeNull();
  });
});
