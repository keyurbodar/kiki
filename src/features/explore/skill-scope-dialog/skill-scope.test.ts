import { describe, expect, it } from "vitest";
import { addedToast, scopeDestination, scopePayload } from "./skill-scope";

describe("skill scope", () => {
  it("builds the scope payload for each choice", () => {
    expect(scopePayload("organization", "user_a", "prj_a")).toEqual({});
    expect(scopePayload("personal", "user_a", undefined)).toEqual({
      userId: "user_a",
    });
    expect(scopePayload("personal", undefined, undefined)).toBeUndefined();
    expect(scopePayload("project", "user_a", "prj_a")).toEqual({
      projectId: "prj_a",
    });
    expect(scopePayload("project", "user_a", undefined)).toBeUndefined();
  });

  it("names the destination drive", () => {
    expect(scopeDestination("organization", "Acme", undefined)).toBe(
      "the Acme drive",
    );
    expect(scopeDestination("organization", undefined, undefined)).toBe(
      "the organization drive",
    );
    expect(scopeDestination("personal", "Acme", undefined)).toBe("your drive");
    expect(scopeDestination("project", "Acme", "Web app")).toBe(
      "Web app's shared files",
    );
  });

  it("words the toast for an add and an update", () => {
    expect(
      addedToast({ name: "debugging-playbook", replaced: false }, "your drive"),
    ).toEqual({
      title: "Added debugging-playbook",
      description: "skills/debugging-playbook/ in your drive",
    });
    expect(addedToast({ name: "x", replaced: true }, "your drive").title).toBe(
      "Updated x",
    );
  });
});
