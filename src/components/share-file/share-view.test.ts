import { describe, expect, it } from "vitest";
import {
  decodeShareView,
  documentTitleOf,
  formatBytes,
  markdownTitle,
  shareByline,
} from "./share-view";

describe("share view", () => {
  it("decodes file views and rejects others", () => {
    expect(decodeShareView({ type: "folder" })).toBeUndefined();
    const view = decodeShareView({
      type: "file",
      id: "shr_1",
      path: "specs/a.md",
      orgName: "Acme",
      authorName: null,
      versionCreatedAt: "2026-01-10T12:00:00Z",
      file: { type: "text", content: "# Hello" },
      member: { orgId: "org_1", manageable: true },
    });
    expect(view?.member).toMatchObject({ orgId: "org_1", manageable: true });
    expect(view && shareByline(view)).toMatch(
      /^Shared by Acme from Acme, updated /,
    );
  });

  it("finds a markdown title outside front matter and fences", () => {
    expect(markdownTitle("---\ntitle: x\n---\n# Real *title*\n")).toBe(
      "Real title",
    );
    expect(markdownTitle("```\n# not this\n```\n## [Link](x) ##")).toBe("Link");
    expect(markdownTitle("no heading")).toBeUndefined();
  });

  it("titles html and ignores other files", () => {
    expect(
      documentTitleOf("a.html", "<title> Hi  there </title><h1>x</h1>"),
    ).toBe("Hi there");
    expect(documentTitleOf("a.html", "<h1>Head</h1>")).toBe("Head");
    expect(documentTitleOf("a.txt", "# x")).toBeUndefined();
    expect(documentTitleOf("a.md", undefined)).toBeUndefined();
  });

  it("formats sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(4812)).toBe("4.7 KB");
    expect(formatBytes(182340)).toBe("178 KB");
  });
});
