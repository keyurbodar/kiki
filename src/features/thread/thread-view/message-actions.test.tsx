import { RegistryProvider } from "@effect/atom-react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { orgId } from "@/data/mocks/fixtures/world";
import { useMessageActions } from "@/features/thread/message-footer";
import { ThreadMessageActions } from "./message-actions";

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
