import { describe, expect, it } from "vitest";
import {
  accessFailure,
  accessStatusLine,
  byAccessOrder,
  deviceAgentRow,
  messageAccessRows,
  parseAgentAccess,
  parseDeviceAccess,
  permissionCallDetail,
  type RawAgentAccess,
  type RawDeviceAccess,
  relativeTime,
} from "./access";

const now = new Date("2026-11-17T12:00:00.000Z").getTime();
const ago = (ms: number) => new Date(now - ms);

describe("relativeTime", () => {
  it("rounds recent and older timestamps, including the future", () => {
    expect(relativeTime(ago(4000), now)).toBe("just now");
    expect(relativeTime(ago(30_000), now)).toBe("30s ago");
    expect(relativeTime(ago(5 * 60_000), now)).toBe("5m ago");
    expect(relativeTime(ago(3 * 60 * 60_000), now)).toBe("3h ago");
    expect(relativeTime(ago(2 * 24 * 60 * 60_000), now)).toBe("2d ago");
    expect(relativeTime(ago(14 * 24 * 60 * 60_000), now)).toBe("2w ago");
    expect(relativeTime(ago(365 * 24 * 60 * 60_000), now)).toBe("1y ago");
    expect(relativeTime(now + 5 * 60_000, now)).toBe("in 5m");
  });
});

describe("accessStatusLine", () => {
  it("describes each status using the resolution time when present", () => {
    const base = {
      requestedAt: ago(120_000),
      resolvedAt: ago(60_000),
    };
    expect(accessStatusLine({ ...base, status: "requested" }, now)).toBe(
      "Asked 2m ago",
    );
    expect(accessStatusLine({ ...base, status: "granted" }, now)).toBe(
      "Allowed 1m ago",
    );
    expect(accessStatusLine({ ...base, status: "denied" }, now)).toBe(
      "Denied 1m ago",
    );
    expect(accessStatusLine({ ...base, status: "revoked" }, now)).toBe(
      "Revoked 1m ago",
    );
    expect(
      accessStatusLine(
        { status: "granted", requestedAt: ago(120_000), resolvedAt: null },
        now,
      ),
    ).toBe("Allowed 2m ago");
  });
});

describe("byAccessOrder", () => {
  it("ranks requested before granted before the rest, newest first within a rank", () => {
    const rows = [
      { status: "denied", requestedAt: ago(10_000) },
      { status: "granted", requestedAt: ago(20_000) },
      { status: "requested", requestedAt: ago(30_000) },
      { status: "granted", requestedAt: ago(5_000) },
      { status: "requested", requestedAt: ago(1_000) },
    ] as const;
    expect([...rows].sort(byAccessOrder).map((row) => row.status)).toEqual([
      "requested",
      "requested",
      "granted",
      "granted",
      "denied",
    ]);
    expect(
      [...rows].sort(byAccessOrder).map((row) => row.requestedAt.getTime()),
    ).toEqual([
      now - 1_000,
      now - 30_000,
      now - 5_000,
      now - 20_000,
      now - 10_000,
    ]);
  });
});

describe("parseDeviceAccess", () => {
  it("accepts arrays or rows/items wrappers and drops unusable rows", () => {
    const source = {
      rows: [
        {
          id: "jam_sample_1",
          threadId: "jam_root",
          userId: "jam_user",
          status: "requested",
          requestedAt: "2026-11-17T11:00:00.000Z",
          held: { text: "Hello from Alex", fileCount: 2 },
        },
        { id: "jam_sample_2", status: "unknown", requestedAt: now },
        { id: "jam_sample_3", status: "granted", requestedAt: "not a date" },
        { status: "granted", requestedAt: now },
      ],
    };
    const parsed = parseDeviceAccess(source);
    expect(parsed.map((row) => row.id)).toEqual(["jam_sample_1"]);
    expect(parsed[0]?.status).toBe("requested");
    expect(parsed[0]?.held).toEqual({ text: "Hello from Alex", fileCount: 2 });
    expect(parseDeviceAccess({ items: source.rows }).map((r) => r.id)).toEqual([
      "jam_sample_1",
    ]);
    expect(parseDeviceAccess(source.rows).map((r) => r.id)).toEqual([
      "jam_sample_1",
    ]);
  });
});

describe("messageAccessRows", () => {
  it("filters by the root thread and falls back to a teammate label", () => {
    const rows: RawDeviceAccess[] = [
      {
        id: "jam_sample_1",
        threadId: "jam_root",
        userId: "jam_user",
        status: "requested",
        requestedAt: ago(1000),
        resolvedAt: null,
        held: { text: "Hello from Alex", fileCount: 1 },
      },
      {
        id: "jam_sample_2",
        threadId: "jam_other",
        userId: "jam_user_2",
        status: "requested",
        requestedAt: ago(1000),
        resolvedAt: null,
        held: null,
      },
      {
        id: "jam_sample_3",
        threadId: "jam_root",
        userId: "jam_user_3",
        status: "granted",
        requestedAt: ago(1000),
        resolvedAt: null,
        held: null,
      },
    ];
    expect(
      messageAccessRows(rows, "jam_root", (id) =>
        id === "jam_user" ? "Alex Morgan" : undefined,
      ),
    ).toEqual([
      {
        id: "jam_sample_1",
        member: "Alex Morgan",
        status: "requested",
        requestedAt: ago(1000),
        resolvedAt: null,
        heldText: "Hello from Alex",
      },
      {
        id: "jam_sample_3",
        member: "A teammate",
        status: "granted",
        requestedAt: ago(1000),
        resolvedAt: null,
        heldText: null,
      },
    ]);
  });
});

describe("parseAgentAccess", () => {
  it("accepts wrappers and rejects bad status or date rows", () => {
    const source = [
      {
        id: "jam_sample_1",
        capability: "computer_use",
        deviceId: "jam_device",
        deviceName: "build",
        workspaceRoot: "/home/jam_sample_workspace",
        toolName: "computer",
        toolInput: { target: { app: { name: "Acme Editor" } } },
        status: "requested",
        requestedAt: now,
      },
      { id: "jam_sample_bad_status", status: "unknown", requestedAt: now },
      { id: "jam_sample_bad_date", status: "granted", requestedAt: false },
    ];
    expect(parseAgentAccess(source).map((row) => row.id)).toEqual([
      "jam_sample_1",
    ]);
    expect(parseAgentAccess({ items: source })[0]?.capability).toBe(
      "computer_use",
    );
  });
});

describe("permissionCallDetail", () => {
  const base = {
    capability: "computer_use" as const,
    workspaceRoot: "/home/jam_sample_workspace",
  };
  it("describes execution calls by workspace root", () => {
    expect(
      permissionCallDetail({
        capability: "execution",
        workspaceRoot: "/home/jam_sample_workspace",
        toolInput: {},
      }),
    ).toBe("/home/jam_sample_workspace");
  });

  it("uses app name, bundle id, screen, or active application for computer use", () => {
    expect(
      permissionCallDetail({
        ...base,
        toolInput: { target: { app: { name: "Acme Editor" } } },
      }),
    ).toBe("Acme Editor");
    expect(
      permissionCallDetail({
        ...base,
        toolInput: { target: { app: { bundleId: "com.acme.editor" } } },
      }),
    ).toBe("com.acme.editor");
    expect(
      permissionCallDetail({
        ...base,
        toolInput: { target: { kind: "screen" } },
      }),
    ).toBe("the screen");
    expect(permissionCallDetail({ ...base, toolInput: {} })).toBe(
      "the active application",
    );
  });
});

describe("deviceAgentRow and accessFailure", () => {
  it("titles computer-use rows and supplies action failure copy", () => {
    const row: RawAgentAccess = {
      id: "jam_sample_1",
      capability: "computer_use",
      deviceId: "jam_device",
      deviceName: "build",
      workspaceRoot: "/home/jam_sample_workspace",
      toolName: "computer",
      toolInput: {},
      status: "requested",
      requestedAt: ago(1000),
      resolvedAt: null,
    };
    expect(deviceAgentRow(row).title).toBe("Computer use on build");
    expect(deviceAgentRow({ ...row, capability: "execution" }).title).toBe(
      "build",
    );
    expect(accessFailure("grant")).toBe("Could not allow access");
    expect(accessFailure("deny")).toBe("Could not deny access");
    expect(accessFailure("revoke")).toBe("Could not revoke access");
  });
});
