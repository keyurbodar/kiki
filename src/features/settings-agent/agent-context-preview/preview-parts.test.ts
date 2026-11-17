import { describe, expect, it } from "vitest";
import type {
  DriveEntry,
  DriveScopeFiles,
  Volume,
} from "@/data/atoms/agent-context";
import type { AgentScope } from "../agent-scopes";
import { loadedSkills, localPreviewParts, localUsed } from "./preview-parts";

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

const entry = (path: string, sizeBytes: number): DriveEntry => ({
  path,
  sourcePath: path,
  volume,
  versionId: "vver_1",
  mode: 420,
  sizeBytes,
  sha256: path,
});

const scope = (key: string, part: AgentScope["part"]): AgentScope => ({
  key,
  part,
  icon: null,
  name: key,
  kind: key,
  title: key,
  audience: key,
  scope: {},
  filtersKey: key,
});

const files = (...entries: DriveEntry[]): DriveScopeFiles => ({
  volumes: [volume],
  entries,
});

describe("localPreviewParts", () => {
  it("reads each scope's AGENTS.md and the skills it loads", () => {
    const parts = localPreviewParts(
      [scope("Acme", "org"), scope("Web app", "project")],
      [
        files(entry("AGENTS.md", 400), entry("skills/ship/SKILL.md", 120)),
        files(entry("AGENTS.md", 80)),
      ],
    );
    expect(parts.map((part) => [part.kind, part.label, part.loaded])).toEqual([
      ["org", "Acme", 400],
      ["project", "Web app", 80],
      ["skills", "1 skill", 120],
    ]);
    expect(localUsed(parts)).toBe(600);
  });

  it("counts a skill once when a later scope replaces it", () => {
    const parts = localPreviewParts(
      [scope("Acme", "org"), scope("Web app", "project")],
      [
        files(entry("skills/ship/SKILL.md", 100)),
        files(entry("skills/ship/SKILL.md", 40)),
      ],
    );
    const skills = parts.at(-1);
    expect(skills?.skillCount).toBe(1);
    expect(skills?.loaded).toBe(40);
  });

  it("keeps empty scopes and a zero skill line", () => {
    const parts = localPreviewParts([scope("Acme", "org")], [files()]);
    expect(parts[0]?.loaded).toBe(0);
    expect(parts[1]).toMatchObject({ kind: "skills", label: "0 skills" });
  });

  it("treats a scope that failed to load as empty", () => {
    const parts = localPreviewParts(
      [scope("Acme", "org"), scope("Web app", "project")],
      [files(entry("AGENTS.md", 400)), undefined],
    );
    expect(parts[1]?.loaded).toBe(0);
  });
});

describe("loadedSkills", () => {
  it("collects sizes by skill name", () => {
    expect(
      loadedSkills(
        [scope("Acme", "org")],
        [files(entry("skills/a/SKILL.md", 10), entry("skills/a/notes.md", 99))],
      ),
    ).toEqual([10]);
  });
});
