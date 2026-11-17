import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  type SkillListing,
  SkillUpdateCard,
  skillUpdateState,
} from "./skill-update";

afterEach(cleanup);

const listing: SkillListing = {
  card: { displayName: "Release notes", version: "1.2.0", versionId: "v3" },
  versions: [
    { id: "v3", version: "1.2.0", notes: "Adds changelog grouping." },
    { id: "v2", version: "1.1.0" },
  ],
};

describe("skillUpdateState", () => {
  it("offers an update when the listing moved past the installed version", () => {
    const state = skillUpdateState(listing, "v2");
    expect(state.updateAvailable).toBe(true);
    expect(state.status).toBe("Your copy stays at 1.1.0 until you update");
    expect(state.updateDescription).toBe(
      "Adds changelog grouping. Update replaces this folder, so edits made here are replaced too",
    );
  });

  it("is up to date when the installed version matches by id or version", () => {
    expect(skillUpdateState(listing, "v3").status).toBe(
      "Up to date with the listing",
    );
    expect(skillUpdateState(listing, "1.2.0").updateAvailable).toBe(false);
  });

  it("falls back when the version or notes are unknown", () => {
    const state = skillUpdateState(
      { ...listing, versions: [{ id: "v9", version: "2.0.0" }] },
      "v1",
    );
    expect(state.status).toBe(
      "Your copy stays at its version until you update",
    );
    expect(state.updateDescription).toMatch(
      /^A newer version is in Explore\. /,
    );
  });
});

const renderInRouter = (node: React.ReactNode) => {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => node }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
};

describe("SkillUpdateCard", () => {
  it("renders the update row and the Explore row", async () => {
    renderInRouter(
      <SkillUpdateCard
        slug="release-notes"
        versionId="v2"
        scope="org"
        listing={listing}
      />,
    );
    expect(await screen.findByText("Update available")).toBeTruthy();
    expect(screen.getByText("Added from Explore")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Update" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "View in Explore" }),
    ).toBeTruthy();
  });

  it("renders nothing until the listing loads", async () => {
    renderInRouter(
      <div data-testid="host">
        <SkillUpdateCard slug="release-notes" versionId="v2" scope="org" />
      </div>,
    );
    expect((await screen.findByTestId("host")).innerHTML).toBe("");
  });
});
