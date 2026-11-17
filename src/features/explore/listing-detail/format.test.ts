import { describe, expect, it } from "vitest";
import { findSampleListing } from "@/data/mocks/explorePublic/fixtures";
import {
  compactNumber,
  fileMarkdown,
  installDescription,
  installFailure,
  lineCount,
  madeBy,
  parseKindParam,
  permissions,
  repositoryLink,
  shortVersion,
  trimPeriod,
} from "./format";

const plugin = findSampleListing("plugin", "edge-platform");
const skill = findSampleListing("skill", "debugging-playbook");
if (plugin === undefined || skill === undefined)
  throw new Error("missing fixtures");

describe("listing detail format", () => {
  it("parses the kind path segment", () => {
    expect(parseKindParam("plugins")).toBe("plugin");
    expect(parseKindParam("skills")).toBe("skill");
    expect(parseKindParam("plugin")).toBeUndefined();
  });

  it("formats numbers, versions and descriptions like Capy", () => {
    expect(compactNumber(326_100)).toBe("326.1k");
    expect(compactNumber(12_480)).toBe("12.5k");
    expect(shortVersion("9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b")).toBe(
      "9a8b7c6",
    );
    expect(shortVersion("1.0.1")).toBe("1.0.1");
    expect(trimPeriod("Fixes bugs.")).toBe("Fixes bugs");
    expect(lineCount("a\nb\nc")).toBe("3 lines");
    expect(lineCount("a")).toBe("1 line");
  });

  it("lists plugin permissions from its servers and skills", () => {
    expect(permissions(plugin)).toEqual([
      "Signed in to Edge Platform once for the organization",
      "1 remote MCP server, run by Edge Platform",
      "Carries 16 skills",
    ]);
  });

  it("lists skill permissions from its files", () => {
    expect(permissions(skill)).toEqual([
      "Instructions the agent follows with the thread owner's rights",
      "Carries scripts that run on the machine",
    ]);
  });

  it("links the repository at the listed commit", () => {
    expect(repositoryLink(skill)).toEqual({
      repository: "acme/skills",
      href: "https://github.com/acme/skills/tree/9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b/skills/debugging-playbook",
    });
    expect(repositoryLink(plugin)?.href).toBe(
      "https://github.com/northwind/skills/tree/4f1c2a9b7e3d5c8a0b6f2e1d9c7a5b3e1f0d2c4a/",
    );
  });

  it("names who made the listing", () => {
    expect(madeBy(plugin.card)).toBe("Listed by Capy");
    expect(madeBy(skill.card)).toBe("Alex Morgan, listed by Capy");
  });

  it("describes the install and its failures", () => {
    expect(installDescription(skill)).toBe(
      "Adds the skill to the project's shared files",
    );
    expect(installDescription(plugin)).toBe(
      "Signs in to Edge Platform after Install",
    );
    expect(installFailure("Network down", undefined)).toBe(
      "Network down, nothing was installed",
    );
    expect(installFailure("Bad", "API key")).toBe(
      "Nothing was installed, fix the API key and try again",
    );
    expect(installFailure("Bad", "Region")).toBe(
      "Nothing was installed, fix the region and try again",
    );
  });

  it("strips SKILL.md front matter and fences other files", () => {
    expect(fileMarkdown("SKILL.md", "---\nname: x\n---\n# Title")).toBe(
      "# Title",
    );
    expect(fileMarkdown("run.sh", "echo hi\n")).toBe("````sh\necho hi\n````");
  });
});
