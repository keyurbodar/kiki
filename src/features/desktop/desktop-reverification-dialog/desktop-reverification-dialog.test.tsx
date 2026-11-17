import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  DesktopVerifyResult,
  DesktopVerifyStep,
} from "@/lib/desktop-bridge";
import { DesktopReverificationDialog } from "./desktop-reverification-dialog";
import { requestDesktopReverification } from "./reverification";

afterEach(() => {
  cleanup();
  window.capyDesktop = undefined;
});

const withSession = (
  verify: (step: DesktopVerifyStep) => Promise<DesktopVerifyResult>,
) => {
  window.capyDesktop = { session: { verify: vi.fn(verify) } };
  return window.capyDesktop.session?.verify;
};

describe("DesktopReverificationDialog", () => {
  it("renders nothing without a prompt", () => {
    const { container } = render(<DesktopReverificationDialog />);
    expect(container.textContent).toBe("");
  });

  it("verifies a password and resolves the request", async () => {
    const verify = withSession(async (step) =>
      step.kind === "start"
        ? {
            ok: true,
            status: "needs_first_factor",
            firstFactors: [{ strategy: "password" }],
          }
        : { ok: true, status: "complete" },
    );
    render(<DesktopReverificationDialog />);
    let pending: Promise<boolean> = Promise.resolve(false);
    act(() => {
      pending = requestDesktopReverification();
    });
    const input = await screen.findByLabelText("Password");
    fireEvent.change(input, { target: { value: "sample-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await expect(pending).resolves.toBe(true);
    expect(verify).toHaveBeenCalledWith({
      kind: "attempt-password",
      password: "sample-password",
    });
  });

  it("asks to verify on the web without a desktop session", async () => {
    render(<DesktopReverificationDialog />);
    act(() => {
      void requestDesktopReverification();
    });
    await waitFor(() =>
      expect(
        screen.getByText("Verify on capy.ai, then retry this change here"),
      ).toBeTruthy(),
    );
  });

  it("submits the authenticator code once six digits are entered", async () => {
    const verify = withSession(async (step) =>
      step.kind === "start"
        ? {
            ok: true,
            status: "needs_second_factor",
            secondFactors: [{ strategy: "totp" }],
          }
        : { ok: false, message: "That code didn't work" },
    );
    render(<DesktopReverificationDialog />);
    act(() => {
      void requestDesktopReverification();
    });
    const input = await screen.findByLabelText("Verification code");
    fireEvent.change(input, { target: { value: "12a3456" } });
    await screen.findByText("That code didn't work");
    expect(verify).toHaveBeenCalledWith({
      kind: "attempt-totp",
      code: "123456",
    });
  });
});
