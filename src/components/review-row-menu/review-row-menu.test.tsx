import { RegistryProvider } from "@effect/atom-react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { dismissDescription, isDismissable, ReviewRowMenu } from ".";

afterEach(cleanup);

const review = {
  githubReviewId: "ghr_1",
  reviewer: "jordan",
  state: "approved",
};

describe("review row menu", () => {
  it("describes the dismissal", () => {
    expect(dismissDescription(review)).toBe(
      "Dismisses jordan's approval with a reason GitHub keeps",
    );
    expect(dismissDescription({ ...review, state: "changes_requested" })).toBe(
      "Dismisses jordan's change request with a reason GitHub keeps",
    );
    expect(isDismissable({ state: "commented" })).toBe(false);
  });

  it("renders nothing on a merged pull or the author's own comment", () => {
    const { container } = render(
      <RegistryProvider>
        <ReviewRowMenu
          pull={{ id: "pr", state: "merged", author: "alex" }}
          review={review}
          orgId="org"
        />
        <ReviewRowMenu
          pull={{ id: "pr", state: "open", author: "alex" }}
          review={{ ...review, reviewer: "alex", state: "commented" }}
          orgId="org"
        />
      </RegistryProvider>,
    );
    expect(container.innerHTML).toBe("");
  });

  it("offers review actions otherwise", () => {
    render(
      <RegistryProvider>
        <ReviewRowMenu
          pull={{ id: "pr", state: "open", author: "alex" }}
          review={review}
          orgId="org"
        />
      </RegistryProvider>,
    );
    expect(screen.getByLabelText("Review actions")).toBeTruthy();
  });
});
