import { RegistryProvider } from "@effect/atom-react";
import { cleanup, render, screen } from "@testing-library/react";
import { Schema } from "effect";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeThreadFixtures, TimelineRow } from "@/data/events";
import { timelineRows } from "./registry";

const decodeRow = Schema.decodeUnknownSync(TimelineRow);
const rows = makeThreadFixtures().rows.map((row) => decodeRow(row));

const proposal = {
  kind: "add",
  reason: "The thread asked for the docs server so the page can be read.",
  project: "current",
  owner: "organization",
  secrets: {},
  server: {
    serverKey: "docs",
    displayName: "Docs search",
    iconUrl: null,
    transport: {
      type: "http",
      url: "https://mcp.example.com/docs",
      requestHeaderNames: [],
      auth: {
        type: "none",
        credentialHeaderNames: [],
        clientId: null,
        clientSecretRequired: false,
      },
    },
  },
};

const row = {
  ...rows.find((candidate) => candidate.type === "mcp-setup"),
  proposal,
} as Extract<(typeof rows)[number], { type: "mcp-setup" }>;

const current = vi.hoisted(() => ({
  setups: [] as ReadonlyArray<{ toolCallId: string; current: string }>,
}));

vi.mock("@/data/atoms/mcp-setup.ts", async (importOriginal) => {
  const { Atom: MockAtom } = await import("effect/reactivity");
  const { AsyncResult: MockResult } = await import("effect/reactivity");
  return {
    ...(await importOriginal<typeof import("@/data/atoms/mcp-setup.ts")>()),
    mcpSetupsAtom: () =>
      MockAtom.make(MockResult.success(current.setups) as never),
    createMcpSetupAtom: MockAtom.make(() => undefined),
    completeMcpSetupAtom: MockAtom.make(() => undefined),
  };
});

vi.mock("@/data/atoms/session.ts", async (importOriginal) => {
  const { Atom: MockAtom } = await import("effect/reactivity");
  const { AsyncResult: MockResult } = await import("effect/reactivity");
  return {
    ...(await importOriginal<typeof import("@/data/atoms/session.ts")>()),
    organizationsAtom: MockAtom.make(
      MockResult.success([{ id: "org_sample", name: "Acme" }]) as never,
    ),
  };
});

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useParams: () => ({ threadId: "jam_sample_0002" }),
}));

afterEach(cleanup);

const renderRow = () => {
  const entry = timelineRows.get("mcp-setup") as unknown as {
    component: ComponentType<{ row: typeof row }>;
  };
  const Component = entry.component;
  return render(
    <RegistryProvider>
      <Component row={row} />
    </RegistryProvider>,
  );
};

describe("the MCP setup row's answer", () => {
  it("waits on the person when the thread carries no setup for the call", () => {
    current.setups = [];
    renderRow();
    expect(screen.getByText("Waiting on you")).toBeTruthy();
  });

  it("reads a declined setup the thread already carries", () => {
    current.setups = [
      { toolCallId: String(row.toolCallId), current: "declined" },
    ];
    renderRow();
    expect(screen.getByText("Declined")).toBeTruthy();
    expect(screen.queryByText("Waiting on you")).toBeNull();
  });

  it("ignores a setup recorded for a different tool call", () => {
    current.setups = [{ toolCallId: "toolu_other", current: "declined" }];
    renderRow();
    expect(screen.getByText("Waiting on you")).toBeTruthy();
  });
});
