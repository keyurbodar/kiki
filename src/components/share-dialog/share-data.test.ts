import { describe, expect, it } from "vitest";
import { readFolders, readOrgMembers, readThreadShare } from "./share-data";

describe("readThreadShare", () => {
  it("reads membership, owner and access", () => {
    expect(
      readThreadShare({
        id: "jam_1",
        userId: "u_alex",
        projectId: "prj_web",
        personal: true,
        membership: {
          viewerRole: "owner",
          members: [
            { userId: "u_alex", subscribed: true },
            { userId: "u_sam", subscribed: false },
          ],
        },
      }),
    ).toEqual({
      id: "jam_1",
      userId: "u_alex",
      projectId: "prj_web",
      personal: true,
      crewCount: undefined,
      captain: undefined,
      membership: {
        viewerRole: "owner",
        members: [
          { userId: "u_alex", subscribed: true },
          { userId: "u_sam", subscribed: false },
        ],
      },
    });
  });

  it("falls back to a plain member id list", () => {
    expect(
      readThreadShare({ id: "jam_2", memberIds: [{ id: "u_sam" }] })
        ?.membership,
    ).toEqual({
      viewerRole: "member",
      members: [{ userId: "u_sam", subscribed: true }],
    });
  });

  it("reads a captain", () => {
    expect(
      readThreadShare({ id: "jam_3", captain: { jamId: "jam_c", name: "Ops" } })
        ?.captain,
    ).toEqual({ jamId: "jam_c", name: "Ops" });
  });

  it("returns undefined for anything without an id", () => {
    expect(readThreadShare(undefined)).toBeUndefined();
    expect(readThreadShare({ name: "x" })).toBeUndefined();
  });
});

describe("readFolders", () => {
  it("reads both folder shapes", () => {
    expect(
      readFolders([
        {
          id: "f1",
          name: "Launch",
          visibility: "private",
          ownerUserId: "u_alex",
          members: [{ userId: "u_sam" }],
        },
        {
          id: "f2",
          name: null,
          access: "members",
          ownerId: "u_sam",
          sharedWith: ["u_priya"],
        },
      ]),
    ).toEqual([
      {
        id: "f1",
        name: "Launch",
        visibility: "private",
        ownerUserId: "u_alex",
        members: [{ userId: "u_sam" }],
      },
      {
        id: "f2",
        name: null,
        visibility: "shared",
        ownerUserId: "u_sam",
        members: [{ userId: "u_priya" }],
      },
    ]);
  });
});

describe("readOrgMembers", () => {
  it("reads a list or a members envelope", () => {
    const alex = {
      userId: "u_alex",
      firstName: "Alex",
      lastName: null,
      email: null,
      imageUrl: null,
    };
    expect(readOrgMembers([alex])).toEqual([alex]);
    expect(
      readOrgMembers({ members: [{ id: "u_sam", email: "sam@acme.test" }] }),
    ).toEqual([
      {
        userId: "u_sam",
        firstName: null,
        lastName: null,
        email: "sam@acme.test",
        imageUrl: null,
      },
    ]);
  });
});
