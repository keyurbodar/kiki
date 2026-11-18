import { describe, expect, it } from "vitest";
import { cleanOutput, stripEscapes } from "./clean";

describe("stripEscapes", () => {
  it("removes colour and cursor CSI sequences, keeping the text", () => {
    expect(
      stripEscapes("\u001b[31mred\u001b[0m and \u001b[1;32mgreen\u001b[0m"),
    ).toBe("red and green");
    expect(stripEscapes("before\u001b[2K\u001b[1Gafter")).toBe("beforeafter");
  });

  it("removes an OSC title terminated by BEL and one terminated by ST", () => {
    expect(stripEscapes("\u001b]0;a title\u0007kept")).toBe("kept");
    expect(stripEscapes("\u001b]8;;https://example.com\u001b\\link")).toBe(
      "link",
    );
  });

  it("removes charset selection and a stray escape", () => {
    expect(stripEscapes("\u001b(Bplain")).toBe("plain");
    // An escape plus one byte is a two-byte escape, so the space goes with it.
    expect(stripEscapes("stray \u001b here")).toBe("stray here");
    expect(stripEscapes("end\u001b")).toBe("end");
  });
});

describe("cleanOutput", () => {
  it("keeps only the last write of a line redrawn with carriage returns", () => {
    const progress = "0%\r25%\r50%\r100% done\n";
    expect(cleanOutput(progress).text).toBe("100% done");
  });

  it("expands tabs to eight-column stops", () => {
    expect(cleanOutput("a\tb").text).toBe("a       b");
    expect(cleanOutput("\tx").text).toBe("        x");
  });

  it("drops C0 controls a terminal would not print", () => {
    expect(cleanOutput("a\u0007b\u0000c").text).toBe("abc");
  });

  it("trims leading and trailing blank lines", () => {
    expect(cleanOutput("\n\n  \nhello\n\n").text).toBe("hello");
  });

  it("cuts an absurdly long line on a character boundary", () => {
    const { text } = cleanOutput("é".repeat(2500));
    expect(text.length).toBe(2000);
    expect(text.endsWith("…")).toBe(true);
    expect(text.slice(0, -1)).toBe("é".repeat(1999));
  });

  it("keeps the tail of a long log and reports what it dropped", () => {
    const log = Array.from({ length: 500 }, (_, i) => `line ${i}`).join("\n");
    const { text, trimmed } = cleanOutput(log);
    expect(trimmed).toBe(100);
    expect(text.split("\n")).toHaveLength(400);
    expect(text.startsWith("line 100")).toBe(true);
    expect(text.endsWith("line 499")).toBe(true);
  });

  it("leaves plain output alone", () => {
    const plain = "On branch main\nnothing to commit";
    expect(cleanOutput(plain)).toEqual({ text: plain, trimmed: 0 });
  });
});
