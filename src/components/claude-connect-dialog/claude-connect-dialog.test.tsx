import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Exit } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClaudeConnectDialog } from "./claude-connect-dialog.tsx";

const mocks = vi.hoisted(() => ({ connect: vi.fn() }));

vi.mock("@effect/atom-react", async (importOriginal) => {
  const { AsyncResult } = await import("effect/reactivity");
  return {
    ...(await importOriginal<object>()),
    useAtomSet: () => mocks.connect,
    useAtomValue: () => AsyncResult.success([{ id: "org_acme" }]),
  };
});

afterEach(cleanup);
beforeEach(() => mocks.connect.mockReset());

const tokenInput = () =>
  screen.getByPlaceholderText("sk-ant-oat01-…") as HTMLInputElement;
const verify = () => screen.getByRole("button", { name: "Verify and connect" });

describe("ClaudeConnectDialog", () => {
  it("shows the connect steps", () => {
    render(<ClaudeConnectDialog onClose={() => {}} />);
    expect(screen.getByText("Connect your Claude subscription")).toBeTruthy();
    expect(
      screen.getByText("Link your Claude subscription to use Claude Code"),
    ).toBeTruthy();
    expect(screen.getByText("Run this on your computer")).toBeTruthy();
    expect(
      (screen.getByRole("textbox", { name: "command" }) as HTMLInputElement)
        .value,
    ).toBe("claude setup-token");
    expect(screen.getByText("Paste the token it prints")).toBeTruthy();
    expect(
      screen.getByText(
        "Capy checks the token with one short request before saving it",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Optional, otherwise this seat shows as Claude subscription",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Install Claude Code")).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Connection help" })
        .getAttribute("href"),
    ).toBe("https://docs.capy.ai/models-and-pricing");
    expect((verify() as HTMLButtonElement).disabled).toBe(true);
  });

  it("numbers the install step first when one is given", () => {
    render(
      <ClaudeConnectDialog
        install="npm install -g acme-cli"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Install Claude Code")).toBeTruthy();
    expect(screen.getByText("3.")).toBeTruthy();
  });

  it("normalises the token and connects", async () => {
    const onConnected = vi.fn();
    mocks.connect.mockResolvedValue(Exit.succeed({ credentialId: "cred_1" }));
    render(
      <ClaudeConnectDialog onConnected={onConnected} onClose={() => {}} />,
    );
    fireEvent.change(tokenInput(), {
      target: { value: " sk-ant-oat01-\nabc " },
    });
    expect(tokenInput().value).toBe("sk-ant-oat01-abc");
    fireEvent.change(screen.getByPlaceholderText("Account email or name"), {
      target: { value: "  Alex Morgan  " },
    });
    fireEvent.click(verify());
    expect(mocks.connect).toHaveBeenCalledWith({
      payload: {
        token: "sk-ant-oat01-abc",
        label: "Alex Morgan",
        credentialId: undefined,
      },
      reactivityKeys: ["models:routing:org_acme", "models:seats:org_acme"],
    });
    await vi.waitFor(() =>
      expect(onConnected).toHaveBeenCalledWith({ credentialId: "cred_1" }),
    );
  });

  it("reconnects an existing seat with Enter", async () => {
    mocks.connect.mockResolvedValue(Exit.succeed({}));
    render(
      <ClaudeConnectDialog
        reconnect={{ credentialId: "cred_acme", label: "alex@acme.test" }}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Reconnect your Claude subscription")).toBeTruthy();
    expect(
      (screen.getByPlaceholderText("Account email or name") as HTMLInputElement)
        .value,
    ).toBe("alex@acme.test");
    fireEvent.change(tokenInput(), { target: { value: "sk-ant-oat01-x" } });
    fireEvent.keyDown(tokenInput(), { key: "Enter" });
    expect(mocks.connect).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          token: "sk-ant-oat01-x",
          label: "alex@acme.test",
          credentialId: "cred_acme",
        },
      }),
    );
  });

  it("normalises pasted tokens", () => {
    render(<ClaudeConnectDialog onClose={() => {}} />);
    fireEvent.paste(tokenInput(), {
      clipboardData: { getData: () => " sk-ant-oat01-\u200bpasted\n" },
    });
    expect(tokenInput().value).toBe("sk-ant-oat01-pasted");
  });

  it("shows why Claude turned the token down and clears it on edit", async () => {
    const onConnected = vi.fn();
    mocks.connect.mockResolvedValue(Exit.fail({ reason: "invalid_token" }));
    render(
      <ClaudeConnectDialog onConnected={onConnected} onClose={() => {}} />,
    );
    fireEvent.change(tokenInput(), { target: { value: "sk-bad" } });
    fireEvent.click(verify());
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(
      "This Claude token isn't valid, run claude setup-token again",
    );
    expect(tokenInput().getAttribute("aria-invalid")).toBe("true");
    expect(onConnected).not.toHaveBeenCalled();
    fireEvent.change(tokenInput(), { target: { value: "sk-better" } });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("cancels through onClose", () => {
    const onClose = vi.fn();
    render(<ClaudeConnectDialog onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});
