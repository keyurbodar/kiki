import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AgentAccessRow, MessageAccessRow } from "./access";
import { DeviceAccessList, DeviceAgentAccessList } from "./device-access-lists";

afterEach(cleanup);

const now = new Date("2026-11-17T12:00:00.000Z").getTime();
const requestedAt = new Date(now - 60_000);

const messageRow = (
  overrides: Partial<MessageAccessRow> = {},
): MessageAccessRow => ({
  id: "jam_sample_request",
  member: "Alex Morgan",
  status: "requested",
  requestedAt,
  resolvedAt: null,
  heldText: "Hello from Alex",
  ...overrides,
});

const agentRow = (overrides: Partial<AgentAccessRow> = {}): AgentAccessRow => ({
  id: "jam_sample_agent",
  title: "build",
  target: { kind: "device", capability: "execution", deviceId: "jam_device" },
  status: "requested",
  requestedAt,
  resolvedAt: null,
  ...overrides,
});

describe("DeviceAccessList", () => {
  it("renders the empty state copy", () => {
    render(<DeviceAccessList rows={[]} />);
    expect(
      screen.getByText("No one has asked to message this thread yet"),
    ).toBeTruthy();
  });

  it("offers Deny and Allow for a request and Revoke for a grant", () => {
    const onGrant = vi.fn();
    const onDeny = vi.fn();
    const onRevoke = vi.fn();
    render(
      <>
        <DeviceAccessList
          rows={[messageRow()]}
          onGrant={onGrant}
          onDeny={onDeny}
          onRevoke={onRevoke}
        />
        <DeviceAccessList
          rows={[messageRow({ id: "jam_sample_grant", status: "granted" })]}
          onGrant={onGrant}
          onDeny={onDeny}
          onRevoke={onRevoke}
        />
      </>,
    );
    const denies = screen.getAllByRole("button", { name: "Deny" });
    const allows = screen.getAllByRole("button", { name: "Allow" });
    fireEvent.click(denies[0] as HTMLElement);
    fireEvent.click(allows[0] as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
    expect(onDeny).toHaveBeenCalledWith("jam_sample_request");
    expect(onGrant).toHaveBeenCalledWith("jam_sample_request");
    expect(onRevoke).toHaveBeenCalledWith("jam_sample_grant");
  });

  it("disables all buttons when another request is pending", () => {
    render(
      <DeviceAccessList
        rows={[
          messageRow(),
          messageRow({ id: "jam_sample_grant", status: "granted" }),
        ]}
        pendingId="grant:jam_sample_request"
        onGrant={vi.fn()}
        onDeny={vi.fn()}
        onRevoke={vi.fn()}
      />,
    );
    for (const button of screen.getAllByRole("button")) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }
  });
});

describe("DeviceAgentAccessList", () => {
  it("renders the empty state copy", () => {
    render(<DeviceAgentAccessList rows={[]} />);
    expect(
      screen.getByText("Capy has not asked for extra access from this thread"),
    ).toBeTruthy();
  });

  it("passes the whole row to the grant handler", () => {
    const onGrant = vi.fn();
    const row = agentRow();
    render(<DeviceAgentAccessList rows={[row]} onGrant={onGrant} />);
    fireEvent.click(screen.getByRole("button", { name: "Allow" }));
    expect(onGrant).toHaveBeenCalledWith(row);
  });

  it("disables all buttons when another request is pending", () => {
    render(
      <DeviceAgentAccessList
        rows={[
          agentRow(),
          agentRow({ id: "jam_sample_grant", status: "granted" }),
        ]}
        pendingId="grant:jam_sample_agent"
        onGrant={vi.fn()}
        onDeny={vi.fn()}
        onRevoke={vi.fn()}
      />,
    );
    for (const button of screen.getAllByRole("button")) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }
  });
});
