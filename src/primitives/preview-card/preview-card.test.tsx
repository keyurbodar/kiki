import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PreviewCard, PreviewCardContent, PreviewCardTrigger } from ".";

afterEach(cleanup);

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
});
