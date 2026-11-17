import { RegistryProvider } from "@effect/atom-react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { canSubmit, draftKey, ReviewComposer } from ".";

afterEach(cleanup);

const pull = {
  id: "pr_1",
  state: "open",
  author: "alex",
  headSha: "abc",
} as const;

describe("review composer", () => {
  it("lets approve go out empty but not comments", () => {
    expect(canSubmit("approve", "", null)).toBe(true);
    expect(canSubmit("comment", "  ", null)).toBe(false);
    expect(canSubmit("request_changes", "Fix it", null)).toBe(true);
    expect(canSubmit("approve", "", "comment")).toBe(false);
    expect(draftKey("pr_1", "abc")).toBe("pull-review:pr_1:abc");
  });

  it("enables comment once there is a summary and closes on Escape", () => {
    const onClose = vi.fn();
    render(
      <RegistryProvider>
        <ReviewComposer pull={pull} orgId="org" onClose={onClose} />
      </RegistryProvider>,
    );
    const comment = screen.getByText("Comment") as HTMLButtonElement;
    expect(comment.disabled).toBe(true);
    expect(
      (screen.getByText("Approve").closest("button") as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    const box = screen.getByLabelText("Add review summary");
    fireEvent.change(box, { target: { value: "Looks right" } });
    expect(comment.disabled).toBe(false);
    fireEvent.keyDown(box, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
