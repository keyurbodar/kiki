import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeviceConnectDialog, pollFailure } from "./device-connect-dialog.tsx";

const mocks = vi.hoisted(() => ({ start: vi.fn(), poll: vi.fn(), calls: 0 }));

vi.mock("@effect/atom-react", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useAtomSet: () => (mocks.calls++ % 2 === 0 ? mocks.start : mocks.poll),
}));

const attempt = {
  attemptId: "att_acme",
  userCode: "ACME-1234",
  verificationUri: "https://login.acme.test/device",
  intervalSeconds: 2,
};

beforeEach(() => {
  mocks.calls = 0;
  mocks.start.mockReset();
  mocks.poll.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("pollFailure", () => {
  it("explains each failed status", () => {
    expect(pollFailure("denied")).toBe("The login was denied");
    expect(pollFailure("expired")).toBe("The code expired, start again");
    expect(pollFailure("failed")).toBe("The login failed");
  });
});

describe("DeviceConnectDialog", () => {
  it("shows the code and connects once the login lands", async () => {
    const onConnected = vi.fn();
    mocks.start.mockResolvedValue(attempt);
    mocks.poll
      .mockResolvedValueOnce({ status: "pending" })
      .mockResolvedValueOnce({ status: "connected" });
    render(
      <DeviceConnectDialog
        service="supergrok"
        credentialId="cred_acme"
        onClose={() => {}}
        onConnected={onConnected}
      />,
    );
    expect(screen.getByText("Connect SuperGrok")).toBeTruthy();
    expect(screen.getByText("Requesting a code")).toBeTruthy();
    await act(async () => {});
    expect(mocks.start).toHaveBeenCalledTimes(1);
    expect(mocks.start).toHaveBeenCalledWith({
      params: { service: "supergrok" },
      query: { credentialId: "cred_acme" },
    });
    expect(
      (screen.getByRole("textbox", { name: "code" }) as HTMLInputElement).value,
    ).toBe("ACME-1234");
    expect(screen.getByText("Waiting for SuperGrok")).toBeTruthy();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(mocks.poll).toHaveBeenCalledWith({
      params: { attemptId: "att_acme" },
    });
    expect(onConnected).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(onConnected).toHaveBeenCalledTimes(1);
  });

  it("offers a fresh start when the login fails", async () => {
    mocks.start.mockResolvedValue(attempt);
    mocks.poll.mockResolvedValue({ status: "denied" });
    render(
      <DeviceConnectDialog
        service="copilot"
        onClose={() => {}}
        onConnected={() => {}}
      />,
    );
    await act(async () => {});
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.getByText("The login was denied")).toBeTruthy();
    expect(screen.getByText("Start again to get a fresh code")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await act(async () => {});
    expect(mocks.start).toHaveBeenCalledTimes(2);
  });

  it("reports a login that cannot start", async () => {
    mocks.start.mockRejectedValue(new Error("offline"));
    render(
      <DeviceConnectDialog
        service="codex"
        onClose={() => {}}
        onConnected={() => {}}
      />,
    );
    await act(async () => {});
    expect(screen.getByText("Could not start the login")).toBeTruthy();
    expect(
      screen.getByText("Start again after changing the settings", {
        exact: false,
      }),
    ).toBeTruthy();
  });
});
