import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddConnectionSheet } from "./add-connection-sheet.tsx";

vi.mock("@effect/atom-react", async (importOriginal) => {
  const { AsyncResult } = await import("effect/reactivity");
  return {
    ...(await importOriginal<object>()),
    useAtomSet: () => () => new Promise(() => {}),
    useAtomValue: () => AsyncResult.success([{ id: "org_acme" }]),
  };
});

vi.mock("../model-connect-sheet/connect-sheet.tsx", () => ({
  ConnectSheet: (props: {
    request: unknown;
    nest?: { onBack: () => void };
  }) => (
    <div data-testid="connect-sheet">
      {JSON.stringify(props.request)}
      <button type="button" onClick={props.nest?.onBack}>
        Back to list
      </button>
    </div>
  ),
}));

afterEach(cleanup);

const open = (
  props: Partial<Parameters<typeof AddConnectionSheet>[0]> = {},
) => {
  render(
    <AddConnectionSheet
      scope="user"
      connectedSeats={[]}
      credentials={[]}
      catalog={[]}
      onSeatConnected={() => {}}
      {...props}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Add connection" }));
};

const entry = (name: string) =>
  screen.getByRole("button", { name: new RegExp(`^${name} `) });

const search = () => screen.getByRole("textbox", { name: "Search providers" });

describe("AddConnectionSheet", () => {
  it("lists subscriptions, coding plans and API keys", () => {
    open({ connectedSeats: ["copilot", "codex"] });
    expect(screen.getByText("Add a connection")).toBeTruthy();
    for (const title of ["Subscriptions", "Coding plans", "API keys"])
      expect(screen.getByRole("heading", { name: title })).toBeTruthy();
    expect(screen.getByText("Connected")).toBeTruthy();
    expect(screen.getByText("Add another")).toBeTruthy();
    expect((entry("GitHub Copilot") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Custom endpoint")).toBeTruthy();
  });

  it("hides subscriptions for the organization", () => {
    open({ scope: "org" });
    expect(screen.queryByRole("heading", { name: "Subscriptions" })).toBeNull();
    expect(screen.getByRole("heading", { name: "API keys" })).toBeTruthy();
  });

  it("disables the trigger and uses the given title", () => {
    render(
      <AddConnectionSheet
        scope="user"
        connectedSeats={[]}
        credentials={[]}
        catalog={[]}
        disabled
        title="Only admins can add connections"
        onSeatConnected={() => {}}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Add connection" });
    expect((trigger as HTMLButtonElement).disabled).toBe(true);
    expect(trigger.getAttribute("title")).toBe(
      "Only admins can add connections",
    );
  });

  it("filters providers and offers a custom endpoint when nothing matches", () => {
    open();
    fireEvent.change(search(), { target: { value: "gemini" } });
    expect(entry("Google")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Claude Code / })).toBeNull();
    fireEvent.change(search(), { target: { value: " acme-nothing " } });
    expect(screen.getByText("No providers match acme-nothing")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Use a custom endpoint" }),
    );
    expect(screen.getByTestId("connect-sheet").textContent).toContain(
      '{"kind":"create","scope":"user","provider":"openai_compatible"}',
    );
  });

  it("opens an API key provider in the connect sheet and goes back", () => {
    open({ scope: "org" });
    fireEvent.click(entry("Anthropic"));
    expect(screen.getByTestId("connect-sheet").textContent).toContain(
      '{"kind":"create","scope":"org","provider":"anthropic"}',
    );
    fireEvent.click(screen.getByRole("button", { name: "Back to list" }));
    expect(screen.getByText("Add a connection")).toBeTruthy();
  });

  it("opens the first match with Enter", () => {
    open();
    fireEvent.change(search(), { target: { value: "openrouter" } });
    fireEvent.keyDown(search(), { key: "Enter" });
    expect(screen.getByTestId("connect-sheet").textContent).toContain(
      '"preset":"openrouter"',
    );
  });

  it("opens the Claude dialog for Claude Code", () => {
    open();
    fireEvent.click(entry("Claude Code"));
    expect(screen.getByText("Connect your Claude subscription")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Add a connection")).toBeTruthy();
  });

  it("opens the device login for other subscriptions", () => {
    open();
    fireEvent.click(entry("Codex"));
    expect(screen.getByText("Connect Codex")).toBeTruthy();
    expect(screen.getByText("Requesting a code")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "OpenAI sign-in help" }),
    ).toBeTruthy();
  });
});
