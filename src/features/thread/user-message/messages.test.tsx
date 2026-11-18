import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AgentMessage } from "@/features/thread/agent-message";
import {
  type EditTarget,
  MessageActionsProvider,
} from "@/features/thread/message-footer";
import { buildReply } from "@/features/thread/reply-quote";
import { UserMessage, type UserMessageRow } from "./user-message";

afterEach(cleanup);

const shotFile = {
  fileId: "file_shot",
  name: "shot.png",
  mediaType: "image/png",
  sizeBytes: 24_576,
  width: 960,
  height: 540,
};

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
  it("renders attachments above the body", () => {
    render(<UserMessage row={{ ...userRow, files: [shotFile] } as never} />);
    const gallery = document.querySelector("[data-slot=attachment-gallery]");
    expect(gallery).not.toBeNull();
    expect(
      document.querySelector('[aria-label="Preview shot.png"]'),
    ).not.toBeNull();
    const bubble = screen.getByText("Can you check the build?");
    expect(gallery?.compareDocumentPosition(bubble) ?? 0).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

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

  it("hands the composer the row, the event and the text to edit", () => {
    const seen: EditTarget[] = [];
    render(
      <MessageActionsProvider
        value={{
          viewerUserId: "user_sample",
          editMessage: (target) => seen.push(target),
        }}
      >
        <UserMessage row={userRow} />
      </MessageActionsProvider>,
    );
    fireEvent.click(screen.getByLabelText("Edit message"));
    expect(seen).toEqual([
      {
        rowId: "row_user",
        eventId: "01JAAAAAAAAAAAAAAAAAAAAAAA",
        text: "Can you check the build?",
      },
    ]);
  });

  it("marks a row a later message replaces", () => {
    const { rerender } = render(
      <MessageActionsProvider
        value={{ viewerUserId: "user_sample", editedRowIds: new Set() }}
      >
        <UserMessage row={userRow} />
      </MessageActionsProvider>,
    );
    expect(screen.queryByText("Edited")).toBeNull();
    rerender(
      <MessageActionsProvider
        value={{
          viewerUserId: "user_sample",
          editedRowIds: new Set(["row_user"]),
        }}
      >
        <UserMessage row={userRow} />
      </MessageActionsProvider>,
    );
    expect(screen.getByText("Edited")).toBeTruthy();
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

  it("clamps a long message on its own, without a toggle prop", () => {
    const long = "Trace the flaky shard timeout. ".repeat(40);
    render(<UserMessage row={{ ...userRow, text: long } as never} />);
    expect(document.querySelector("[data-slot=clamped-body]")).not.toBeNull();
  });

  it("leaves a short message unclamped", () => {
    render(<UserMessage row={userRow} />);
    expect(document.querySelector("[data-slot=clamped-body]")).toBeNull();
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
  it("renders its files as a gallery after the sections", () => {
    render(
      <AgentMessage
        row={
          {
            id: "row_agent",
            eventId: "01JBBBBBBBBBBBBBBBBBBBBBBB",
            createdAt: new Date(2026, 10, 17, 9, 1),
            type: "agent-message",
            settled: true,
            interrupted: false,
            turnCloses: true,
            text: "Two shots attached.",
            files: [{ file: shotFile, title: "Home page" }],
            uploads: [],
            placed: [],
            placing: [],
            modelId: "sample-model",
          } as never
        }
      />,
    );
    const gallery = document.querySelector("[data-slot=attachment-gallery]");
    const section = document.querySelector("[data-slot=message-section]");
    expect(gallery).not.toBeNull();
    expect(
      document.querySelector('[aria-label="Preview Home page"]'),
    ).not.toBeNull();
    expect(section?.compareDocumentPosition(gallery as Node) ?? 0).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

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
