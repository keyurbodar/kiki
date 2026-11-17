import { describe, expect, it } from "vitest";
import type { Actor, Origin } from "@/data/events";
import { SAMPLE } from "@/data/events/fixtures";
import {
  type ChatMinimapItem,
  chatColumnWidth,
  chatGutter,
  isMinimapPersistent,
  isRowInView,
  minimapAnswer,
  minimapHitStrip,
  minimapItemText,
  minimapLabel,
  sameMinimapItems,
} from "./chat-minimap";

const actor = { type: "user", userId: SAMPLE.userId } as Actor;
const origin = { type: "web", userId: SAMPLE.userId } as Origin;
const item = (overrides: Partial<ChatMinimapItem> = {}): ChatMinimapItem => ({
  id: "msg_1",
  jumpKey: "row_1",
  rowIndex: 0,
  text: "hello world",
  answer: null,
  viewer: true,
  actor,
  origin,
  ...overrides,
});

describe("chat minimap geometry", () => {
  it("resolves the chat column from the root font size", () => {
    expect(chatColumnWidth(16)).toBe(896);
    expect(chatColumnWidth(20)).toBe(1120);
    expect(chatGutter(1200, chatColumnWidth(20))).toBe(40);
  });

  it("measures the gutter beside the chat column", () => {
    expect(chatGutter(1000, 896)).toBe(52);
    expect(chatGutter(500, 896)).toBe(0);
    expect(chatGutter(Number.NaN, 896)).toBe(0);
    expect(chatGutter(1000, Number.NaN)).toBe(0);
  });

  it("keeps the rail visible only in a wide gutter", () => {
    expect(isMinimapPersistent(1000, 896)).toBe(true);
    expect(isMinimapPersistent(980, 896)).toBe(false);
    expect(isMinimapPersistent(1000, chatColumnWidth(20))).toBe(false);
  });

  it("sizes the hit strip from the gutter", () => {
    expect(minimapHitStrip(1000, 896)).toBe(40);
    expect(minimapHitStrip(930, 896)).toBe(5);
    expect(minimapHitStrip(500, 896)).toBe(0);
    expect(minimapHitStrip(1000, chatColumnWidth(20))).toBe(0);
  });
});

describe("chat minimap text", () => {
  it("drops blank answers and trims long ones", () => {
    expect(minimapAnswer(null)).toBeNull();
    expect(minimapAnswer("   ")).toBeNull();
    expect(minimapAnswer(" short ")).toBe(" short ");
    expect(minimapAnswer("x".repeat(801))).toBe(`${"x".repeat(800)}…`);
  });

  it("falls back for blank messages", () => {
    expect(minimapItemText(item())).toBe("hello world");
    expect(minimapItemText(item({ text: " \n " }))).toBe("User message");
    expect(minimapLabel(null)).toBe("Jump to message: User message");
    expect(minimapLabel(item())).toBe("Jump to message: hello world");
    expect(minimapLabel(item({ text: "hello   \n world " }))).toBe(
      "Jump to message: hello world",
    );
  });
});

describe("chat minimap items", () => {
  it("compares items by content, not identity", () => {
    expect(sameMinimapItems([item()], [item()])).toBe(true);
    expect(sameMinimapItems([item()], [item({ id: "msg_2" })])).toBe(false);
    expect(sameMinimapItems([item()], [item(), item()])).toBe(false);
  });

  it("reports rows overlapping the viewport", () => {
    const list = {
      scroll: 100,
      scrollLength: 200,
      positionAtIndex: (index: number) => (index === 0 ? 20 : undefined),
      sizeAtIndex: (index: number) => (index === 0 ? 60 : undefined),
    };
    expect(isRowInView(list, 0)).toBe(false);
    expect(isRowInView(list, 1)).toBe(false);
    expect(isRowInView({ ...list, scroll: 20 }, 0)).toBe(true);
  });
});
