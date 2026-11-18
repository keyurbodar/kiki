import { RegistryProvider } from "@effect/atom-react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { orgId } from "@/data/mocks/fixtures/world";
import { useMessageActions } from "@/features/thread/message-footer";
import { ThreadMessageActions } from "./message-actions";

const JumpProbe = () => {
  const actions = useMessageActions();
  return (
    <span>{actions.jumpToSection === undefined ? "no-jump" : "jump"}</span>
  );
};

const Probe = () => {
  const actions = useMessageActions();
  const actor = actions.resolveActor?.({
    type: "user",
    userId: "user_sample_alex",
  } as never);
  return (
    <span>
      {actions.viewerUserId ?? "no-viewer"}|{actor?.name ?? "unresolved"}
    </span>
  );
};

describe("ThreadMessageActions", () => {
  it("gives the chat list the viewer and the member names behind each actor", async () => {
    render(
      <RegistryProvider>
        <ThreadMessageActions orgId={orgId}>
          <Probe />
        </ThreadMessageActions>
      </RegistryProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText("user_sample_alex|Alex Morgan")).toBeTruthy();
    });
  });

  it("hands the timeline a jump for a quote that is clicked", async () => {
    render(
      <RegistryProvider>
        <ThreadMessageActions orgId={orgId} jumpToSection={() => {}}>
          <JumpProbe />
        </ThreadMessageActions>
      </RegistryProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText("jump")).toBeTruthy();
    });
  });

  it("leaves the jump unwired when the screen has no timeline to scroll", async () => {
    render(
      <RegistryProvider>
        <ThreadMessageActions orgId={orgId}>
          <JumpProbe />
        </ThreadMessageActions>
      </RegistryProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText("no-jump")).toBeTruthy();
    });
  });

  it("falls back to the raw id when there is no org to read members from", async () => {
    render(
      <RegistryProvider>
        <ThreadMessageActions orgId={undefined}>
          <Probe />
        </ThreadMessageActions>
      </RegistryProvider>,
    );
    await waitFor(() => {
      expect(screen.getByText(/no-viewer|unresolved/)).toBeTruthy();
    });
  });
});
