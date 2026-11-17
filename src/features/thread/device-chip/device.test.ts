import { describe, expect, it } from "vitest";
import {
  devicePresence,
  offlineHint,
  presenceColor,
  presenceLabel,
  RECONNECT_GRACE_MS,
  type ThreadDevice,
  type ThreadMachine,
  workspaceKindLabel,
} from "./device";

const machine = (overrides: Partial<ThreadMachine> = {}): ThreadMachine => ({
  state: "running",
  stateChangedAt: null,
  device: { connected: false },
  attachments: [],
  ...overrides,
});

const device = (overrides: Partial<ThreadDevice> = {}): ThreadDevice => ({
  deviceId: "jam_device",
  name: "build",
  rootJamId: "jam_root",
  workspaceRoot: "/home/jam_sample_workspace",
  workspaceKind: "worktree",
  viewerAccess: "none",
  ownerName: "Alex Morgan",
  ...overrides,
});

describe("devicePresence", () => {
  it("reports connected when there is no device attachment or it is connected", () => {
    expect(devicePresence(machine({ device: null }), 0)).toEqual({
      kind: "connected",
    });
    expect(devicePresence(machine({ device: { connected: true } }), 0)).toEqual(
      { kind: "connected" },
    );
  });

  it("reconnects while creating or waking without a deadline", () => {
    for (const state of ["creating", "waking"] as const) {
      expect(devicePresence(machine({ state }), 1000)).toEqual({
        kind: "reconnecting",
        until: null,
      });
    }
  });

  it("offers a grace period after a disconnect and then goes offline", () => {
    const changedAt = new Date(1000);
    const gone = machine({
      state: "gone",
      stateChangedAt: changedAt,
      goneReason: "disconnected",
    });
    expect(devicePresence(gone, 1000 + RECONNECT_GRACE_MS - 1)).toEqual({
      kind: "reconnecting",
      until: new Date(1000 + RECONNECT_GRACE_MS),
    });
    expect(devicePresence(gone, 1000 + RECONNECT_GRACE_MS)).toEqual({
      kind: "offline",
    });
  });

  it("does not reconnect for other gone reasons or missing timestamps", () => {
    expect(
      devicePresence(
        machine({
          state: "gone",
          stateChangedAt: new Date(1000),
          goneReason: "retired",
        }),
        1000,
      ),
    ).toEqual({ kind: "offline" });
    expect(
      devicePresence(
        machine({
          state: "gone",
          stateChangedAt: null,
          goneReason: "disconnected",
        }),
        1000,
      ),
    ).toEqual({ kind: "offline" });
    expect(
      devicePresence(
        machine({ state: "asleep", stateChangedAt: new Date(1000) }),
        1000,
      ),
    ).toEqual({ kind: "offline" });
  });
});

describe("presenceLabel and presenceColor", () => {
  it("rounds the reconnect deadline up to whole seconds", () => {
    expect(presenceLabel({ kind: "connected" }, 0)).toBe("Connected");
    expect(presenceLabel({ kind: "offline" }, 0)).toBe("Offline");
    expect(presenceLabel({ kind: "reconnecting", until: null }, 0)).toBe(
      "Reconnecting",
    );
    expect(
      presenceLabel({ kind: "reconnecting", until: new Date(12_100) }, 100),
    ).toBe("Reconnecting, 12s");
  });

  it("maps presence onto status colors", () => {
    expect(presenceColor({ kind: "connected" })).toBe("success");
    expect(presenceColor({ kind: "reconnecting", until: null })).toBe(
      "warning",
    );
    expect(presenceColor({ kind: "offline" })).toBe("neutral");
  });
});

describe("workspaceKindLabel and offlineHint", () => {
  it("labels workspaces and tells each viewer how to reconnect", () => {
    expect(workspaceKindLabel("worktree")).toBe("Worktree");
    expect(workspaceKindLabel("checkout")).toBe("Current checkout");
    expect(offlineHint(device({ viewerAccess: "owner" }))).toBe(
      "Open the Capy desktop app on build to reconnect",
    );
    expect(offlineHint(device({ viewerAccess: "granted" }))).toBe(
      "Alex Morgan needs to open the Capy desktop app on build",
    );
    expect(offlineHint(device({ viewerAccess: "none", ownerName: null }))).toBe(
      "Its owner needs to open the Capy desktop app on build",
    );
  });
});
