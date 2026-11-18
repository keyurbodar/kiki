import { describe, expect, it } from "vitest";
import {
  buildReply,
  parseReply,
  quotePlainText,
  replyDraft,
} from "./reply-parse";

describe("quotePlainText", () => {
  it("flattens markdown to one plain line", () => {
    expect(
      quotePlainText(
        "## Title\n\n- **bold** and `code`\n- [link](https://example.com)",
      ),
    ).toBe("Title bold and code link");
  });

  it("keeps fenced code and table cells", () => {
    expect(
      quotePlainText("```\nraw *x*\n```\n| a | b |\n|---|---|\n| 1 | 2 |"),
    ).toBe("raw *x* a b 1 2");
  });
});

describe("reply round trip", () => {
  it("parses what buildReply produces", () => {
    const sent = buildReply(
      {
        text: "Sounds good",
        mentions: [
          {
            kind: "file" as const,
            id: "f",
            label: "a.txt",
            start: 0,
            end: 6,
            text: "Sounds",
          },
        ],
      },
      {
        eventId: "evt_1",
        rowId: "row_1",
        section: 2,
        text: "The **fix** is in.",
      },
    );
    const parsed = parseReply(sent.text, sent.mentions);
    expect(parsed).toEqual({
      rowId: "row_1",
      section: 2,
      quote: "The fix is in.",
      text: "Sounds good",
      mentions: [
        {
          kind: "file",
          id: "f",
          label: "a.txt",
          start: 0,
          end: 6,
          text: "Sounds",
        },
      ],
    });
  });

  it("ignores messages without a leading reply excerpt", () => {
    expect(parseReply("hello", [])).toBeUndefined();
  });
});

describe("replyDraft", () => {
  const target = {
    eventId: "evt_1",
    rowId: "row_1",
    section: 2,
    text: "The **fix** is in.",
  };

  it("puts the excerpt in front of the draft the composer already holds", () => {
    const { draft, excerpt } = replyDraft(
      {
        text: "Why?",
        mentions: [
          {
            kind: "user",
            id: "user_1",
            label: "Alex",
            start: 0,
            end: 4,
            text: "@Alex",
          },
        ],
        files: [],
      },
      target,
    );
    expect(excerpt.id).toBe("reply:row_1:2");
    expect(excerpt.end).toBe(excerpt.text.length);
    expect(draft.text.startsWith(excerpt.text)).toBe(true);
    expect(draft.text.slice(excerpt.end).replace(/^\n+/, "")).toBe("Why?");
    expect(draft.mentions[0]).toBe(excerpt);
    expect(draft.mentions[1]).toMatchObject({
      id: "user_1",
      start: excerpt.end + 2,
      end: excerpt.end + 6,
    });
  });

  it("leads with the source line Capy replies carry", () => {
    const { excerpt } = replyDraft(
      { text: "", mentions: [], files: [] },
      target,
    );
    expect(excerpt.text).toContain(
      'source="Reply to message evt_1, section 3"',
    );
    expect(parseReply(excerpt.text, [excerpt])?.quote).toBe("The fix is in.");
  });
});
