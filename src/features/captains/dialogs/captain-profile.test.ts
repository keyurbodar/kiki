import { describe, expect, it } from "vitest";
import { captainProfileOf } from "./captain-profile";

const record = {
  id: "jam_sample_cap1",
  name: "Release captain",
  alias: "release",
  description: "Runs the weekly web release and its follow-ups.",
  ownerId: "user_sample_alex",
  projectId: "project_sample_web",
  face: {
    name: "Release captain",
    avatar: { kind: "preset", value: "capy-avatar-2", background: "#ffffff" },
    description: "Runs the weekly web release and its follow-ups.",
  },
  memberIds: ["user_sample_alex", "user_sample_priya"],
  ownerName: "Alex Morgan",
};

describe("a Captain's record as its profile dialog reads it", () => {
  it("carries the fields the dialog edits", () => {
    expect(
      captainProfileOf(record, {
        userId: "user_sample_alex",
        projectName: "Web app",
      }),
    ).toEqual({
      name: "Release captain",
      alias: "release",
      description: "Runs the weekly web release and its follow-ups.",
      avatar: { kind: "preset", value: "capy-avatar-2", background: "#ffffff" },
      projectId: "project_sample_web",
      projectName: "Web app",
      ownerUserId: "user_sample_alex",
      ownerName: "Alex Morgan",
      archived: false,
      crew: ["user_sample_alex", "user_sample_priya"],
      crewDevice: null,
      viewerRole: "owner",
    });
  });

  it("reads everyone else as a member", () => {
    expect(
      captainProfileOf(record, { userId: "user_sample_priya" })?.viewerRole,
    ).toBe("member");
  });

  it("drops a record it cannot draw: no name, no owner, no avatar", () => {
    expect(captainProfileOf({ ...record, name: undefined }, {})).toBe(
      undefined,
    );
    expect(captainProfileOf({ ...record, ownerId: undefined }, {})).toBe(
      undefined,
    );
    expect(
      captainProfileOf({ ...record, face: { avatar: { value: "" } } }, {}),
    ).toBe(undefined);
    expect(captainProfileOf("not a record", {})).toBe(undefined);
  });
});
