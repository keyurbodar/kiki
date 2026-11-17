import { assert, it as effectIt } from "@effect/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Effect } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { afterEach, describe, expect, it } from "vitest";
import { contextUsageAtom } from "@/data/atoms/events";
import { orgId, threads } from "@/data/mocks/fixtures/world";
import { ContextMeterControl } from "./context-meter";
import {
  formatTokens,
  layoutSegments,
  meterSegments,
  usageLevel,
  usedFraction,
} from "./format";

afterEach(cleanup);

describe("context meter format", () => {
  it("formats token counts like Capy", () => {
    expect(formatTokens(950)).toBe("950");
    expect(formatTokens(48_200)).toBe("48.2K");
    expect(formatTokens(200_000)).toBe("200K");
    expect(formatTokens(1_250_000)).toBe("1.3M");
  });

  it("clamps the fraction and picks the level", () => {
    expect(usedFraction({ usedTokens: 50, budgetTokens: 0 })).toBe(0);
    expect(usedFraction({ usedTokens: 300, budgetTokens: 200 })).toBe(1);
    expect(usageLevel(0.89)).toBe("neutral");
    expect(usageLevel(0.9)).toBe("warning");
    expect(usageLevel(1)).toBe("danger");
  });

  it("uses one level-toned segment without a breakdown", () => {
    expect(meterSegments({ usedTokens: 190, budgetTokens: 200 })).toEqual([
      { fraction: 0.95, tone: "warning" },
    ]);
  });

  it("maps breakdown keys to Capy's tones", () => {
    expect(
      meterSegments({
        usedTokens: 100,
        budgetTokens: 200,
        segments: [
          { key: "tools", tokens: 50 },
          { key: "conversation", tokens: 50 },
        ],
      }),
    ).toEqual([
      { fraction: 0.25, tone: "purple" },
      { fraction: 0.25, tone: "primary" },
    ]);
  });

  it("never lets segments overflow the track", () => {
    expect(
      layoutSegments([
        { fraction: 0.7, tone: "primary" },
        { fraction: 0.6, tone: "info" },
        { fraction: 0.2, tone: "pink" },
      ]).map((segment) => segment.width),
    ).toEqual([0.7, 0.30000000000000004, 0]);
  });
});

describe("ContextMeterControl", () => {
  it("labels the ring with usage", () => {
    render(
      <ContextMeterControl
        usage={{ usedTokens: 48_200, budgetTokens: 200_000 }}
      />,
    );
    expect(
      screen.getByLabelText("48.2K of 200K token budget used, 24%"),
    ).toBeTruthy();
  });
});

effectIt.effect("context usage comes from the events mock", () =>
  Effect.gen(function* () {
    const usage = yield* AtomRegistry.getResult(
      AtomRegistry.make(),
      contextUsageAtom(orgId, threads.checkoutTest.id),
    );
    assert.strictEqual(usage.usedTokens, 48_200);
    assert.strictEqual(usage.segments?.length, 7);
    assert.strictEqual(usage.compactAtTokens, 160_000);
  }),
);
