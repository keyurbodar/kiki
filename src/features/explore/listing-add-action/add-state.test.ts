import { describe, expect, it } from "vitest";
import { findSampleListing } from "@/data/mocks/explorePublic/fixtures";
import { addState, addTarget } from "./add-state";
import { recordAdded, unversionedKey, versionedKey } from "./recently-added";

const skill = findSampleListing("skill", "debugging-playbook")?.card;
const plugin = findSampleListing("plugin", "edge-platform")?.card;
if (skill === undefined || plugin === undefined)
  throw new Error("missing fixtures");

const base = { recent: [], added: undefined, indexAdded: [], indexUpdates: [] };

describe("addState", () => {
  it("offers Add until the listing is added", () => {
    expect(addState({ ...base, card: skill }).state).toBe("add");
    expect(
      addState({
        ...base,
        card: skill,
        indexAdded: ["skill:debugging-playbook"],
      }).state,
    ).toBe("added");
  });

  it("offers Update for an added skill with a newer version", () => {
    const input = {
      ...base,
      card: skill,
      indexAdded: ["skill:debugging-playbook"],
      indexUpdates: ["skill:debugging-playbook"],
    };
    expect(addState(input).state).toBe("update");
    expect(addState({ ...input, recent: [versionedKey(skill)] }).state).toBe(
      "added",
    );
    expect(
      addState({
        ...input,
        card: plugin,
        indexAdded: ["plugin:edge-platform"],
        indexUpdates: ["plugin:edge-platform"],
      }).state,
    ).toBe("added");
  });

  it("routes each kind to its add flow", () => {
    expect(addTarget(skill, false, false, false)).toEqual({ kind: "sign-in" });
    expect(addTarget(plugin, true, false, false)).toEqual({
      kind: "marketplace",
      name: "edge-platform",
    });
    expect(addTarget(plugin, true, true, false)).toEqual({
      kind: "settings-mcp",
    });
    expect(addTarget(skill, true, false, false)).toEqual({
      kind: "dialog",
      dialog: "skill",
    });
  });
});

describe("recordAdded", () => {
  it("keeps one versioned entry per listing", () => {
    const first = recordAdded({}, "org_a", [
      { kind: "skill", slug: "a", versionId: "v1" },
    ]);
    const second = recordAdded(first, "org_a", [
      { kind: "skill", slug: "a", versionId: "v2" },
    ]);
    expect(second.org_a).toEqual(["skill:a@v2"]);
    expect(unversionedKey("skill:a@v2")).toBe("skill:a");
  });
});
