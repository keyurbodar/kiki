import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ThreadDevice } from "@/features/thread/device-chip";
import {
  checkpointStaged,
  DeviceOfflineStateView,
  HANDOFF_FAILURES,
  handoffFailure,
} from "./device-offline-state";

afterEach(cleanup);

const device: ThreadDevice = {
  deviceId: "jam_device",
  name: "build",
  rootJamId: "jam_root",
  workspaceRoot: "/home/jam_sample_workspace",
  workspaceKind: "worktree",
  viewerAccess: "owner",
  ownerName: null,
};

describe("handoffFailure", () => {
  it("maps known tags and falls back to a generic message", () => {
    for (const [tag, message] of Object.entries(HANDOFF_FAILURES)) {
      expect(handoffFailure({ _tag: tag })).toBe(message);
    }
    expect(handoffFailure({ _tag: "jam_sample_unknown" })).toBe(
      "The handoff could not start",
    );
    expect(handoffFailure(null)).toBe("The handoff could not start");
  });
});

describe("checkpointStaged", () => {
  it("checks the attachment for the current jam", () => {
    const base = {
      jamId: "jam_root",
      wake: vi.fn(),
      waking: false,
    };
    expect(checkpointStaged({ ...base, machine: null })).toBe(false);
    expect(
      checkpointStaged({
        ...base,
        machine: {
          state: "asleep",
          stateChangedAt: null,
          device: null,
          attachments: [
            { jamId: "jam_other", checkpointStaged: true },
            { jamId: "jam_root", checkpointStaged: false },
          ],
        },
      }),
    ).toBe(false);
    expect(
      checkpointStaged({
        ...base,
        machine: {
          state: "asleep",
          stateChangedAt: null,
          device: null,
          attachments: [{ jamId: "jam_root", checkpointStaged: true }],
        },
      }),
    ).toBe(true);
  });
});

describe("DeviceOfflineStateView", () => {
  it("shows the offline copy and the move action only when allowed", () => {
    const onMoveToCloud = vi.fn();
    const { rerender } = render(
      <DeviceOfflineStateView
        device={device}
        canMove={false}
        moving={false}
        onMoveToCloud={onMoveToCloud}
      />,
    );
    expect(screen.getByText("Device is offline")).toBeTruthy();
    expect(
      screen.getByText("Open the Capy desktop app on build to reconnect"),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Move to cloud" })).toBeNull();

    rerender(
      <DeviceOfflineStateView
        device={device}
        canMove
        moving={false}
        onMoveToCloud={onMoveToCloud}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Move to cloud" }));
    expect(onMoveToCloud).toHaveBeenCalledOnce();
  });
});
