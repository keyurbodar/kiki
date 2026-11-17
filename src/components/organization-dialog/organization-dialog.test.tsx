import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  OrganizationDialogView,
  type OrganizationDialogViewProps,
} from "./organization-dialog";

afterEach(cleanup);

const invitation = {
  id: "inv_1",
  orgName: "Northwind Labs",
  orgAvatarUrl: null,
  inviterName: "Alex Morgan",
  projectCount: 2,
};

const renderView = (props: Partial<OrganizationDialogViewProps> = {}) => {
  const handlers = {
    onOpenChange: vi.fn(),
    onRetryInvitations: vi.fn(),
    onRetryOrganizations: vi.fn(),
    onCreate: vi.fn(() => Promise.resolve()),
    onJoinInvitation: vi.fn(() => Promise.resolve()),
    onJoinOrganization: vi.fn(() => Promise.resolve()),
  };
  render(
    <OrganizationDialogView
      open
      invitations={[]}
      organizations={[]}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
};

describe("OrganizationDialogView", () => {
  it("starts on the choice step and continues to create", () => {
    renderView();
    expect(screen.getByText("Create or join organization")).toBeTruthy();
    expect(
      screen.getByRole("radio", { name: /Create a new organization/ }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.getByText("Set up a shared workspace for your team"),
    ).toBeTruthy();
    const create = screen.getByRole("button", { name: "Create organization" });
    expect((create as HTMLButtonElement).disabled).toBe(true);
  });

  it("creates with the trimmed name and closes", async () => {
    const handlers = renderView({ initialStep: "create" });
    fireEvent.change(screen.getByLabelText("Organization name"), {
      target: { value: "  Globex  " },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create organization" }),
    );
    expect(handlers.onCreate).toHaveBeenCalledWith("Globex", null);
    await waitFor(() =>
      expect(handlers.onOpenChange).toHaveBeenCalledWith(false),
    );
  });

  it("shows the empty join state", () => {
    renderView({ initialStep: "join" });
    expect(screen.getByText("No organizations available")).toBeTruthy();
    expect(
      screen.getByText(
        "Ask an admin to invite you or allow your work email domain",
      ),
    ).toBeTruthy();
    const join = screen.getByRole("button", { name: "Join organization" });
    expect((join as HTMLButtonElement).disabled).toBe(true);
  });

  it("joins the first invitation by default", async () => {
    const handlers = renderView({
      initialStep: "join",
      invitations: [invitation],
    });
    expect(
      screen.getByText("Alex Morgan invited you · 2 projects"),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Join Northwind Labs" }),
    );
    expect(handlers.onJoinInvitation).toHaveBeenCalledWith(invitation);
    await waitFor(() =>
      expect(handlers.onOpenChange).toHaveBeenCalledWith(false),
    );
  });

  it("offers a retry when a list fails to load", () => {
    const handlers = renderView({
      initialStep: "join",
      invitations: undefined,
      invitationsFailed: true,
    });
    expect(screen.getByText("Could not load invitations")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(handlers.onRetryInvitations).toHaveBeenCalled();
  });

  it("goes back to the choice step", () => {
    renderView({ initialStep: "join" });
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen.getByText("Choose how to set up your next workspace"),
    ).toBeTruthy();
  });
});
