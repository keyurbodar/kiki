import { describe, expect, it } from "vitest";
import type { JamId } from "@/data/api/schemas/ids";
import {
  type CaptainProfile,
  createdCaptain,
  crewCountLabel,
  deleteLines,
  demotedReleased,
  demoteLines,
  dialogTitle,
  displayName,
  initialName,
  initialVisibility,
  profileChanges,
  singleLine,
  submitLabel,
  submitLoadingLabel,
} from "./captain-dialog-model";

const profile: CaptainProfile = {
  name: "Release captain",
  alias: "release",
  description: null,
  avatar: { kind: "preset", value: "capy-avatar-2", background: "#AC6A51" },
  projectId: "proj_web",
  ownerUserId: "user_alex",
  archived: false,
  crew: ["t1", "t2"],
  crewDevice: null,
  viewerRole: "owner",
};

const draft = {
  name: profile.name,
  alias: "release",
  description: "",
  avatar: profile.avatar,
  crewDeviceId: null,
};

describe("captain dialog model", () => {
  it("titles and labels each request kind like Capy", () => {
    expect(dialogTitle({ kind: "create" })).toBe("New Captain");
    expect(
      dialogTitle({
        kind: "promote-folder",
        folder: { id: "f", name: "Ops", visibility: "shared" },
      }),
    ).toBe("Promote folder to Captain");
    expect(dialogTitle({ kind: "edit", jamId: "j" as JamId, profile })).toBe(
      "Release captain",
    );
    expect(submitLabel("create")).toBe("Create Captain");
    expect(submitLabel("promote-thread")).toBe("Promote");
    expect(submitLoadingLabel("edit")).toBe("Saving");
  });

  it("seeds name and visibility from what is promoted", () => {
    const thread = {
      id: "t",
      title: "Fix login",
      projectId: null,
      personal: true,
    };
    expect(initialName({ kind: "promote-thread", thread })).toBe("Fix login");
    expect(initialVisibility({ kind: "promote-thread", thread })).toBe(
      "private",
    );
    expect(initialVisibility({ kind: "create" })).toBe("shared");
    expect(displayName("  ")).toBe("Captain");
  });

  it("sends only what an edit changed", () => {
    expect(profileChanges(profile, draft)).toBeUndefined();
    expect(profileChanges(profile, { ...draft, alias: " " })).toEqual({
      name: "Release captain",
      avatar: profile.avatar,
      alias: null,
      description: undefined,
      crewDeviceId: undefined,
    });
    expect(
      profileChanges(profile, {
        ...draft,
        description: "Ships it",
        crewDeviceId: "dev_1",
      }),
    ).toMatchObject({
      description: "Ships it",
      crewDeviceId: "dev_1",
      alias: undefined,
    });
  });

  it("words demote, delete and crew counts", () => {
    expect(demoteLines(profile)[1]).toBe(
      "Its 2 crew threads return to the ordinary list with their reports and pull requests",
    );
    expect(demoteLines({ ...profile, crew: [] })[1]).toBe(
      "It has no crew threads",
    );
    expect(deleteLines({ ...profile, crew: ["t"] })[0]).toBe(
      "Release captain is deleted and its thread returns to the ordinary list",
    );
    expect(deleteLines({ ...profile, archived: true })[2]).toBe(
      "Archived, it keeps its history and crew until deleted",
    );
    expect(crewCountLabel(1)).toBe("1 thread");
    expect(demotedReleased(0)).toBe("It had no crew threads");
    expect(demotedReleased(3)).toBe(
      "Its 3 crew threads are back in the ordinary list",
    );
  });

  it("flattens description newlines and reads created ids", () => {
    expect(singleLine("a \n  b")).toBe("a b");
    expect(createdCaptain({ id: "jam_1", name: "Ops" }, "x")).toEqual({
      jamId: "jam_1",
      name: "Ops",
    });
    expect(createdCaptain(null, "Captain")).toEqual({
      jamId: undefined,
      name: "Captain",
    });
  });
});
