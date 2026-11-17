import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PublicPromotionSignUpView,
  PublicPromotionView,
  type PublicPromotionViewProps,
} from "./promotion-view";

afterEach(cleanup);

const organizations = [
  { id: "org_a", name: "Acme", avatarUrl: null },
  { id: "org_b", name: "Northwind Labs", avatarUrl: null },
];

const props = (
  overrides: Partial<PublicPromotionViewProps> = {},
): PublicPromotionViewProps => ({
  creditAmount: 50_000,
  state: "available",
  organizations,
  organizationsError: false,
  selectedOrgId: "org_a",
  claiming: false,
  onSelectOrganization: vi.fn(),
  onClaim: vi.fn(),
  onCreateOrganization: vi.fn(() => Promise.resolve()),
  onContinue: vi.fn(),
  onSwitchAccount: vi.fn(),
  ...overrides,
});

describe("PublicPromotionView", () => {
  it("offers the claim for the selected organization", () => {
    const view = props();
    render(<PublicPromotionView {...view} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "$50.00 in credits",
    );
    fireEvent.click(screen.getByRole("button", { name: "Claim for Acme" }));
    expect(view.onClaim).toHaveBeenCalled();
    expect(
      screen.getByText("One claim per account and organization"),
    ).toBeTruthy();
  });

  it("shows the loading and error states for organizations", () => {
    const { rerender } = render(
      <PublicPromotionView {...props({ organizations: undefined })} />,
    );
    expect(
      screen.getByRole("status", { name: "Loading organizations" }),
    ).toBeTruthy();
    const onRetry = vi.fn();
    rerender(
      <PublicPromotionView
        {...props({
          organizations: undefined,
          organizationsError: true,
          onRetryOrganizations: onRetry,
        })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("asks for an organization name when there is none", () => {
    render(<PublicPromotionView {...props({ organizations: [] })} />);
    expect(screen.getByLabelText("Organization name")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });

  it("renders terminal states", () => {
    const view = props({ state: "email_mismatch" });
    const { rerender } = render(<PublicPromotionView {...view} />);
    expect(screen.getByText("Email does not match")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Switch account" }));
    expect(view.onSwitchAccount).toHaveBeenCalled();
    rerender(<PublicPromotionView {...props({ state: "exhausted" })} />);
    expect(screen.getByText("Fully claimed")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Go to Capy" })).toBeTruthy();
  });

  it("shows the claimed balance", () => {
    render(
      <PublicPromotionView
        {...props({
          state: "granted",
          balance: {
            organization: organizations[0] as (typeof organizations)[number],
            beforeCredits: 10_000,
            afterCredits: 60_000,
            settled: true,
          },
        })}
      />,
    );
    expect(screen.getByText("$60.00")).toBeTruthy();
    expect(screen.getByText("Added")).toBeTruthy();
    expect(
      screen.queryByText("One claim per account and organization"),
    ).toBeNull();
  });
});

describe("PublicPromotionSignUpView", () => {
  it("asks signed-out visitors to sign up", () => {
    const onSignUp = vi.fn();
    render(
      <PublicPromotionSignUpView creditAmount={20_000} onSignUp={onSignUp} />,
    );
    expect(screen.getByText("Claim with a Capy account")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sign up to claim" }));
    expect(onSignUp).toHaveBeenCalled();
  });
});
