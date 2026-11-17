import { describe, expect, it } from "vitest";
import { driveLocationKey, threadDriveLocations } from "./drive-location";

describe("drive locations", () => {
  it("keys each location kind", () => {
    expect(driveLocationKey({ kind: "captain", jamId: "jam_1" })).toBe(
      "captain:jam_1",
    );
    expect(
      driveLocationKey({ kind: "project", projectId: "p1", scope: "shared" }),
    ).toBe("project:p1:shared");
    expect(driveLocationKey({ kind: "organization" })).toBe("organization");
  });

  it("lists a thread's drives in captain, project, org, personal order", () => {
    expect(threadDriveLocations("jam_c", "p1").map(driveLocationKey)).toEqual([
      "captain:jam_c",
      "project:p1:shared",
      "organization",
      "personal",
    ]);
    expect(threadDriveLocations(null, null).map(driveLocationKey)).toEqual([
      "organization",
      "personal",
    ]);
  });
});
