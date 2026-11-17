import { DateTime } from "effect";
import { describe, expect, it } from "vitest";
import {
  agentMovesEnabled,
  checkpointsEnabled,
  compareDevices,
  countLabel,
  deviceStatus,
  errorMessage,
  formatCountdown,
  formatRelative,
  hardwareRows,
  pairingCodeFromHash,
  pairingErrorMessage,
  workspaceDiffCounts,
} from "./status";

const now = Date.UTC(2026, 2, 2, 9);
const at = (minutesAgo: number) =>
  DateTime.makeUnsafe(now - minutesAgo * 60_000);

describe("deviceStatus", () => {
  it("is connected only while live and not revoked", () => {
    expect(
      deviceStatus(
        { revokedAt: null, connected: true, lastConnectedAt: at(1) },
        { now },
      ),
    ).toEqual({ color: "success", label: "Connected" });
    expect(
      deviceStatus(
        { revokedAt: at(5), connected: true, lastConnectedAt: at(90) },
        { now },
      ),
    ).toEqual({ color: "neutral", label: "Last seen 1h ago" });
    expect(
      deviceStatus(
        { revokedAt: null, connected: false, lastConnectedAt: null },
        { now },
      ),
    ).toEqual({ color: "neutral", label: "Never connected" });
  });
});

describe("formatting", () => {
  it("formats relative times like Capy", () => {
    expect(formatRelative(now - 2000, { now })).toBe("just now");
    expect(formatRelative(now - 3 * 86_400_000, { now })).toBe("3d ago");
    expect(formatRelative(now + 120_000, { now })).toBe("in 2m");
    expect(formatRelative(now - 3 * 86_400_000, { now, minified: true })).toBe(
      "3d",
    );
  });

  it("formats countdowns and counts", () => {
    expect(formatCountdown(14 * 60_000 + 5_400)).toBe("14:05");
    expect(formatCountdown(-1)).toBe("0:00");
    expect(countLabel(0, "device")).toBe("No devices");
    expect(countLabel(1, "device")).toBe("1 device");
    expect(countLabel(3, "device")).toBe("3 devices");
  });
});

describe("compareDevices", () => {
  it("puts live devices first and revoked last", () => {
    const base = { createdAt: at(1000), lastConnectedAt: at(10) };
    const revoked = { ...base, revokedAt: at(1), connected: false };
    const offline = { ...base, revokedAt: null, connected: false };
    const live = { ...base, revokedAt: null, connected: true };
    expect([revoked, offline, live].toSorted(compareDevices)).toEqual([
      live,
      offline,
      revoked,
    ]);
  });
});

describe("hardware and workspaces", () => {
  it("builds the hardware rows that have values", () => {
    expect(
      hardwareRows({
        model: "MacBook Pro",
        modelIdentifier: "Mac15,6",
        chip: "Apple M3 Pro",
        cpuCores: 10,
        memoryBytes: 32 * 1024 ** 3,
        osName: "macOS",
      }),
    ).toEqual([
      { label: "Model", value: "MacBook Pro, Mac15,6" },
      { label: "Chip", value: "Apple M3 Pro, 10 cores" },
      { label: "Memory", value: "32 GB" },
      { label: "System", value: "macOS" },
    ]);
  });

  it("hides empty diff counts", () => {
    expect(
      workspaceDiffCounts({
        root: "/a",
        repos: [],
        insertions: 0,
        deletions: 0,
      }),
    ).toBeUndefined();
    expect(
      workspaceDiffCounts({
        root: "/a",
        repos: [],
        insertions: 2,
        deletions: 1,
      }),
    ).toEqual({ insertions: 2, deletions: 1 });
  });
});

describe("pairing helpers", () => {
  it("reads the code from the link hash", () => {
    expect(pairingCodeFromHash("#code=BCDF-GHJK")).toBe("BCDF-GHJK");
    expect(pairingCodeFromHash("")).toBe("");
  });

  it("maps a missing code to Capy's message", () => {
    expect(
      pairingErrorMessage({ _tag: "capy/DeviceCodeNotFound" }, "fallback"),
    ).toBe("Code not found or no longer pending");
    expect(pairingErrorMessage(new Error("x"), "fallback")).toBe("fallback");
    expect(
      errorMessage({ _tag: "capy/InvalidRequest", message: "Bad" }, "fb"),
    ).toBe("Bad");
    expect(errorMessage({ _tag: "capy/DeviceNotFound" }, "fb")).toBe("fb");
  });

  it("defaults device preferences to on", () => {
    expect(checkpointsEnabled({})).toBe(true);
    expect(checkpointsEnabled({ devices: { autoSync: false } })).toBe(false);
    expect(agentMovesEnabled({ devices: { agentMoves: false } })).toBe(false);
  });
});
