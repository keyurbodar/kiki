import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OwnerMenu } from "./owner-select";
import { matchesQuery, ownerLabel, runnableServiceUsers } from "./owners";

afterEach(cleanup);

const members = [{ userId: "u1", name: "Alex Morgan", imageUrl: null }];
const bots = [
  { id: "s1", name: "Release bot", role: "member", disabledAt: null },
  { id: "s2", name: "Admin bot", role: "admin", disabledAt: null },
  { id: "s3", name: "Reader", role: "read_only", disabledAt: null },
  { id: "s4", name: "Old bot", role: "member", disabledAt: "2026-01-01" },
];

describe("owners", () => {
  it("filters service users that cannot run automations", () => {
    expect(runnableServiceUsers(bots, false).map((bot) => bot.id)).toEqual([
      "s1",
    ]);
    expect(runnableServiceUsers(bots, true).map((bot) => bot.id)).toEqual([
      "s1",
      "s2",
    ]);
  });

  it("labels the selected owner with a fallback", () => {
    expect(
      ownerLabel({ kind: "human", id: "u1" }, members, bots, "Owner"),
    ).toBe("Alex Morgan");
    expect(
      ownerLabel({ kind: "service", id: "s1" }, members, bots, "Owner"),
    ).toBe("Release bot");
    expect(
      ownerLabel({ kind: "human", id: "gone" }, members, bots, "Owner"),
    ).toBe("Owner");
    expect(matchesQuery("Alex Morgan", " mor")).toBe(true);
    expect(matchesQuery("Alex Morgan", "zz")).toBe(false);
  });

  it("renders the trigger with the owner name", () => {
    render(
      <OwnerMenu
        value={{ kind: "human", id: "u1" }}
        fallbackLabel="Owner"
        onValueChange={() => undefined}
        members={members}
        serviceUsers={[]}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Runs as" }).textContent,
    ).toContain("Alex Morgan");
  });
});
