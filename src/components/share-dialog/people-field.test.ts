import { describe, expect, it } from "vitest";
import { pickablePeople } from "./people-field";
import type { OrgMember } from "./share-data";

const member = (
  userId: string,
  firstName: string,
  lastName: string,
  email: string,
): OrgMember => ({ userId, firstName, lastName, email, imageUrl: null });

const members = [
  member("u_alex", "Alex", "Morgan", "alex@acme.test"),
  member("u_sam", "Sam", "Lee", "sam@acme.test"),
  member("u_priya", "Priya", "Shah", "priya@acme.test"),
  member("u_jordan", "Jordan", "Alexander", "jordan@acme.test"),
];

const ids = (people: ReadonlyArray<OrgMember>) => people.map((p) => p.userId);

describe("pickablePeople", () => {
  it("drops excluded people", () => {
    expect(
      ids(pickablePeople(members, new Set(["u_alex"]), undefined, "")),
    ).toEqual(["u_sam", "u_priya", "u_jordan"]);
  });

  it("keeps only people inside the bound when one is given", () => {
    expect(
      ids(
        pickablePeople(members, new Set(), new Set(["u_sam", "u_priya"]), ""),
      ),
    ).toEqual(["u_sam", "u_priya"]);
  });

  it("applies excluded and bound together", () => {
    expect(
      ids(
        pickablePeople(
          members,
          new Set(["u_sam"]),
          new Set(["u_sam", "u_priya"]),
          "",
        ),
      ),
    ).toEqual(["u_priya"]);
  });

  it("matches names and emails, prefix matches first", () => {
    expect(ids(pickablePeople(members, new Set(), undefined, "alex"))).toEqual([
      "u_alex",
      "u_jordan",
    ]);
    expect(
      ids(pickablePeople(members, new Set(), undefined, "  PRIYA@ ")),
    ).toEqual(["u_priya"]);
  });

  it("returns nothing when no one matches", () => {
    expect(pickablePeople(members, new Set(), undefined, "zzz")).toEqual([]);
  });
});
