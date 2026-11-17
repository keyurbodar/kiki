import { RegistryProvider } from "@effect/atom-react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompactAtDialog } from "./compact-at-dialog";
import {
  MoveToOrganizationDialog,
  RenameSeatDialog,
} from "./connection-dialogs";
import { ModelsPage } from "./models-page";

afterEach(cleanup);

const close = vi.fn();

describe("/settings/models", () => {
  it("renders Capy's page copy and every section header", async () => {
    render(
      <RegistryProvider>
        <ModelsPage />
      </RegistryProvider>,
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: "Models" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "For each model, a thread runs on the first subscription or key below that serves it",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Default models")).toBeTruthy();
    expect(screen.getByText("Your connections")).toBeTruthy();
    expect(
      screen.getByText("Threads you own run on these first, in this order"),
    ).toBeTruthy();
    expect(screen.getByText("Organization connections")).toBeTruthy();
    expect(
      screen.getByText(
        "What a thread does when the subscription or key serving its model is out of usage",
      ),
    ).toBeTruthy();
  });

  it("mounts both connection card headers and the models table", async () => {
    render(
      <RegistryProvider>
        <ModelsPage />
      </RegistryProvider>,
    );
    expect(
      (await screen.findAllByText("No connections")).length,
    ).toBeGreaterThan(0);
    expect(
      document.querySelectorAll("[data-slot=card-list-header]").length,
    ).toBe(2);
    expect(screen.getByRole("table", { name: "Models" })).toBeTruthy();
  });
});

describe("models-page dialogs", () => {
  it("renders the compact-at dialog for the user scope", () => {
    render(
      <CompactAtDialog
        entry={{
          id: "anthropic/claude-opus",
          name: "Claude Opus 5.5",
          provider: "anthropic",
          efforts: ["low", "medium", "high"],
          context: 200_000,
        }}
        scope="user"
        value={undefined}
        onClose={close}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText("Compact at (your threads)")).toBeTruthy();
    expect(
      screen.getByText("Organization default is 160,000, up to 200,000 tokens"),
    ).toBeTruthy();
  });

  it("renders the rename and move dialogs with Capy's titles", () => {
    render(
      <RenameSeatDialog
        service="claude-code"
        label="Sample subscription"
        onClose={close}
        onRename={vi.fn()}
      />,
    );
    expect(screen.getByText("Rename Claude Code subscription")).toBeTruthy();
    cleanup();
    render(
      <MoveToOrganizationDialog
        name="Sample key"
        onClose={close}
        onMove={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Move Sample key to the organization"),
    ).toBeTruthy();
  });
});
