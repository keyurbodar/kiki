import { cleanup, render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  Composer,
  type ComposerHandle,
  type ComposerPayload,
} from "@/components/composer";
import { replyDraft } from "./reply-parse";

afterEach(cleanup);

const target = {
  eventId: "01JAAAAAAAAAAAAAAAAAAAAAAA",
  rowId: "row_1",
  section: 2,
  text: "The **fix** is in.",
};

const mount = async (sent: ComposerPayload[]) => {
  const ref = createRef<ComposerHandle>();
  const { container } = render(
    <Composer
      ref={ref}
      onSubmit={(payload) => {
        sent.push(payload);
        return true;
      }}
    />,
  );
  await waitFor(() =>
    expect(container.querySelector("[contenteditable]")).not.toBeNull(),
  );
  const composer = ref.current;
  if (composer === null) throw new Error("no composer handle");
  return { composer, container };
};

describe("replying from the transcript", () => {
  it("quotes the message into the draft and sends the excerpt with it", async () => {
    const sent: ComposerPayload[] = [];
    const { composer, container } = await mount(sent);
    const { draft, excerpt } = replyDraft(composer.getPayload(), target);
    composer.reset(draft);

    await waitFor(() =>
      expect(container.querySelector('[data-chip="excerpt"]')).not.toBeNull(),
    );

    composer.submit();
    await waitFor(() => expect(sent).toHaveLength(1));
    const payload = sent[0] as ComposerPayload;
    expect(payload.text.startsWith(excerpt.text)).toBe(true);
    expect(payload.mentions[0]).toMatchObject({
      kind: "excerpt",
      id: "reply:row_1:2",
      start: 0,
    });
    expect(excerpt.text).toContain(
      'source="Reply to message 01JAAAAAAAAAAAAAAAAAAAAAAA, section 3"',
    );
  });

  it("keeps what is typed after the excerpt", async () => {
    const sent: ComposerPayload[] = [];
    const { composer } = await mount(sent);
    const { draft } = replyDraft(composer.getPayload(), target);
    composer.reset(draft);
    await waitFor(() =>
      expect(composer.getPayload().text).toContain("<excerpt"),
    );

    composer.typeCharacter("Why?");
    composer.submit();
    await waitFor(() => expect(sent).toHaveLength(1));
    const payload = sent[0] as ComposerPayload;
    expect(payload.text.indexOf("Why?")).toBeGreaterThan(
      payload.text.indexOf("</excerpt>"),
    );
  });
});
