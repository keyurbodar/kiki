import { assert, describe, it } from "@effect/vitest";
import {
  delayedStatusDeadline,
  shownDelayedStatus,
  stepDelayedStatus,
} from "./delayed-status";

/**
 * The behaviour a reader gets: a status that resolves in a moment never appears,
 * and one that does appear stays long enough to read. Both halves matter — a
 * status that flickers is noise, and one that vanishes the instant it shows is
 * worse than not showing it at all.
 */
describe("stepDelayedStatus", () => {
  const key = "build";
  const showDelayMs = 400;
  const step = (
    state: ReturnType<typeof stepDelayedStatus<"starting">> | null,
    value: "starting" | null,
    deadlinePassed: boolean,
    now: number,
  ) =>
    stepDelayedStatus<"starting">(
      state,
      { key, value, deadlinePassed, showDelayMs },
      () => now,
    );

  it("never shows a status that clears before the delay", () => {
    const pending = step(null, "starting", false, 0);
    assert.strictEqual(pending.phase, "pending");
    assert.isNull(shownDelayedStatus(pending, key));

    const cleared = step(pending, null, false, 120);
    assert.strictEqual(cleared.phase, "idle");
    assert.isNull(shownDelayedStatus(cleared, key));
  });

  it("shows a status that is still set when the delay passes", () => {
    const pending = step(null, "starting", false, 0);
    const shown = step(pending, "starting", true, 400);
    assert.strictEqual(shown.phase, "shown");
    assert.strictEqual(shownDelayedStatus(shown, key), "starting");
    assert.strictEqual(delayedStatusDeadline(shown), 800);
  });

  it("keeps a shown status up for its minimum after it clears", () => {
    const pending = step(null, "starting", false, 0);
    const shown = step(pending, "starting", true, 400);
    const held = step(shown, null, false, 450);
    assert.strictEqual(shownDelayedStatus(held, key), "starting");

    const released = step(held, null, true, 800);
    assert.strictEqual(released.phase, "idle");
    assert.isNull(shownDelayedStatus(released, key));
  });

  it("returns the same state when nothing changed, so it can run per render", () => {
    const pending = step(null, "starting", false, 0);
    assert.strictEqual(step(pending, "starting", false, 10), pending);
  });

  it("starts over when the status belongs to another key", () => {
    const pending = step(null, "starting", false, 0);
    const other = stepDelayedStatus<"starting">(
      pending,
      {
        key: "other-build",
        value: "starting",
        deadlinePassed: true,
        showDelayMs,
      },
      () => 500,
    );
    assert.strictEqual(other.phase, "pending");
    assert.isNull(shownDelayedStatus(other, "other-build"));
  });
});
