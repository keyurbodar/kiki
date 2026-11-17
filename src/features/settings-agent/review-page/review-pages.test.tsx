import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ReviewAgentConfigPage } from "./review-agent-config-page";
import { ReviewRepositoriesPage } from "./review-repositories-page";

afterEach(cleanup);

describe("review settings pages", () => {
  it("lists the enabled repository with its billing, memory and mode", async () => {
    render(<ReviewRepositoriesPage />);
    expect(await screen.findByText("acme/web")).toBeTruthy();
    expect(screen.getByText("This organization")).toBeTruthy();
    expect(screen.getByText("Web app")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "acme/web automatic reviews" })
        .textContent,
    ).toContain("Every push");
    expect(
      await screen.findByText(
        "Reviews run on pull requests alex-sample authors when the repository and filters allow",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("acme/api")).toBeNull();
  });

  it("shows tiers, guides, filters and instructions", async () => {
    render(<ReviewAgentConfigPage />);
    expect(
      await screen.findByText("Capy auto routes review for you"),
    ).toBeTruthy();
    expect(await screen.findByText("Author is any of dependabot-sample")).toBeTruthy();
    expect(await screen.findByText("**/bun.lock,**/*.generated.ts")).toBeTruthy();
    expect(
      screen.getByRole("switch", { name: "Generate pull request guides" }),
    ).toBeTruthy();
    expect(await screen.findByText("docs/review-guide.md")).toBeTruthy();
  });
});
