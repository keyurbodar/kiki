import { describe, expect, it } from "vitest";
import {
  formatChanged,
  matchesShareSearch,
  shareOpenTarget,
  shareScopeLabel,
} from "./shared-scopes";

const none = {
  projectId: null,
  userId: null,
  automationId: null,
  captainJamId: null,
};
const context = {
  organizationName: "Acme",
  userId: "user_1",
  projects: [{ id: "prj_1", name: "Web" }],
  automations: [{ id: "auto_1", name: "Nightly" }],
  captains: [],
};

describe("shared page scopes", () => {
  it("labels every drive kind", () => {
    expect(shareScopeLabel(none, context)).toBe("Acme");
    expect(shareScopeLabel({ ...none, userId: "user_1" }, context)).toBe(
      "Your drive",
    );
    expect(shareScopeLabel({ ...none, projectId: "prj_1" }, context)).toBe(
      "Web",
    );
    expect(
      shareScopeLabel(
        { ...none, projectId: "prj_1", userId: "user_1" },
        context,
      ),
    ).toBe("Your drive in Web");
    expect(shareScopeLabel({ ...none, automationId: "auto_1" }, context)).toBe(
      "Nightly",
    );
    expect(shareScopeLabel({ ...none, captainJamId: "jam_1" }, context)).toBe(
      "Captain",
    );
  });

  it("falls back for drives that are gone", () => {
    expect(shareScopeLabel({ ...none, projectId: "prj_x" }, context)).toBe(
      "A deleted project",
    );
    expect(shareScopeLabel({ ...none, automationId: "auto_x" }, context)).toBe(
      "A deleted automation",
    );
    expect(shareScopeLabel({ ...none, userId: "user_2" }, context)).toBe(
      "Another drive",
    );
  });

  it("opens the owning drive", () => {
    expect(shareOpenTarget(none)).toEqual({
      to: "/drive/$scope",
      params: { scope: "organization" },
    });
    expect(
      shareOpenTarget({ ...none, projectId: "prj_1", userId: "u" }),
    ).toEqual({
      to: "/project/$projectId/drive/$scope",
      params: { projectId: "prj_1", scope: "personal" },
    });
    expect(shareOpenTarget({ ...none, captainJamId: "jam_1" })).toEqual({
      to: "/drive/captain/$jamId",
      params: { jamId: "jam_1" },
    });
  });

  it("searches path and drive", () => {
    expect(matchesShareSearch(["specs/a.md", "Web"], "web")).toBe(true);
    expect(matchesShareSearch(["specs/a.md", "Web"], "zzz")).toBe(false);
  });

  it("formats change times relative to now", () => {
    const now = Date.parse("2026-01-10T12:00:00Z");
    expect(formatChanged("2026-01-10T11:00:00Z", now)).toBe("1 hour ago");
    expect(formatChanged("2026-01-09T12:00:00Z", now)).toBe("yesterday");
    expect(formatChanged("2026-01-10T11:59:50Z", now)).toBe("just now");
  });
});
