import { describe, expect, it } from "vitest";
import {
  effectiveChoice,
  experimentRowId,
  featureCatalog,
  membersSummary,
} from "./feature-catalog";

describe("experiment rows", () => {
  it("gives memory its historical row id and everything else the prefixed one", () => {
    expect(experimentRowId("memory")).toBe("capy-memory");
    expect(experimentRowId("review_telemetry")).toBe(
      "experiment-review_telemetry",
    );
  });

  it("summarizes how many members have the experiment on", () => {
    expect(
      membersSummary({ feature: "memory", membersOn: 0, memberCount: 4 }),
    ).toBe("Off for everyone");
    expect(
      membersSummary({ feature: "memory", membersOn: 4, memberCount: 4 }),
    ).toBe("On for all 4 members");
    expect(
      membersSummary({ feature: "memory", membersOn: 1, memberCount: 4 }),
    ).toBe("On for 1 of 4 members");
  });

  it("inherits the organization choice until the member picks one", () => {
    expect(effectiveChoice(undefined, true)).toEqual({
      label: "On",
      inherited: true,
    });
    expect(effectiveChoice("off", true)).toEqual({
      label: "Off",
      inherited: false,
    });
  });

  it("catalogs every feature with copy", () => {
    for (const feature of Object.values(featureCatalog)) {
      expect(feature.label.length).toBeGreaterThan(0);
      expect(feature.description.length).toBeGreaterThan(0);
    }
  });
});
