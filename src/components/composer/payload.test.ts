import { describe, expect, it } from "vitest";
import {
  escapeOutsideCode,
  isPayloadEmpty,
  payloadSignature,
  unescapeMarkdown,
} from "./payload";

describe("escapeOutsideCode", () => {
  it("escapes backslashes outside inline code only", () => {
    expect(escapeOutsideCode("a\\b `c\\d` e")).toBe("a\\\\b `c\\d` e");
  });
});

describe("unescapeMarkdown", () => {
  it("drops escapes outside code spans and keeps code intact", () => {
    expect(unescapeMarkdown("\\*bold\\* `\\*`")).toBe("*bold* `\\*`");
  });
});

describe("isPayloadEmpty", () => {
  it("treats whitespace-only and missing payloads as empty", () => {
    expect(isPayloadEmpty(null)).toBe(true);
    expect(isPayloadEmpty({ text: "  \n", mentions: [], files: [] })).toBe(
      true,
    );
    expect(isPayloadEmpty({ text: "hi", mentions: [], files: [] })).toBe(false);
  });
});

describe("payloadSignature", () => {
  it("is empty for no payload and ignores caret and files", () => {
    expect(payloadSignature(undefined)).toBe("");
    const a = payloadSignature({
      text: "hi",
      mentions: [],
      files: [],
      caret: 1,
    });
    const b = payloadSignature({
      text: "hi",
      mentions: [],
      files: [],
      caret: 2,
    });
    expect(a).toBe(b);
    expect(payloadSignature({ text: "ho", mentions: [], files: [] })).not.toBe(
      a,
    );
  });
});
