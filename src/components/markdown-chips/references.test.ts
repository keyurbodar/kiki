import type { Element, Root } from "hast";
import { describe, expect, it } from "vitest";
import {
  classifyHref,
  createChipTransform,
  parseCodes,
  parseDriveReference,
  splitText,
} from "./references";

const chips = (parts: ReturnType<typeof splitText>) =>
  (parts ?? [])
    .filter((part): part is Element => part.type === "element")
    .map((part) => [part.properties.dataChip, part.properties.dataChipValue]);

describe("parseCodes", () => {
  it("finds thread codes, subagents and pull refs at word boundaries", () => {
    expect(
      parseCodes("See ACME-12, Subagent 3 and acme/web#42.").map((m) => [
        m.kind,
        m.authored,
      ]),
    ).toEqual([
      ["thread", "ACME-12"],
      ["task", "Subagent 3"],
      ["pull", "acme/web#42"],
    ]);
  });

  it("skips codes glued to other word characters", () => {
    expect(parseCodes("xACME-12 ACME-12x")).toEqual([]);
  });
});

describe("splitText", () => {
  it("turns file paths, drive refs, pulls and codes into chip spans", () => {
    expect(
      chips(
        splitText(
          "Edit src/app/main.tsx:12, read drive:notes/plan.md, see #42 and ACME-12 with Subagent 3.",
        ),
      ),
    ).toEqual([
      ["file", "src/app/main.tsx:12"],
      ["drive", "drive:notes/plan.md"],
      ["pull", "#42"],
      ["thread", "ACME-12"],
      ["task", "Subagent 3"],
    ]);
  });

  it("marks codes with the issue prefix as issues", () => {
    expect(chips(splitText("Tracked in ISS-4", "ISS"))).toEqual([
      ["issue", "ISS-4"],
    ]);
  });

  it("returns undefined for plain prose", () => {
    expect(splitText("Nothing to see here.")).toBeUndefined();
  });
});

describe("classifyHref", () => {
  it("recognises pull requests, commits, drive, Paper and file links", () => {
    expect(classifyHref("https://github.com/acme/web/pull/42")).toMatchObject({
      kind: "pull_request",
      repositoryFullName: "acme/web",
      number: 42,
    });
    expect(
      classifyHref("https://github.com/acme/web/commit/abc1234"),
    ).toMatchObject({
      kind: "commit",
      sha: "abc1234",
    });
    expect(classifyHref("drive://project-acme/notes/plan.md")).toMatchObject({
      kind: "drive",
      location: "project-acme",
      path: "notes/plan.md",
    });
    expect(
      classifyHref("https://app.paper.design/file/abcdefgh12/page1"),
    ).toMatchObject({
      kind: "paper",
      fileId: "abcdefgh12",
      pageId: "page1",
    });
    expect(classifyHref("src/app/main.tsx:12:3")).toMatchObject({
      kind: "file",
      path: "src/app/main.tsx",
      line: 12,
      column: 3,
    });
    expect(classifyHref("/home/dev/app/main.tsx:4")).toMatchObject({
      kind: "file",
      path: "/home/dev/app/main.tsx",
      line: 4,
    });
  });

  it("leaves web links and app routes alone", () => {
    expect(classifyHref("https://example.com/docs")).toBeUndefined();
    expect(classifyHref("/settings")).toBeUndefined();
    expect(classifyHref("mailto:team@example.com")).toBeUndefined();
  });
});

describe("parseDriveReference", () => {
  it("rejects empty and parent-relative paths", () => {
    expect(parseDriveReference("drive:")).toBeUndefined();
    expect(parseDriveReference("drive:../secret")).toBeUndefined();
    expect(parseDriveReference("drive:/notes/a.md")).toEqual({
      location: undefined,
      path: "notes/a.md",
    });
  });
});

const paragraph = (...children: Element["children"]): Element => ({
  type: "element",
  tagName: "p",
  properties: {},
  children,
});

describe("createChipTransform", () => {
  it("marks link chips, inline-code paths and text, leaving code blocks alone", () => {
    const link: Element = {
      type: "element",
      tagName: "a",
      properties: { href: "https://github.com/acme/web/pull/42" },
      children: [{ type: "text", value: "the PR" }],
    };
    const code: Element = {
      type: "element",
      tagName: "code",
      properties: {},
      children: [{ type: "text", value: "src/app/" }],
    };
    const pre: Element = {
      type: "element",
      tagName: "pre",
      properties: {},
      children: [
        {
          type: "element",
          tagName: "code",
          properties: {},
          children: [{ type: "text", value: "src/app/main.tsx" }],
        },
      ],
    };
    const tree: Root = {
      type: "root",
      children: [paragraph(link, { type: "text", value: " and " }, code), pre],
    };
    createChipTransform()(tree);
    const p = tree.children[0] as Element;
    expect((p.children[0] as Element).properties.dataChip).toBe("pull_request");
    expect((p.children[2] as Element).properties).toMatchObject({
      dataChip: "path",
      dataChipValue: "src/app/",
    });
    expect(((tree.children[1] as Element).children[0] as Element).tagName).toBe(
      "code",
    );
  });

  it("lets a bare #N inherit the repository of an earlier ref in the same block", () => {
    const tree: Root = {
      type: "root",
      children: [paragraph({ type: "text", value: "acme/api#7 then #8" })],
    };
    createChipTransform()(tree);
    const spans = (tree.children[0] as Element).children.filter(
      (child): child is Element => child.type === "element",
    );
    expect(
      spans.map((span) => [
        span.properties.dataChipValue,
        span.properties.dataChipLabel,
      ]),
    ).toEqual([
      ["acme/api#7", undefined],
      ["acme/api#8", "#8"],
    ]);
  });
});
