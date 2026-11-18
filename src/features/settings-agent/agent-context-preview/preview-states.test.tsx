import { RegistryProvider } from "@effect/atom-react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { driveScopeFilesKey } from "@/data/atoms/agent-context";
import { failMockRequests } from "@/data/mocks/failure";
import { Icon } from "@/primitives/icon";
import { AgentContextPreview } from "./agent-context-preview";

afterEach(() => {
  failMockRequests(null);
  cleanup();
});

const project = { id: "project_sample", name: "kiki" };

const scopes = [
  {
    key: "org",
    scope: {},
    filtersKey: driveScopeFilesKey("org_sample_acme", {}),
    part: "org" as const,
    icon: <Icon name="buildings" />,
    name: "Acme",
    kind: "Organization",
    title: "Organization instructions",
    audience: "Every thread in Acme",
  },
];

function renderPreview() {
  render(
    <RegistryProvider>
      <AgentContextPreview project={project} scopes={scopes} />
    </RegistryProvider>,
  );
}

describe("the preview's failed read", () => {
  it("builds the preview once the scope files load", async () => {
    renderPreview();
    expect(
      await screen.findByText(/tokens/, undefined, { timeout: 4000 }),
    ).toBeTruthy();
    expect(screen.queryByText("Could not build this preview")).toBeNull();
  });

  it("says the preview could not be built when the scope files fail", async () => {
    // The scope files feed the preview's own local parts; a failed read there
    // must not leave the card on a skeleton that never resolves.
    failMockRequests(/\/drive|\/agent-context\/preview/);
    renderPreview();
    expect(
      await screen.findByText("Could not build this preview", undefined, {
        timeout: 4000,
      }),
    ).toBeTruthy();
    expect(screen.queryByText(/^About .* tokens$/)).toBeNull();
  });
});
