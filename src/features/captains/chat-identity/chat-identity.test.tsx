import { RegistryProvider } from "@effect/atom-react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { orgId } from "@/data/mocks/fixtures/world";
import { ChatIdentity, nextCaptainName } from "./chat-identity";

afterEach(cleanup);

describe("nextCaptainName", () => {
  it("saves only a changed, non-empty name", () => {
    expect(nextCaptainName("  Ops  ", "Release")).toBe("Ops");
    expect(nextCaptainName("Release", "Release")).toBeUndefined();
    expect(nextCaptainName("   ", "Release")).toBeUndefined();
  });
});

describe("ChatIdentity", () => {
  it("shows the Captain's name, description and links", async () => {
    render(
      <RegistryProvider>
        <ChatIdentity
          orgId={orgId}
          jamId="jam_sample_cap1"
          fallbackName="Captain"
          onShare={() => {}}
        />
      </RegistryProvider>,
    );
    expect(await screen.findByText("Release captain")).toBeTruthy();
    expect(
      screen.getByText("Runs the weekly web release and its follow-ups."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "View Captain" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Share" })).toBeTruthy();
  });

  it("supports compact thread-row usage", () => {
    const { container } = render(
      <RegistryProvider>
        <ChatIdentity name="Alex Morgan" />
      </RegistryProvider>,
    );
    const tile = container.querySelector('[data-slot="chat-identity"]');
    expect(tile?.textContent).toBe("A");
    expect(tile?.className).toContain("size-4");
  });

  it("offers renaming and the avatar button when editable", () => {
    render(
      <RegistryProvider>
        <ChatIdentity fallbackName="Captain" editable />
      </RegistryProvider>,
    );
    expect(screen.getByRole("button", { name: "Change avatar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Captain" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
  });
});
