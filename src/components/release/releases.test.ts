import { describe, expect, it } from "vitest";
import {
  formatReleaseVersion,
  isReleased,
  RELEASES,
  releaseHistory,
  releaseKey,
} from "./releases";

describe("releases", () => {
  it("has unique versions and at least one highlight per release", () => {
    const versions = RELEASES.map((release) => release.version);
    expect(new Set(versions).size).toBe(versions.length);
    for (const release of RELEASES)
      expect(release.card.highlights.length).toBeGreaterThan(0);
  });

  it("keys a release the way announcement keys are stored", () => {
    expect(releaseKey("0.9.0")).toBe("release-0.9.0");
  });

  it("treats a release as out once its date has passed", () => {
    const now = new Date("2026-11-16T00:00:00Z");
    expect(isReleased({ date: "2026-11-15" }, now)).toBe(true);
    expect(isReleased({ date: "2026-11-17" }, now)).toBe(false);
  });

  it("shows the requested release even when it is future dated", () => {
    const now = new Date("2026-11-01T00:00:00Z");
    expect(releaseHistory("0.9.0", now)[0]?.version).toBe("0.9.0");
    expect(releaseHistory("0.9.0", now)).toHaveLength(
      RELEASES.filter((release) => release.date <= "2026-11-01").length + 1,
    );
  });

  it("labels the beta entry", () => {
    expect(formatReleaseVersion("beta")).toBe("Beta");
    expect(formatReleaseVersion("0.9.0")).toBe("0.9.0");
  });
});
