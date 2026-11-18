import { RegistryProvider } from "@effect/atom-react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DiffTab } from "./diff-tab";

afterEach(cleanup);

const pull = {
  id: "pr_sample_128",
  orgId: "org_sample_acme",
  repo: "acme/web",
  number: 128,
  url: "https://github.com/acme/web/pull/128",
  headSha: "c2f8a10d9b47",
  diffPair: { base: "a10f42e8c933", head: "c2f8a10d9b47" },
};

describe("DiffTab", () => {
  it("renders files, markers and discussions from the mock", async () => {
    render(
      <RegistryProvider>
        <DiffTab pull={pull} />
      </RegistryProvider>,
    );
    expect(await screen.findByText("retry.test.ts")).toBeTruthy();
    expect(screen.getByText("Comments on unchanged files")).toBeTruthy();
    expect(
      screen.getByText("Check the order total rounding before retrying"),
    ).toBeTruthy();
    const marker = await screen.findByRole("button", {
      name: "Capy medium: Log the retry attempt count",
    });
    fireEvent.click(marker);
    expect(screen.getByText("Suggested fix")).toBeTruthy();
    expect(screen.getAllByText("Reviewed").length).toBeGreaterThan(0);
  });

  it("mounts one file body when the rail drives the selection", async () => {
    const { rerender } = render(
      <RegistryProvider>
        <DiffTab pull={pull} railHosted selectedPath={null} />
      </RegistryProvider>,
    );
    await screen.findByText("retry.ts");
    expect(document.querySelectorAll("[data-diff-file]").length).toBe(1);
    expect(
      document.querySelectorAll('[data-slot="diff-file-body"]').length,
    ).toBe(1);
    rerender(
      <RegistryProvider>
        <DiffTab
          pull={pull}
          railHosted
          selectedPath="test/checkout/retry.test.ts"
        />
      </RegistryProvider>,
    );
    await waitFor(() => {
      expect(
        document
          .querySelector("[data-diff-file]")
          ?.getAttribute("data-diff-file"),
      ).toBe("test/checkout/retry.test.ts");
    });
  });

  it("mounts every file body when no rail is hosting the tab", async () => {
    render(
      <RegistryProvider>
        <DiffTab pull={pull} />
      </RegistryProvider>,
    );
    await screen.findByText("retry.test.ts");
    expect(
      document.querySelectorAll("[data-diff-file]").length,
    ).toBeGreaterThan(1);
  });
});
