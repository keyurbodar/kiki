import { RegistryProvider } from "@effect/atom-react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ModelsPage } from "./models-page";

afterEach(cleanup);

function renderPage() {
  render(
    <RegistryProvider>
      <ModelsPage />
    </RegistryProvider>,
  );
}

describe("/settings/models", () => {
  it("shows Capy's page copy and the default-model rows", async () => {
    renderPage();
    expect(await screen.findByRole("heading", { name: "Models" })).toBeTruthy();
    expect(
      screen.getByText(
        "For each model, a thread runs on the first subscription or key below that serves it",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Default models")).toBeTruthy();
    expect(
      screen.getByText("The model a thread starts on when nobody picks one"),
    ).toBeTruthy();
    expect(
      screen.getByText("Set by your pick in the home composer"),
    ).toBeTruthy();
    expect(
      screen.getByText("Used for threads you start from Slack"),
    ).toBeTruthy();
    expect(
      screen.getByText("Used for threads started from Linear issues"),
    ).toBeTruthy();
    expect(
      screen.getByText("For members without a web default, and service users"),
    ).toBeTruthy();
  });

  it("renders the three dialogs owned by this package", async () => {
    const close = vi.fn();
    const save = vi.fn().mockResolvedValue(undefined);
    render(
      <RegistryProvider>
        <ModelsPage
          compactAtRequest={{
            scope: "user",
            entry: {
              id: "anthropic/claude-opus",
              name: "Claude Opus 5.5",
              provider: "anthropic",
              efforts: ["low", "medium", "high"],
              context: 200_000,
            },
          }}
          renameRequest={{
            service: "claude-code",
            credentialId: "cred_sample",
            label: "Sample subscription",
          }}
          moveRequest={{ name: "Sample key", credentialId: "cred_sample" }}
          onCloseDialog={close}
          onSaveCompactAt={save}
          onRename={save}
          onMove={save}
        />
      </RegistryProvider>,
    );
    expect(await screen.findByText("Compact at (your threads)")).toBeTruthy();
    expect(screen.getByText("Rename Claude Code subscription")).toBeTruthy();
    expect(
      screen.getByText("Move Sample key to the organization"),
    ).toBeTruthy();
  });
});
