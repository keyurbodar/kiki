import { describe, expect, it } from "vitest";
import {
  blockLines,
  countDisplayMath,
  isFenceOpen,
  keyBlocks,
  splitBlocks,
  stabilizeStreamingTables,
} from "./blocks";

describe("splitBlocks", () => {
  it("splits complete markdown into full and code blocks", () => {
    const blocks = splitBlocks(
      "# Title\n\nSome *text*.\n\n```ts\nconst a = 1;\n```\n",
      false,
    );
    expect(blocks.map((b) => b.mode)).toEqual(["full", "full", "code"]);
    expect(blocks[2]).toMatchObject({
      mode: "code",
      language: "ts",
      src: "const a = 1;",
      complete: true,
    });
  });

  it("keeps an unclosed fence live while streaming", () => {
    const blocks = splitBlocks("Intro\n\n```python\nprint(1)\nprint(", true);
    expect(blocks.at(-1)).toMatchObject({
      mode: "code",
      language: "python",
      complete: false,
      src: "print(1)\nprint(",
    });
  });

  it("repairs the live tail of a streaming message", () => {
    const bold = splitBlocks("Done.\n\nThis is **bold", true).at(-1);
    expect(bold?.mode).toBe("live");
    expect(bold?.src).toBe("This is **bold**");
    expect(splitBlocks("Run `npm", true).at(-1)?.src).toBe("Run `npm`");
  });

  it("drops an incomplete link's URL while streaming", () => {
    const [block] = splitBlocks("See [the docs](https://exa", true);
    expect(block?.src).toBe("See the docs");
  });

  it("closes open details while streaming", () => {
    const [block] = splitBlocks(
      "<details>\n<summary>More</summary>\n\nBody",
      true,
    );
    expect(block?.src.endsWith("\n</details>")).toBe(true);
  });

  it("keeps an unclosed $$ block together and flags it", () => {
    const blocks = splitBlocks("Text\n\n$$\nx^2\n\ny", true);
    const last = blocks.at(-1);
    expect(last).toMatchObject({ mode: "live", openMath: true });
  });

  it("treats reference definitions as one block", () => {
    const blocks = splitBlocks("[a][1]\n\n[1]: https://example.com\n", false);
    expect(blocks).toHaveLength(1);
  });
});

describe("helpers", () => {
  it("counts display math outside inline code", () => {
    expect(countDisplayMath("$$a$$ `$$`")).toBe(2);
  });

  it("detects open fences", () => {
    expect(isFenceOpen("```ts\nconst a")).toBe(true);
    expect(isFenceOpen("```ts\nconst a\n```")).toBe(false);
  });

  it("completes a streaming table header", () => {
    expect(stabilizeStreamingTables.handle("| a | b |\n| --")).toBe(
      "| a | b |\n| --- | --- |",
    );
  });

  it("numbers block lines", () => {
    const text = "one\n\ntwo\nthree\n";
    expect(blockLines(text, splitBlocks(text, false))).toEqual(["1-1", "3-4"]);
  });

  it("merges image-only paragraphs into a gallery block", () => {
    const keyed = keyBlocks(
      splitBlocks(
        "![a](https://x.test/a.png)\n\n![b](https://x.test/b.png)",
        false,
      ),
      true,
    );
    expect(keyed).toHaveLength(1);
    expect(keyed[0]?.gallery).toBe(true);
  });
});
