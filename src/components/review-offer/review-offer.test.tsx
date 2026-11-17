import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ReviewOffer,
  reviewOfferPrimaryLabel,
  reviewTargets,
} from "./review-offer";

afterEach(cleanup);

const candidates = [
  { repoFullName: "acme/web", needsAccess: false },
  { repoFullName: "acme/api", needsAccess: true },
];

describe("reviewTargets", () => {
  it("keeps accessible repositories whose mode is not off", () => {
    expect(reviewTargets(candidates, () => "always")).toEqual([candidates[0]]);
    expect(reviewTargets(candidates, () => "off")).toEqual([]);
  });
});

describe("reviewOfferPrimaryLabel", () => {
  it("labels the primary action by target count", () => {
    expect(reviewOfferPrimaryLabel(0)).toBe("Done");
    expect(reviewOfferPrimaryLabel(1)).toBe("Turn on review for 1");
  });
});

describe("ReviewOffer", () => {
  it("enables review for accessible candidates", async () => {
    const onEnable = vi.fn(() => Promise.resolve());
    const onFinish = vi.fn();
    render(
      <ReviewOffer
        candidates={candidates}
        onEnable={onEnable}
        onFinish={onFinish}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Turn on review for 1/ }),
    );
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith({
        enabled: ["acme/web"],
        failed: [],
      }),
    );
    expect(onEnable).toHaveBeenCalledWith("acme/web", "always");
  });

  it("finishes without a result on Escape", () => {
    const onFinish = vi.fn();
    render(<ReviewOffer candidates={candidates} onFinish={onFinish} />);
    fireEvent.keyDown(screen.getByRole("heading", { level: 2 }), {
      key: "Escape",
    });
    expect(onFinish).toHaveBeenCalledWith(undefined);
  });

  it("finishes without a result on Skip", () => {
    const onFinish = vi.fn();
    render(<ReviewOffer candidates={candidates} onFinish={onFinish} />);
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onFinish).toHaveBeenCalledWith(undefined);
  });
});
