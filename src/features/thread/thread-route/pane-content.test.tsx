import { RegistryProvider } from "@effect/atom-react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { OrgId } from "@/data/api/schemas/ids";
import { orgId, threads } from "@/data/mocks/fixtures/world";
import { PaneContent } from "./pane-content";

afterEach(cleanup);

const machineId = "machine_sample_cloud1";

const renderPane = (element: React.ReactNode) =>
  render(<RegistryProvider>{element}</RegistryProvider>);

/**
 * Nine tab kinds reached `PaneContent`'s default branch and found no pane, so
 * the tab opened, the strip showed it selected, and the panel painted nothing.
 * A pane that opens blank reads as a bug rather than as a state, so every kind
 * the app still emits has to paint something: its surface, or a line saying why
 * it cannot.
 */
describe("a pane tab never opens to nothing", () => {
  it("renders a service preview with its bar and the handed-off page", async () => {
    const { container } = renderPane(
      <PaneContent
        tab={{
          kind: "service_preview",
          machineId,
          port: 8080,
          title: "Web preview",
        }}
        threadId={threads.checkoutTest.id}
        orgId={orgId as OrgId}
      />,
    );

    expect(container.textContent?.trim()).not.toBe("");

    const frame = await screen.findByTitle("Web preview");
    expect(frame.tagName).toBe("IFRAME");
    expect(frame.getAttribute("src")).toBe("https://preview.example.com/8080");
    expect(screen.getByLabelText("Address")).toBeTruthy();
  });

  it("says a preview needs the thread's organization", () => {
    renderPane(
      <PaneContent
        tab={{
          kind: "service_preview",
          machineId,
          port: 8080,
          title: "Web preview",
        }}
        threadId={threads.checkoutTest.id}
        orgId={undefined}
      />,
    );
    expect(screen.getByText("Preview unavailable")).toBeTruthy();
  });
});
