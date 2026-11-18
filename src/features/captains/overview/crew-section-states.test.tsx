import { RegistryProvider } from "@effect/atom-react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { failMockRequests } from "@/data/mocks/failure";
import { CaptainCrewSection } from "./crew-section";

afterEach(() => {
  failMockRequests(null);
  cleanup();
});

const renderSection = (jamId: string) =>
  render(
    <RegistryProvider>
      <CaptainCrewSection
        jamId={jamId}
        now={new Date()}
        onOpenThread={() => undefined}
      />
    </RegistryProvider>,
  );

describe("the Captain's crew section", () => {
  it("lists the crew once it loads", async () => {
    renderSection("jam_sample_cap1");
    await waitFor(
      () =>
        expect(
          document.querySelector("[data-section=threads]") ??
            document.querySelector("[data-slot=captain-crew-load-failed]"),
        ).not.toBeNull(),
      { timeout: 4000 },
    );
    expect(document.querySelector("[data-section=threads]")).not.toBeNull();
    expect(
      document.querySelector("[data-slot=captain-crew-load-failed]"),
    ).toBeNull();
  });

  it("says the crew did not load instead of hiding the section", async () => {
    failMockRequests(/\/captains\/jam_sample_cap1\/crew$/);
    renderSection("jam_sample_cap1");
    expect(
      await screen.findByText(
        "Couldn't load this Captain's threads",
        undefined,
        {
          timeout: 4000,
        },
      ),
    ).toBeTruthy();
    // The section used to return null on a failed read, so a broken crew read
    // made the Captain look like it had no threads at all.
    expect(
      document.querySelector("[data-slot=captain-crew-load-failed]"),
    ).not.toBeNull();
    expect(screen.queryByText("Threads")).toBeNull();
  });
});

void vi;
