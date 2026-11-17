import { describe, expect, it } from "vitest";
import {
  commandTriggerKey,
  commandTriggerLength,
  findCommandTrigger,
  findMentionTrigger,
  mentionTriggerKey,
} from "./triggers";

const categories = ["files", "skills", "channels"];

describe("findMentionTrigger", () => {
  it("opens on a bare @ at the start or after whitespace", () => {
    expect(findMentionTrigger("@", categories)).toEqual({
      start: 0,
      category: null,
      term: "",
      length: 1,
      shorthand: false,
    });
    expect(findMentionTrigger("ask @rev", categories)?.start).toBe(4);
  });

  it("ignores @ inside a word", () => {
    expect(findMentionTrigger("name@example", categories)).toBeNull();
  });

  it("reads a category prefix", () => {
    expect(findMentionTrigger("@files:src", categories)).toEqual({
      start: 0,
      category: "files",
      term: "src",
      length: 10,
      shorthand: false,
    });
  });

  it("rejects an unknown category", () => {
    expect(findMentionTrigger("@nope:x", categories)).toBeNull();
  });

  it("allows up to two spaces in the term", () => {
    expect(findMentionTrigger("@a b c", categories)?.term).toBe("a b c");
    expect(findMentionTrigger("@a b c d", categories)).toBeNull();
  });

  it("supports $ and # shorthands for enabled categories", () => {
    expect(findMentionTrigger("run $dep", categories)).toEqual({
      start: 4,
      category: "skills",
      term: "dep",
      length: 4,
      shorthand: true,
    });
    expect(findMentionTrigger("#gen", categories)?.category).toBe("channels");
    expect(findMentionTrigger("#gen", ["files"])).toBeNull();
  });

  it("keys a trigger by start and category", () => {
    const trigger = findMentionTrigger("x @files:a", categories);
    expect(trigger && mentionTriggerKey(trigger)).toBe("2:files");
  });
});

describe("findCommandTrigger", () => {
  const commands = ["model"];

  it("opens on / at a word start", () => {
    expect(findCommandTrigger("/rev", commands)).toEqual({
      start: 0,
      command: null,
      term: "rev",
    });
    expect(findCommandTrigger("src/rev", commands)).toBeNull();
  });

  it("reads a known command prefix and rejects unknown ones", () => {
    const trigger = findCommandTrigger("go /model:op", commands);
    expect(trigger).toEqual({ start: 3, command: "model", term: "op" });
    expect(trigger && commandTriggerLength(trigger)).toBe(9);
    expect(trigger && commandTriggerKey(trigger)).toBe("3:model");
    expect(findCommandTrigger("/other:x", commands)).toBeNull();
  });

  it("closes once the term has a space", () => {
    expect(findCommandTrigger("/rev now", commands)).toBeNull();
  });
});
