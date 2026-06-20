// ─── ShuffleBag ─────────────────────────────────────────────────────────────────

/**
 * Fisher-Yates shuffle bag with cross-cycle repeat prevention.
 * Guarantees no immediate repeat when the bag refills.
 */
export class ShuffleBag<T> {
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
