import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ListingSetup, SetupCard, SetupContent } from "./setup";
import { SetupPanel, type SetupPanelActions } from "./setup-panel";
import { renderInRouter } from "./test-router";

afterEach(cleanup);

const card: SetupCard = {
  kind: "plugin",
  slug: "sample-monitor",
  displayName: "Sample Monitor",
  version: "1.0.0",
  versionId: "ver_sample",
  maker: { name: "Acme" },
  accent: null,
};
const content: SetupContent = {
  kind: "plugin",
  plugin: {
    servers: [
      {
        serverId: "srv",
        displayName: "Sample",
        auth: "headers",
        placement: "remote",
      },
    ],
  },
};
const setup: ListingSetup = {
  prompt: "Connect it.",
  inputs: [{ kind: "secret", id: "token", label: "API token" }],
  automations: [
    {
      name: "Triage",
      purpose: "Triage errors.",
      prompt: "Look",
      trigger: { type: "github" },
    },
    {
      name: "Digest",
      purpose: "Send a digest.",
      prompt: "Write",
      trigger: { type: "schedule" },
    },
  ],
};
const projects = [{ id: "proj_sample", name: "acme/web" }];

const makeActions = (
  overrides: Partial<SetupPanelActions> = {},
): SetupPanelActions => ({
  install: vi.fn(() => Promise.resolve({ installationId: "inst_1" })),
  createAutomation: vi.fn(() => Promise.resolve({})),
  startThread: vi.fn(() => Promise.resolve()),
  ...overrides,
});

const mount = (
  actions: SetupPanelActions,
  onInstalled = vi.fn(),
  signedIn = true,
) =>
  renderInRouter(() => (
    <div data-testid="ready">
      <SetupPanel
        card={card}
        content={content}
        setup={setup}
        installed={null}
        onInstalled={onInstalled}
        signedIn={signedIn}
        projects={projects}
        actions={actions}
      />
    </div>
  ));

it("installs with filled inputs and creates automations in order", async () => {
  const actions = makeActions();
  const onInstalled = vi.fn();
  await mount(actions, onInstalled);
  expect(screen.getByText("Set up Sample Monitor")).toBeTruthy();
  expect(
    screen.getByText(
      "Both automations are created when you install, on or off as set here",
    ),
  ).toBeTruthy();
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "secret-value" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Install" }));
  await waitFor(() => expect(onInstalled).toHaveBeenCalled());
  expect(actions.install).toHaveBeenCalledWith({
    projectId: "proj_sample",
    inputs: { token: "secret-value" },
  });
  expect(
    vi
      .mocked(actions.createAutomation)
      .mock.calls.map(([call]) => call.enabled),
  ).toEqual([true, false]);
  expect(onInstalled).toHaveBeenCalledWith({
    project: "acme/web",
    installationId: "inst_1",
    on: 1,
    total: 2,
  });
});

it("points at the rejected input", async () => {
  const actions = makeActions({
    install: () =>
      Promise.reject({
        _tag: "capy/PluginInputRejected",
        input: "token",
        message: "Token is wrong",
      }),
  });
  await mount(actions);
  fireEvent.click(screen.getByRole("button", { name: "Install" }));
  expect(
    await screen.findByText(
      "Nothing was installed, fix the API token and try again",
    ),
  ).toBeTruthy();
  expect(screen.getByText("Token is wrong")).toBeTruthy();
});

it("asks signed-out people to sign in", async () => {
  await mount(makeActions(), vi.fn(), false);
  expect(screen.getByText("Sign in to install")).toBeTruthy();
});

it("offers starters once installed", async () => {
  const actions = makeActions();
  await renderInRouter(() => (
    <div data-testid="ready">
      <SetupPanel
        card={card}
        content={content}
        setup={{ ...setup, starters: ["Check the latest errors"] }}
        installed={{
          project: "acme/web",
          installationId: "inst_1",
          on: 1,
          total: 2,
        }}
        onInstalled={vi.fn()}
        signedIn
        projects={projects}
        actions={actions}
      />
    </div>
  ));
  expect(screen.getByText("Try it in a thread")).toBeTruthy();
  expect(screen.getByText("1 of 2 automations on")).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Check the latest errors" }),
  );
  expect(actions.startThread).toHaveBeenCalledWith({
    projectId: "proj_sample",
    text: "Check the latest errors",
  });
});
