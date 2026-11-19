import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InvitesEmpty } from "./invites-empty";

const navigate = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

afterEach(() => {
  cleanup();
  navigate.mockClear();
});

describe("/invites with nothing to accept", () => {
  it("says there are no invitations instead of rendering nothing", () => {
    render(<InvitesEmpty />);
    expect(screen.getByText("No invitations yet")).toBeTruthy();
    expect(
      screen.getByText(/An invitation to a workspace shows up here/),
    ).toBeTruthy();
  });

  it("gives the reader a way out of the empty page", () => {
    render(<InvitesEmpty />);
    fireEvent.click(screen.getByRole("button", { name: "Go to threads" }));
    expect(navigate).toHaveBeenCalledWith({ to: "/threads" });
  });
});
