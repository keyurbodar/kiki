import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AgentMessage } from "@/features/thread/agent-message";
import { MessageActionsProvider } from "@/features/thread/message-footer";
import { buildReply } from "@/features/thread/reply-quote";
import { UserMessage, type UserMessageRow } from "./user-message";

afterEach(cleanup);

const userRow = {
  id: "row_user",
  eventId: "01JAAAAAAAAAAAAAAAAAAAAAAA",
  createdAt: new Date(2026, 10, 17, 9, 0),
  type: "user-message",
  text: "Can you check the build?",
  mentions: [],
  files: [],
  delivery: "queue",
  actor: { type: "user", userId: "user_sample" },
  origin: { type: "web" },
  showOrigin: false,
  state: "answered",
} as unknown as UserMessageRow;

describe("UserMessage", () => {
  it("renders the viewer's own message without a header", () => {
    render(
      <MessageActionsProvider
        value={{ viewerUserId: "user_sample", editMessage: () => {} }}
      >
        <UserMessage row={userRow} />
      </MessageActionsProvider>,
    );
    expect(screen.getByText("Can you check the build?")).toBeTruthy();
    expect(document.querySelector("[data-slot=message-header]")).toBeNull();
    expect(screen.getByLabelText("Edit message")).toBeTruthy();
  });

  it("shows the sender for someone else's message and no edit", () => {
    render(
      <MessageActionsProvider
        value={{
          viewerUserId: "user_other",
          resolveActor: () => ({ name: "Sam Lee" }),
        }}
      >
        <UserMessage row={userRow} />
      </MessageActionsProvider>,
    );
    expect(screen.getByText("Sam Lee")).toBeTruthy();
    expect(screen.queryByLabelText("Edit message")).toBeNull();
  });

  it("renders a reply quote above the body", () => {
    const sent = buildReply(
      { text: "Agreed", mentions: [] },
      { eventId: "evt", rowId: "row_agent", section: 0, text: "Ship it today" },
    );
    render(<UserMessage row={{ ...userRow, ...sent }} />);
    const quote = document.querySelector("[data-slot=reply-quote]");
    expect(quote?.textContent).toContain("Ship it today");
    expect(screen.getByText("Agreed")).toBeTruthy();
  });
});

describe("AgentMessage", () => {
  it("renders one section per block and the interrupted status", () => {
    render(
      <AgentMessage
        row={
          {
            id: "row_agent",
            eventId: "01JBBBBBBBBBBBBBBBBBBBBBBB",
            createdAt: new Date(2026, 10, 17, 9, 1),
            type: "agent-message",
            settled: false,
            interrupted: true,
            turnCloses: true,
            text: "First.\n\nSecond.",
            files: [],
            uploads: [],
            placed: [],
            placing: [],
            modelId: "sample-model",
          } as never
        }
      />,
    );
    expect(
      document.querySelectorAll("[data-slot=message-section]").length,
    ).toBe(2);
    expect(
      document.querySelector("[data-slot=message-status]")?.textContent,
    ).toBe("Interrupted");
    expect(document.querySelector("[data-slot=message-footer]")).toBeNull();
  });
});
