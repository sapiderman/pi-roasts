// ─── IdleScheduler ──────────────────────────────────────────────────────────────

/**
 * IdleScheduler module — owns the turn-aware pause/resume timer.
 * Hides setTimeout/clearTimeout, the randomBetween delay,
 * the "don't reschedule from inside the callback" semantics,
 * and the idleTimer mutable.
 */

export interface IdleSchedulerConfig {
  idleMinMs: number;
  idleMaxMs: number;
}

export interface TimerDeps {
  setTimeout: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimeout: (id: ReturnType<typeof setTimeout>) => void;
}

export interface IdleScheduler {
  schedule(onFire: () => void): void;
  pause(): void;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Creates an IdleScheduler that manages the idle roast timer.
 * The timer deps are injectable for testing.
 */
export function createIdleScheduler(
  config: IdleSchedulerConfig,
  timerDeps: TimerDeps = { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout },
): IdleScheduler {
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  function schedule(onFire: () => void): void {
    pause(); // cancel any existing timer
    const delay = randomBetween(config.idleMinMs, config.idleMaxMs);
    idleTimer = timerDeps.setTimeout(() => {
      idleTimer = null;
      onFire();
      // Don't reschedule — the caller is responsible for re-scheduling
      // when the user becomes idle again (e.g., on turn_end).
    }, delay);
  }

  function pause(): void {
    if (idleTimer !== null) {
      timerDeps.clearTimeout(idleTimer);
      idleTimer = null;
    }
  }

  return { schedule, pause };
}
