import { describe, expect, it } from "vitest";
import { buildReply, parseReply, quotePlainText } from "./reply-parse";

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
