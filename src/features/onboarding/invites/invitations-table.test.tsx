import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DateTime } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrgId } from "@/data/api/schemas/ids";
import {
  JoinableOrganization,
  MyInvitation,
} from "@/data/api/schemas/invitation";
import { InvitationsTable, type InvitationsTableProps } from "./invitations-table";

afterEach(cleanup);

const invitation = new MyInvitation({
  id: "inv_1",
  orgId: OrgId.make("org_1"),
  orgName: "Globex",
  orgAvatarUrl: null,
  inviterName: "Robin Park",
  projectCount: 2,
  invitedAt: DateTime.makeUnsafe("2026-03-01T09:00:00.000Z"),
});

const organization = new JoinableOrganization({
  orgId: OrgId.make("org_2"),
  orgName: "Umbrella Studio",
  orgAvatarUrl: null,
  projectCount: 0,
});

const renderTable = (props: Partial<InvitationsTableProps> = {}) =>
  render(
    <InvitationsTable
      invitations={[invitation]}
      organizations={[organization]}
      onRetry={() => {}}
      accepting={null}
      onAccept={() => {}}
      onJoin={() => {}}
      {...props}
    />,
  );

describe("InvitationsTable", () => {
  it("lists invitations and domain organizations", () => {
    const onAccept = vi.fn();
    const onJoin = vi.fn();
    renderTable({ onAccept, onJoin });
    expect(screen.getByText("Robin Park invited you · 2 projects")).toBeTruthy();
    expect(screen.getByText("Available through your email domain")).toBeTruthy();
    expect(screen.getByText("no projects yet")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    fireEvent.click(screen.getByRole("button", { name: "Join" }));
    expect(onAccept).toHaveBeenCalledWith(invitation);
    expect(onJoin).toHaveBeenCalledWith(organization);
  });

  it("shows the empty state and hides an empty domain section", () => {
    renderTable({ invitations: [], organizations: [] });
    expect(screen.getByText("No pending invitations")).toBeTruthy();
    expect(screen.queryByText("Available through your email domain")).toBeNull();
  });

  it("offers a retry when loading fails", () => {
    const onRetry = vi.fn();
    renderTable({
      invitations: undefined,
      invitationsFailed: true,
      organizations: undefined,
      organizationsFailed: true,
      onRetry,
    });
    expect(screen.getByText("Could not load your invitations")).toBeTruthy();
    expect(screen.getByText("Could not load organizations to join")).toBeTruthy();
    for (const button of screen.getAllByRole("button", { name: "Try again" })) {
      fireEvent.click(button);
    }
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it("marks the row being joined and locks the others", () => {
    renderTable({ accepting: "invite:inv_1" });
    expect(screen.getByRole("button", { name: "Joining" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("button", { name: "Join" })).toHaveProperty(
      "disabled",
      true,
    );
  });
});
