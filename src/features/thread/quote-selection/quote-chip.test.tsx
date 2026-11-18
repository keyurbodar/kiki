import { cleanup, render, waitFor } from "@testing-library/react";
import { createRef, type RefObject } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Composer,
  type ComposerHandle,
  type ComposerPayload,
} from "@/components/composer";
import type { Mention } from "@/data/events";
import { excerptMention, parseReply } from "@/features/thread/reply-quote";
import {
  UserMessage,
  type UserMessageRow,
} from "@/features/thread/user-message";
import { AGENT_SOURCE } from "./selection-anchor";

vi.mock("@/features/mobile", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/mobile")>()),
  useIsPhoneSurface: () => false,
}));

afterEach(cleanup);

const mentionOf = (text: string, comment = "") =>
  excerptMention(
    { rowId: "row_1", section: 2, text, source: AGENT_SOURCE },
    comment,
  );

const mount = async (onSubmit?: (payload: ComposerPayload) => boolean) => {
  const ref = createRef<ComposerHandle>();
  const { container } = render(
    <Composer ref={ref} onSubmit={onSubmit ?? (() => true)} />,
  );
  await waitFor(() =>
    expect(container.querySelector("[contenteditable]")).not.toBeNull(),
  );
  return ref;
};

const insert = async (
  ref: RefObject<ComposerHandle | null>,
  mention: ReturnType<typeof mentionOf>,
) => {
  ref.current?.insertMention(mention, "");
  await waitFor(() =>
    expect(ref.current?.getPayload().text).toContain("<excerpt"),
  );
  return ref.current?.getPayload() as ComposerPayload;
};

describe("quote chip", () => {
  it("carries the excerpt wire text and survives into the payload", async () => {
    const ref = await mount();
    const mention = mentionOf("Alpha beta");
    const payload = await insert(ref, mention);
    expect(mention.id).toBe("reply:row_1:2");
    expect(mention.label).toBe("Alpha beta");
    expect(payload.text.startsWith(mention.text)).toBe(true);
    const first = payload.mentions[0];
    expect(first).toMatchObject({
      kind: "excerpt",
      id: "reply:row_1:2",
      label: "Alpha beta",
      start: 0,
    });
    expect(payload.text.slice(first?.start, first?.end)).toBe(mention.text);
  });

  it("sends the excerpt with the message", async () => {
    const sent: ComposerPayload[] = [];
    const ref = await mount((payload) => {
      sent.push(payload);
      return true;
    });
    await insert(ref, mentionOf("Alpha beta"));
    ref.current?.submit();
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]?.text).toBe(
      `<excerpt source="Capy's response">\nAlpha beta\n</excerpt> `,
    );
    expect(sent[0]?.mentions[0]?.kind).toBe("excerpt");
  });

  it("parses back into the reply quote the thread renders", async () => {
    const ref = await mount();
    const payload = await insert(ref, mentionOf("Alpha beta"));
    const reply = parseReply(
      payload.text,
      payload.mentions as unknown as Mention[],
    );
    expect(reply?.rowId).toBe("row_1");
    expect(reply?.section).toBe(2);
    expect(reply?.quote).toBe("Alpha beta");
    expect(reply?.text.trim()).toBe("");
  });

  it("keeps a comment in the excerpt and out of the quote line", async () => {
    const ref = await mount();
    const mention = mentionOf("Alpha beta", "Why this order?");
    const payload = await insert(ref, mention);
    const reply = parseReply(
      payload.text,
      payload.mentions as unknown as Mention[],
    );
    expect(payload.text).toContain(
      '<comment on="excerpt">\nWhy this order?\n</comment>',
    );
    expect(reply?.quote).toBe("Alpha beta");
  });

  it("renders the sent message as a reply quote over the typed text", async () => {
    const ref = await mount();
    const payload = await insert(ref, mentionOf("Alpha beta"));
    render(
      <UserMessage
        row={
          {
            id: "row_sent",
            eventId: "01JAAAAAAAAAAAAAAAAAAAAAAA",
            createdAt: new Date(2026, 10, 17, 9, 0),
            type: "user-message",
            text: `${payload.text}Is the retry bounded?`,
            mentions: payload.mentions,
            files: [],
            delivery: "queue",
            actor: { type: "user", userId: "user_sample" },
            origin: { type: "web" },
            showOrigin: false,
            state: "answered",
          } as unknown as UserMessageRow
        }
      />,
    );
    const quote = document.querySelector("[data-slot=reply-quote]");
    expect(quote?.textContent).toContain("Alpha beta");
    expect(document.body.textContent).toContain("Is the retry bounded?");
  });
});
