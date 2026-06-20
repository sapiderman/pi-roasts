import { describe, it, expect } from "vitest";
import { ShuffleBag } from "../shuffle-bag.js";

describe("ShuffleBag", () => {
  it("cycles through all items without repeat within one cycle", () => {
    const items = ["a", "b", "c", "d", "e"];
    const bag = new ShuffleBag(items);
    const drawn: string[] = [];

    for (let i = 0; i < items.length; i++) {
      drawn.push(bag.next());
    }

    // All items drawn exactly once (order is shuffled, but set is complete)
    expect(drawn.sort()).toEqual(items.sort());
  });

  it("prevents cross-cycle repeat (last item of cycle N ≠ first item of cycle N+1)", () => {
    const items = ["a", "b"];
    const bag = new ShuffleBag(items);

    // Draw two full cycles
    const first = bag.next();
    const second = bag.next();
    const third = bag.next();

    // third (start of cycle 2) must not equal second (end of cycle 1)
    expect(third).not.toBe(second);
  });

  it("works with a single item", () => {
    const bag = new ShuffleBag(["only"]);
    expect(bag.next()).toBe("only");
    expect(bag.next()).toBe("only");
  });
});
