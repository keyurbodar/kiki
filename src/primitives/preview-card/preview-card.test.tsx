import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
  useInsidePreviewCard,
} from ".";
import {
  CONE_GAP,
  cardClosed,
  cardOpened,
  coneEdges,
  EAGER_COOLDOWN,
  isWarm,
  pointInCone,
} from "./interaction";

afterEach(cleanup);

function InsideProbe() {
  return <span>{useInsidePreviewCard() ? "inside" : "outside"}</span>;
}

describe("PreviewCard", () => {
  it("renders the trigger, positioner and content slots", async () => {
    render(
      <PreviewCard defaultOpen>
        <PreviewCardTrigger href="#thread">Thread</PreviewCardTrigger>
        <PreviewCardContent>Preview</PreviewCardContent>
      </PreviewCard>,
    );
    expect(screen.getByText("Thread").dataset.slot).toBe(
      "preview-card-trigger",
    );
    const content = await screen.findByText("Preview");
    expect(content.dataset.slot).toBe("preview-card-content");
    expect(content.className).toContain("w-72");
    expect(content.parentElement?.dataset.slot).toBe("preview-card");
    expect(content.parentElement?.dataset.side).toBe("right");
  });

  it("gives the popup Capy's overlay surface", async () => {
    render(
      <PreviewCard open>
        <PreviewCardTrigger href="#thread">Thread</PreviewCardTrigger>
        <PreviewCardContent>Preview</PreviewCardContent>
      </PreviewCard>,
    );
    const content = await screen.findByText("Preview");
    expect(content.className).toContain("rounded-(--radius-overlay)");
    expect(content.className).toContain("border-hairline");
    expect(content.className).toContain("shadow-overlay");
    expect(content.className).toContain("max-h-(--available-height)");
    expect(content.className).toContain("p-3");
  });

  it("tells popup content that it renders inside a card", async () => {
    render(
      <>
        <InsideProbe />
        <PreviewCard open>
          <PreviewCardTrigger href="#thread">Thread</PreviewCardTrigger>
          <PreviewCardContent>
            <InsideProbe />
          </PreviewCardContent>
        </PreviewCard>
      </>,
    );
    expect(screen.getByText("outside")).toBeDefined();
    expect(await screen.findByText("inside")).toBeDefined();
  });
});

describe("preview card interaction", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the next trigger instant until the cooldown ends", () => {
    vi.useFakeTimers();
    cardOpened();
    expect(isWarm()).toBe(true);
    cardClosed();
    expect(isWarm()).toBe(true);
    vi.advanceTimersByTime(EAGER_COOLDOWN);
    expect(isWarm()).toBe(false);
  });

  it("nests the cone between the trigger and the popup's near edge", () => {
    const trigger = { left: 0, right: 100, top: 0, bottom: 40 };
    const popup = { left: 140, right: 300, top: 0, bottom: 100 };
    expect(coneEdges(trigger, popup)).toEqual([
      [140, -CONE_GAP],
      [140, 40 + CONE_GAP],
    ]);
    expect(
      coneEdges(trigger, { left: 20, right: 80, top: 10, bottom: 30 }),
    ).toBeNull();
  });

  it("keeps a pointer inside the cone and drops one outside it", () => {
    const edges = [
      [140, -CONE_GAP],
      [140, 40 + CONE_GAP],
    ] as const;
    expect(pointInCone(120, 20, [100, 20], edges)).toBe(true);
    expect(pointInCone(120, -60, [100, 20], edges)).toBe(false);
  });
});
