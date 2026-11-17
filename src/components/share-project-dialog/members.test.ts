import { describe, expect, it } from "vitest";
import {
  type SharePerson,
  type ShareProject,
  canManageSharing,
  memberState,
  nameOf,
  pendingCandidates,
} from "./members";

const people: ReadonlyArray<SharePerson> = [
  { id: "usr_owner", name: "Ada Rivera", imageUrl: null, service: false },
  { id: "usr_sam", name: "Sam Okafor", imageUrl: null, service: false },
  { id: "svc_bot", name: "Deploy bot", imageUrl: null, service: true },
];

const project = (change: Partial<ShareProject> = {}): ShareProject => ({
  id: "proj_sample_web",
  name: "Web app",
  visibility: "private",
  ownerUserId: "usr_owner",
  members: [{ userId: "usr_sam", kind: "human" }],
  viewerRole: "owner",
  ...change,
});

describe("share project members", () => {
  it("marks the owner, named members and candidates", () => {
    expect(memberState(project(), "usr_owner")).toBe("owner");
    expect(memberState(project(), "usr_sam")).toBe("named");
    expect(memberState(project(), "svc_bot")).toBe("candidate");
  });

  it("keeps the owner and members out of the add list", () => {
    expect(pendingCandidates(project(), people, "").map((p) => p.id)).toEqual([
      "svc_bot",
    ]);
  });

  it("filters candidates by name, case-insensitively", () => {
    const open = project({ ownerUserId: null, members: [] });
    expect(
      pendingCandidates(open, people, "  ADA ").map((person) => person.id),
    ).toEqual(["usr_owner"]);
    expect(pendingCandidates(open, people, "nobody")).toEqual([]);
  });

  it("lets owners and ownerless projects manage sharing", () => {
    expect(canManageSharing(project())).toBe(true);
    expect(canManageSharing(project({ ownerUserId: null }))).toBe(true);
    expect(canManageSharing(project({ viewerRole: "member" }))).toBe(false);
  });

  it("falls back to the user id when a person is unknown", () => {
    expect(nameOf(people, "usr_sam")).toBe("Sam Okafor");
    expect(nameOf(people, "usr_missing")).toBe("usr_missing");
  });
});
