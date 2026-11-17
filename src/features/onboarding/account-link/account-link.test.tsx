import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountLinkPage } from "./account-link-page";
import {
  type AccountLinkPreview,
  initials,
  isUsableToken,
} from "./account-link-preview";

afterEach(cleanup);

const sample: AccountLinkPreview = {
  orgName: "Acme",
  externalUserId: "U012345",
  externalUserName: "Alex Morgan",
  workspaceName: "Acme workspace",
};

const page = (overrides: Partial<Parameters<typeof AccountLinkPage>[0]>) =>
  render(
    <AccountLinkPage
      token="sample-token"
      provider="Slack"
      icon={null}
      connectedHref="/settings/integrations/slack?slack=connected"
      preview={() => Promise.resolve(sample)}
      complete={() => Promise.resolve()}
      {...overrides}
    />,
  );

describe("account link helpers", () => {
  it("accepts tokens of 1 to 512 characters", () => {
    expect(isUsableToken(undefined)).toBe(false);
    expect(isUsableToken("")).toBe(false);
    expect(isUsableToken("a".repeat(512))).toBe(true);
    expect(isUsableToken("a".repeat(513))).toBe(false);
  });

  it("builds initials from the first and last word", () => {
    expect(initials("Alex Morgan")).toBe("AM");
    expect(initials("  sam ")).toBe("S");
    expect(initials("Jo Ann Lee")).toBe("JL");
  });
});

describe("AccountLinkPage", () => {
  it("fails without a usable token", () => {
    const preview = vi.fn();
    page({ token: undefined, preview });
    expect(screen.getByText("Slack account link failed")).toBeTruthy();
    expect(
      screen.getByText("Request a new link from Slack and try again"),
    ).toBeTruthy();
    expect(preview).not.toHaveBeenCalled();
  });

  it("fails when the token is expired or rejected", async () => {
    page({ preview: () => Promise.reject(new Error("expired")) });
    expect(screen.getByText("Checking your Slack link")).toBeTruthy();
    await screen.findByText("Slack account link failed");
  });

  it("confirms and links the account", async () => {
    const complete = vi.fn(() => Promise.resolve());
    const navigate = vi.fn();
    page({ complete, navigate });
    await screen.findByText("Link this Slack account?");
    expect(
      screen.getByText(
        "Messages it sends to Capy will run as you in Acme, with your projects and connected accounts",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Alex Morgan")).toBeTruthy();
    expect(screen.getByText("Acme workspace")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Link account" }));
    expect(screen.getByRole("button", { name: "Linking" })).toBeTruthy();
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        "/settings/integrations/slack?slack=connected",
      ),
    );
    expect(complete).toHaveBeenCalledWith("sample-token");
  });

  it("falls back to the provider workspace and returns home on cancel", async () => {
    const navigate = vi.fn();
    page({
      navigate,
      preview: () =>
        Promise.resolve({ orgName: "Acme", externalUserId: "U012345" }),
    });
    await screen.findByText("Slack workspace");
    expect(screen.getByText("U012345")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(navigate).toHaveBeenCalledWith("/");
  });

  it("fails when linking is refused", async () => {
    page({ complete: () => Promise.reject(new Error("gone")) });
    fireEvent.click(
      await screen.findByRole("button", { name: "Link account" }),
    );
    await screen.findByText("Slack account link failed");
  });
});
