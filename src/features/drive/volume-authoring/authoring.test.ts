import { describe, expect, it } from "vitest";
import {
  newFilePath,
  parseSkillDocument,
  pathCollisions,
  skillNameOf,
  skillSlug,
  skillTemplate,
} from "./authoring";

describe("skills", () => {
  it("slugs typed names", () => {
    expect(skillSlug("Release Check!!")).toBe("release-check-");
    expect(skillSlug("--Deploy  notes")).toBe("deploy-notes");
    expect(skillSlug("a".repeat(80))).toHaveLength(64);
  });

  it("templates and parses a SKILL.md", () => {
    const text = skillTemplate("release-check", "Run before a release");
    expect(parseSkillDocument(text)).toEqual({
      description: "Run before a release",
      body: "# release-check\n\nWhen to use this skill and the steps Capy follows.\n",
    });
    expect(parseSkillDocument("# no frontmatter")).toBeUndefined();
  });

  it("joins folded description lines", () => {
    const parsed = parseSkillDocument(
      "---\nname: a\ndescription: >\n  first\n  second\n---\nbody",
    );
    expect(parsed?.description).toBe("first second");
  });

  it("finds the skill name of a SKILL.md path", () => {
    expect(skillNameOf("skills/triage/SKILL.md")).toBe("triage");
    expect(skillNameOf("skills/triage/notes.md")).toBeUndefined();
  });
});

describe("newFilePath", () => {
  const existing = ["notes/plan.md", "AGENTS.md"];

  it("joins the open folder and validates segments", () => {
    expect(newFilePath("notes", existing, " todo.md ")).toEqual({
      path: "notes/todo.md",
      collides: false,
      valid: true,
    });
    expect(newFilePath("", existing, "a/../b").valid).toBe(false);
    expect(newFilePath("", existing, "").valid).toBe(false);
  });

  it("flags file and folder collisions", () => {
    expect(newFilePath("", existing, "notes").collides).toBe(true);
    expect(newFilePath("", existing, "AGENTS.md/x").collides).toBe(true);
    expect(pathCollisions(existing, "other.md")).toEqual([]);
  });
});
