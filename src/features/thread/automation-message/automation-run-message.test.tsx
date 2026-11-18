import { RegistryProvider } from "@effect/atom-react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { orgId } from "@/data/mocks/fixtures/world";
import { AutomationRunMessage } from "./automation-run-message";

afterEach(cleanup);

const noop = () => undefined;

describe("AutomationRunMessage", () => {
  it("names the automation the message came from", async () => {
    render(
      <RegistryProvider>
        <AutomationRunMessage
          orgId={orgId}
          automationId="auto_sample_deps"
          text="Three dependencies moved."
          date={new Date("2026-11-18T09:00:00Z")}
        />
      </RegistryProvider>,
    );
    expect(
      await screen.findByText("Nightly dependency check", undefined, {
        timeout: 3000,
      }),
    ).toBeTruthy();
    expect(screen.getByText("Three dependencies moved.")).toBeTruthy();
  });

  it("falls back to Automation when the id is unknown", async () => {
    render(
      <RegistryProvider>
        <AutomationRunMessage
          orgId={orgId}
          automationId="auto_missing"
          text="Nothing to report."
          date={new Date("2026-11-18T09:00:00Z")}
        />
      </RegistryProvider>,
    );
    expect(
      await screen.findByText("Automation", undefined, { timeout: 3000 }),
    ).toBeTruthy();
    noop();
  });
});
