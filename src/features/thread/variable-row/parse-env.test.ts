import { describe, expect, it } from "vitest";
import { isQuoted, isVariableName, parseEnv } from "./parse-env";

describe("parseEnv", () => {
  it("reads plain, exported and commented lines", () => {
    expect(parseEnv("# note\nexport A=1\nB = two \n\nnot a line")).toEqual({
      entries: [
        { name: "A", value: "1" },
        { name: "B", value: "two" },
      ],
      complete: false,
    });
  });

  it("unescapes double quotes and keeps single quotes literal", () => {
    expect(parseEnv("A=\"x\\ny\"\nB='x\\ny'")?.entries).toEqual([
      { name: "A", value: "x\ny" },
      { name: "B", value: "x\\ny" },
    ]);
  });

  it("joins a multi-line quoted value", () => {
    expect(parseEnv('KEY="line1\nline2"\nNEXT=1')?.entries).toEqual([
      { name: "KEY", value: "line1\nline2" },
      { name: "NEXT", value: "1" },
    ]);
  });

  it("returns null when nothing parses", () => {
    expect(parseEnv("hello world")).toBeNull();
  });
});

it("validates names and spots quoted values", () => {
  expect(isVariableName("SAMPLE_KEY")).toBe(true);
  expect(isVariableName("1KEY")).toBe(false);
  expect(isQuoted('"abc"')).toBe(true);
  expect(isQuoted("abc")).toBe(false);
});
