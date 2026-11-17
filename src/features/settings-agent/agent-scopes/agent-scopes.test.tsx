import { describe, expect, it } from "vitest";
import {
  parseSkill,
  readSkillMeta,
  skillNameOf,
  slugifySkillName,
  writeSkill,
} from "./drive-authoring";
import { buildAgentScopes } from "./use-agent-scopes";

describe("skill frontmatter", () => {
  const text =
    "---\nname: ship\ndescription: Ships it\nlicense: MIT\n---\n\n# ship\n\nSteps\n";

  it("reads the description and body", () => {
    expect(readSkillMeta(text)).toEqual({
      description: "Ships it",
      body: "# ship\n\nSteps\n",
    });
    expect(readSkillMeta("no frontmatter")).toBeUndefined();
    expect(
      readSkillMeta("---\nname: x\ndescription:\n---\n")?.description,
    ).toBeUndefined();
  });

  it("parses quoted and folded values", () => {
    expect(parseSkill('---\ndescription: "a: b"\n---\nbody').description).toBe(
      "a: b",
    );
    expect(
      parseSkill("---\ndescription: >\n  one\n  two\n---\n").description,
    ).toBe("one two");
  });

  it("writes back only what changed, keeping other fields", () => {
    const doc = parseSkill(text);
    expect(writeSkill(doc, "ship", "Ships it", doc.body)).toBe(text);
    expect(writeSkill(doc, "ship", "Ships it: now", "Body\n")).toBe(
      '---\nname: ship\ndescription: "Ships it: now"\nlicense: MIT\n---\n\nBody\n',
    );
  });

  it("writes frontmatter for a new skill", () => {
    expect(
      writeSkill(parseSkill(""), "release-check", "Before deploys", "Steps\n"),
    ).toBe(
      "---\nname: release-check\ndescription: Before deploys\n---\n\nSteps\n",
    );
  });

  it("slugifies names and reads skill paths", () => {
    expect(slugifySkillName("Release  Check!")).toBe("release-check-");
    expect(slugifySkillName("--x")).toBe("x");
    expect(skillNameOf("skills/ship/SKILL.md")).toBe("ship");
    expect(skillNameOf("skills/ship/notes.md")).toBeUndefined();
  });
});

describe("buildAgentScopes", () => {
  const project = { id: "proj_1", name: "Web app", logoUrl: null, repos: [] };

  it("orders org, project, you, you in project, then the project's captains", () => {
    const scopes = buildAgentScopes({
      orgId: "org_1",
      orgName: "Acme",
      userId: "user_1",
      project,
      captains: [
        {
          id: "jam_1",
          name: "Release captain",
          projectId: "proj_1",
          ownerId: "user_2",
        },
        {
          id: "jam_2",
          name: "Docs captain",
          projectId: "proj_2",
          ownerId: "user_1",
        },
      ],
    });
    expect(scopes.map((scope) => [scope.name, scope.kind])).toEqual([
      ["Acme", "Organization"],
      ["Web app", "Project"],
      ["You", "Every project"],
      ["You in Web app", "Only you, only here"],
      ["Release captain", "Captain"],
    ]);
    expect(scopes[3]?.scope).toEqual({ projectId: "proj_1", userId: "user_1" });
    expect(scopes[4]?.readOnly).toBe(true);
    expect(scopes[4]?.audience).toBe("Release captain and its crew");
  });

  it("drops project scopes when there is no project", () => {
    const scopes = buildAgentScopes({
      orgId: "org_1",
      orgName: "Acme",
      userId: undefined,
      project: undefined,
      captains: [],
    });
    expect(scopes.map((scope) => scope.key)).toEqual(["org"]);
  });
});
