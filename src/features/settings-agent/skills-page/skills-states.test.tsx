import { RegistryProvider } from "@effect/atom-react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { failMockRequests } from "@/data/mocks/failure";
import { SkillsPage } from "./skills-page";

afterEach(() => {
  failMockRequests(null);
  cleanup();
});

function renderPage() {
  render(
    <RegistryProvider>
      <SkillsPage />
    </RegistryProvider>,
  );
}

describe("the skills page's three states", () => {
  it("lists skills once the scopes load", async () => {
    renderPage();
    await waitFor(
      () =>
        expect(
          document.querySelector('[data-slot="skills-load-failed"]'),
        ).toBeNull(),
      { timeout: 4000 },
    );
    expect(screen.queryByText(/Couldn't load the skills in Drive/)).toBeNull();
  });

  it("says the skills did not load instead of showing a short list", async () => {
    failMockRequests(/\/drive/);
    renderPage();
    expect(
      await screen.findByText("Couldn't load the skills in Drive", undefined, {
        timeout: 4000,
      }),
    ).toBeTruthy();
    expect(
      document.querySelector('[data-slot="skills-load-failed"]'),
    ).not.toBeNull();
    // The empty list would claim the project has no skills; a failed read may
    // not say that.
    expect(screen.queryByText("0 skills")).toBeNull();
  });
});
