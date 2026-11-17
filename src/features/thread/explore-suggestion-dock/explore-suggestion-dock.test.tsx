import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type ExploreListing,
  ExploreSuggestionDock,
  listingMeta,
} from "./explore-suggestion-dock";

afterEach(cleanup);

const skill: ExploreListing = {
  kind: "skill",
  display_name: "Review skill",
  description: "Reviews pull requests",
  repository: "acme/skills",
  stars: 1234,
};

describe("listingMeta", () => {
  it("formats the kind, repository and star count", () => {
    expect(listingMeta(skill)).toBe("Skill from acme/skills, 1.2k stars");
    expect(
      listingMeta({
        kind: "theme",
        display_name: "Theme A",
        description: "A theme",
        repository: null,
        stars: 1,
      }),
    ).toBe("Theme, 1 star");
  });
});

describe("ExploreSuggestionDock", () => {
  it("calls the Later and Dismiss callbacks", () => {
    const onLater = vi.fn();
    const onDismiss = vi.fn();
    render(
      <ExploreSuggestionDock
        listing={skill}
        reason="You use reviews"
        onLater={onLater}
        onDismiss={onDismiss}
      />,
    );
    expect(screen.getByText("Review skill")).toBeTruthy();
    expect(screen.getByText("You use reviews")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Later" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onLater).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
  });

  it("renders nothing without a listing", () => {
    const { container } = render(<ExploreSuggestionDock />);
    expect(container.innerHTML).toBe("");
  });
});
