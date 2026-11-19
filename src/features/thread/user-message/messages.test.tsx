import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentMessage } from "@/features/thread/agent-message";
import {
  type EditTarget,
  MessageActionsProvider,
} from "@/features/thread/message-footer";
import { buildReply } from "@/features/thread/reply-quote";
import { UserMessage, type UserMessageRow } from "./user-message";

let phoneSurface = false;

vi.mock("@/features/mobile/use-mobile", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/mobile/use-mobile")>()),
  useIsPhoneSurface: () => phoneSurface,
}));

vi.mock("@/features/thread/version-switcher", () => ({
  VersionSwitcher: () => <span data-slot="version-switcher" />,
}));

afterEach(() => {
  cleanup();
  phoneSurface = false;
});

beforeEach(() => {
  phoneSurface = false;
});

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

const versionedRow = {
  ...userRow,
  versionRoot: "01JAAAAAAAAAAAAAAAAAAAAAAA",
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

  it("keeps Reply, Copy and Edit on the desktop surface", () => {
    render(
      <MessageActionsProvider
        value={{ viewerUserId: "user_sample", editMessage: () => {} }}
      >
        <UserMessage row={userRow} />
      </MessageActionsProvider>,
    );
    expect(screen.getByLabelText("Edit message")).toBeTruthy();
    expect(screen.getByLabelText("Reply")).toBeTruthy();
    expect(screen.getByLabelText("Copy message")).toBeTruthy();
  });

  it("suppresses the action footer on the phone surface", () => {
    phoneSurface = true;
    render(
      <MessageActionsProvider
        value={{ viewerUserId: "user_sample", editMessage: () => {} }}
      >
        <UserMessage row={userRow} />
      </MessageActionsProvider>,
    );
    expect(screen.queryByLabelText("Edit message")).toBeNull();
    expect(screen.queryByLabelText("Reply")).toBeNull();
    expect(screen.queryByLabelText("Copy message")).toBeNull();
    expect(screen.getByText("Can you check the build?")).toBeTruthy();
  });

  it("keeps only the version switcher in the phone footer", () => {
    phoneSurface = true;
    render(
      <MessageActionsProvider
        value={{ viewerUserId: "user_sample", editMessage: () => {} }}
      >
        <UserMessage row={versionedRow} />
      </MessageActionsProvider>,
    );
    const footer = document.querySelector("[data-slot=message-footer]");
    expect(footer?.children).toHaveLength(1);
    expect(footer?.firstElementChild?.getAttribute("data-slot")).toBe(
      "version-switcher",
    );
    expect(screen.queryByLabelText("Reply")).toBeNull();
    expect(screen.queryByLabelText("Copy message")).toBeNull();
    expect(screen.queryByLabelText("Edit message")).toBeNull();
  });

  it("puts the version switcher first in the desktop footer", () => {
    render(
      <MessageActionsProvider
        value={{ viewerUserId: "user_sample", editMessage: () => {} }}
      >
        <UserMessage row={versionedRow} />
      </MessageActionsProvider>,
    );
    const footer = document.querySelector("[data-slot=message-footer]");
    expect(footer?.firstElementChild?.getAttribute("data-slot")).toBe(
      "version-switcher",
    );
    expect(screen.getByLabelText("Reply")).toBeTruthy();
    expect(screen.getByLabelText("Copy message")).toBeTruthy();
    expect(screen.getByLabelText("Edit message")).toBeTruthy();
  });

  it("offers no switcher on a message someone else wrote", () => {
    render(
      <MessageActionsProvider value={{ viewerUserId: "user_other" }}>
        <UserMessage row={versionedRow} />
      </MessageActionsProvider>,
    );
    expect(document.querySelector("[data-slot=version-switcher]")).toBeNull();
    expect(document.querySelector("[data-slot=message-footer]")).not.toBeNull();
  });

  it("clamps a long message and leaves a short one alone", () => {
    const long = Array.from(
      { length: 12 },
      (_, i) => `Line ${i} of a long message.`,
    ).join("\n");
    const { unmount } = render(
      <UserMessage row={{ ...userRow, text: long } as never} />,
    );
    expect(document.querySelector("[data-slot=clamped-body]")).not.toBeNull();
    unmount();
    render(<UserMessage row={userRow} />);
    expect(document.querySelector("[data-slot=clamped-body]")).toBeNull();
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
  const settledRow = {
    id: "row_agent",
    eventId: "01JBBBBBBBBBBBBBBBBBBBBBBB",
    createdAt: new Date(2026, 10, 17, 9, 1),
    type: "agent-message",
    settled: true,
    interrupted: false,
    turnCloses: true,
    text: "First.\n\nSecond.",
    files: [],
    uploads: [],
    placed: [],
    placing: [],
    modelId: "sample-model",
  };

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

  it("puts one Copy and More row under the message on a phone", () => {
    phoneSurface = true;
    render(<AgentMessage row={{ ...settledRow, showFooter: true } as never} />);
    const footers = document.querySelectorAll("[data-slot=message-footer]");
    expect(footers.length).toBe(1);
    expect(screen.getByLabelText("Copy message")).toBeTruthy();
    expect(screen.getByLabelText("More")).toBeTruthy();
    expect(screen.queryByLabelText("Reply")).toBeNull();
  });

  it("shows no phone footer unless the timeline marks the message", () => {
    phoneSurface = true;
    render(<AgentMessage row={settledRow as never} />);
    expect(document.querySelector("[data-slot=message-footer]")).toBeNull();
  });

  it("keeps the hover rail without a phone footer at a fine pointer", () => {
    render(<AgentMessage row={{ ...settledRow, showFooter: true } as never} />);
    expect(document.querySelectorAll("[data-slot=message-footer]").length).toBe(
      2,
    );
    expect(screen.queryAllByLabelText("Copy message")).toHaveLength(2);
  });
});

describe("UserMessage mentions", () => {
  it("paints a skill mention as its token chip", () => {
    render(
      <UserMessage
        row={
          {
            ...userRow,
            text: "use kiki-ux-verify first",
            mentions: [
              {
                kind: "skill",
                id: "kiki-ux-verify",
                label: "kiki-ux-verify",
                start: 4,
                end: 18,
                text: "kiki-ux-verify",
              },
            ],
          } as unknown as UserMessageRow
        }
      />,
    );
    const chip = document.querySelector('[data-chip="skill"]');
    expect(chip?.textContent).toBe("kiki-ux-verify");
    expect(document.querySelector("[data-chip=skill] svg")).not.toBeNull();
  });

  it("leaves a mention outside its range as plain text", () => {
    render(
      <UserMessage
        row={
          {
            ...userRow,
            text: "no mentions here",
            mentions: [
              {
                kind: "skill",
                id: "kiki-ux-verify",
                label: "kiki-ux-verify",
                start: 40,
                end: 60,
                text: "kiki-ux-verify",
              },
            ],
          } as unknown as UserMessageRow
        }
      />,
    );
    expect(document.querySelector('[data-chip="skill"]')).toBeNull();
    expect(document.body.textContent).toContain("no mentions here");
  });
});
