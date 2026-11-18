import { describe, expect, it } from "vitest";
import { toInstallation, toInstallationDetail } from "./normalize.ts";

const installation = {
  id: "inst_a",
  pluginKey: "ci-helper",
  displayName: "CI Helper",
  version: "1.3.2",
  versionId: "ver_1_3_2",
  status: "connected",
  installedAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

const availableVersion = {
  id: "ver_1_4_0",
  pluginKey: "ci-helper",
  displayName: "CI Helper",
  version: "1.4.0",
  changelog: "Adds retry hints.",
  publishedAt: "2026-11-16T00:00:00.000Z",
};

describe("pending plugin update", () => {
  it("reports an update only when the payload says a newer version is published", () => {
    const withUpdate = toInstallation({
      ...installation,
      updateAvailable: true,
    });
    expect(withUpdate.updateNeedsYou).toBe(true);
    expect(
      toInstallation({ ...installation, updateAvailable: false })
        .updateNeedsYou,
    ).toBe(false);
  });

  it("falls back to the status only when the payload carries no flag", () => {
    expect(
      toInstallation({ ...installation, status: "needs_review" })
        .updateNeedsYou,
    ).toBe(true);
    expect(
      toInstallation({ ...installation, status: "connected" }).updateNeedsYou,
    ).toBe(false);
  });

  it("carries the version the badge promises, so the page can show it", () => {
    const detail = toInstallationDetail({
      ...installation,
      updateAvailable: true,
      availableVersion,
    });
    expect(detail.installation.updateNeedsYou).toBe(true);
    expect(detail.pending?.version).toBe("1.4.0");
    expect(detail.pending?.notes).toBe("Adds retry hints.");
  });

  it("has no pending version when the payload names none, so nothing is promised", () => {
    const detail = toInstallationDetail({
      ...installation,
      updateAvailable: false,
    });
    expect(detail.pending).toBeNull();
  });

  it("ignores a pending version equal to the running one", () => {
    const detail = toInstallationDetail({
      ...installation,
      updateAvailable: true,
      availableVersion: {
        ...availableVersion,
        version: "1.3.2",
        id: "ver_1_3_2",
      },
    });
    expect(detail.pending).toBeNull();
  });
});
