import { describe, expect, it } from "vitest";
import type {
  DriveEntry,
  DriveScopeFiles,
  Volume,
} from "@/data/atoms/agent-context";
import type { AgentScope } from "../agent-scopes";
import { canSubmitSkill } from "./skill-sheet";
import { filterSkills, listSkills, skillsCountLabel } from "./skills";

const volume: Volume = {
  id: "vol_1",
  namespace: "artifacts",
  name: "artifacts",
  projectId: null,
  userId: null,
  captainJamId: null,
  archived: false,
  headVersionId: "vver_1",
  headDigest: "d",
  fileCount: 0,
  totalBytes: 0,
};

const entry = (path: string): DriveEntry => ({
  path,
  sourcePath: path,
  volume,
  versionId: "vver_1",
  mode: 420,
  sizeBytes: 10,
  sha256: path,
});

const scope = (key: string, captain?: string): AgentScope => ({
  key,
  icon: null,
  name: key,
  kind: key,
  title: key,
  audience: key,
  scope: {},
  part: "org",
  filtersKey: key,
  ...(captain === undefined ? {} : { captain }),
});

const files = (...paths: string[]): DriveScopeFiles => ({
  volumes: [volume],
  entries: paths.map(entry),
});

describe("listSkills", () => {
  const org = scope("org");
  const project = scope("project");
  const captain = scope("captain:1", "Release captain");

  it("lists SKILL.md files per scope, sorted by name", () => {
    const skills = listSkills(
      [org, project],
      [
        files("skills/zeta/SKILL.md", "AGENTS.md", "skills/alpha/SKILL.md"),
        files("skills/beta/SKILL.md", "skills/beta/notes.md"),
      ],
    );
    expect(skills.map((skill) => `${skill.scope.key}/${skill.name}`)).toEqual([
      "org/alpha",
      "org/zeta",
      "project/beta",
    ]);
  });

  it("marks a skill replaced by the same name in a later scope, never by a captain", () => {
    const skills = listSkills(
      [org, project, captain],
      [
        files("skills/ship/SKILL.md"),
        files("skills/ship/SKILL.md"),
        files("skills/ship/SKILL.md"),
      ],
    );
    expect(skills.map((skill) => skill.hiddenBy?.key)).toEqual([
      "project",
      undefined,
      undefined,
    ]);
  });

  it("skips scopes whose files did not load", () => {
    expect(listSkills([org, project], [undefined, files()])).toEqual([]);
  });
});

describe("skill list copy", () => {
  it("counts skills the way Capy does", () => {
    expect(skillsCountLabel(0)).toBe("No skills");
    expect(skillsCountLabel(1)).toBe("1 skill");
    expect(skillsCountLabel(6)).toBe("6 skills");
  });

  it("filters by name", () => {
    const skills = listSkills(
      [scope("org")],
      [files("skills/release-check/SKILL.md", "skills/ui/SKILL.md")],
    );
    expect(
      filterSkills(skills, " Release ").map((skill) => skill.name),
    ).toEqual(["release-check"]);
    expect(filterSkills(skills, "deploy")).toEqual([]);
    expect(filterSkills(skills, "release").map((skill) => skill.name)).toEqual([
      "release-check",
    ]);
    expect(filterSkills(skills, "")).toHaveLength(2);
  });
});

describe("canSubmitSkill", () => {
  const base = {
    isNew: true,
    name: "ship-it",
    description: "When shipping",
    taken: false,
    composed: "a",
    original: "",
  };

  it("needs a valid free name and a description for a new skill", () => {
    expect(canSubmitSkill(base)).toBe(true);
    expect(canSubmitSkill({ ...base, name: "-bad" })).toBe(false);
    expect(canSubmitSkill({ ...base, taken: true })).toBe(false);
    expect(canSubmitSkill({ ...base, description: "  " })).toBe(false);
  });

  it("needs a change for an existing skill", () => {
    expect(
      canSubmitSkill({ ...base, isNew: false, composed: "x", original: "x" }),
    ).toBe(false);
    expect(
      canSubmitSkill({ ...base, isNew: false, composed: "y", original: "x" }),
    ).toBe(true);
  });
});
