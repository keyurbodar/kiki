import { describe, expect, it } from "vitest";
import {
  GitHubInstallationConnection,
  GitHubUserConnection,
  PaperStatus,
} from "@/data/api/schemas/integrations";
import { sampleMobileConnection } from "@/data/mocks/mobileConnection/fixtures";
import {
  activeStatus,
  githubStatus,
  paperStatus,
  revylStatus,
  slackStatus,
} from "./status";

const user = (state: "connected" | "auth_required") =>
  new GitHubUserConnection({ state, accountLogin: "alex-morgan" });
const install = (state: "active" | "suspended") =>
  new GitHubInstallationConnection({ installationId: 1, state });

describe("integration status", () => {
  it("maps GitHub user and installation", () => {
    expect(githubStatus(undefined, null)).toBeUndefined();
    expect(githubStatus(null, null)).toBeNull();
    expect(githubStatus(user("auth_required"), install("suspended"))).toBe(
      "reconnect",
    );
    expect(githubStatus(user("connected"), install("suspended"))).toBe(
      "update",
    );
    expect(githubStatus(null, install("active"))).toBe("connected");
  });

  it("maps Slack states and missing scopes", () => {
    expect(slackStatus(null)).toBeNull();
    const base = {
      state: "active",
      missingScopes: [] as string[],
    } as unknown as Parameters<typeof slackStatus>[0];
    expect(slackStatus(base)).toBe("connected");
    expect(
      slackStatus({ ...base, missingScopes: ["chat:write"] } as typeof base),
    ).toBe("update");
    expect(
      slackStatus({ ...base, state: "disconnecting" } as typeof base),
    ).toBe("disconnecting");
  });

  it("maps active connections", () => {
    expect(activeStatus(null)).toBeNull();
    expect(
      activeStatus({ state: "auth_required" } as Parameters<
        typeof activeStatus
      >[0]),
    ).toBe("reconnect");
  });

  it("maps Paper connection", () => {
    expect(
      paperStatus(new PaperStatus({ configured: true, connection: null })),
    ).toBeNull();
  });

  it("derives the Revyl status", () => {
    expect(revylStatus(sampleMobileConnection)).toBe("off_plan");
    const make = (patch: Partial<typeof sampleMobileConnection>) =>
      ({
        ...sampleMobileConnection,
        ...patch,
      }) as typeof sampleMobileConnection;
    expect(revylStatus(make({ configured: false }))).toBe("not_configured");
    expect(revylStatus(make({ available: true }))).toBe("not_connected");
    expect(
      revylStatus(make({ available: true, approvalOutcome: "declined" })),
    ).toBe("declined");
    expect(revylStatus(make({ available: true, state: "connected" }))).toBe(
      "connected",
    );
  });
});
