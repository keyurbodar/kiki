import { describe, expect, it } from "vitest";
import {
  desktopHref,
  errorStage,
  failureHref,
  gitHubOutcome,
  gitHubReturnHref,
  isGitHubInstallUrl,
  mcpReturnHref,
  statusForStage,
} from "./callback-result";

describe("callback result helpers", () => {
  it("builds the settings failure link with stage and message", () => {
    expect(failureHref("slack", "token exchange")).toBe(
      "/settings/integrations/slack?slack=failed&stage=token%20exchange",
    );
    expect(failureHref("x", "state", "Try again")).toBe(
      "/admin/x?x=failed&stage=state&message=Try%20again",
    );
  });

  it("only treats unknown_account as a switch-account status", () => {
    expect(statusForStage("unknown_account")).toBe("unknown_account");
    expect(statusForStage("state")).toBe("failed");
  });

  it("maps request errors to a stage", () => {
    expect(errorStage(new TypeError("no session"))).toBe("session");
    expect(errorStage(new Error("network"))).toBe("browser");
  });

  it("opens the desktop app only for known schemes", () => {
    expect(desktopHref("capy", "/settings/mcp?mcp=connected")).toBe(
      "capy://app/settings/mcp?mcp=connected",
    );
    expect(desktopHref("capy-nightly", "/new")).toBe("capy-nightly://app/new");
    expect(desktopHref("other", "/new")).toBeUndefined();
    expect(desktopHref(null, "/new")).toBeUndefined();
  });

  it("accepts only GitHub app install URLs", () => {
    expect(
      isGitHubInstallUrl("https://github.com/apps/capy/installations/new"),
    ).toBe(true);
    expect(isGitHubInstallUrl("https://example.com/apps/capy")).toBe(false);
    expect(isGitHubInstallUrl("https://github.com/settings")).toBe(false);
    expect(isGitHubInstallUrl("not a url")).toBe(false);
    expect(isGitHubInstallUrl(undefined)).toBe(false);
  });

  it("routes GitHub results back to where the connection started", () => {
    expect(gitHubReturnHref({ result: "connected" })).toBe(
      "/settings/integrations/github?github=connected",
    );
    expect(gitHubReturnHref({ result: "connected", returnTo: "picker" })).toBe(
      "/new?github=connected",
    );
    expect(gitHubReturnHref({ result: "choose", returnTo: "onboarding" })).toBe(
      "/onboarding?github=choose",
    );
    expect(
      gitHubReturnHref({
        result: "connected",
        returnTo: "project",
        projectId: "proj_1",
      }),
    ).toBe("/settings/projects/proj_1?github=connected");
    expect(gitHubReturnHref({ result: "failed", stage: "token" })).toBe(
      "/settings/integrations/github?github=failed&reason=token",
    );
    expect(gitHubReturnHref({ result: "install" })).toBe(
      "/settings/integrations/github?github=failed",
    );
  });

  it("reduces GitHub results to a surface outcome", () => {
    expect(gitHubOutcome("install")).toBe("failed");
    expect(gitHubOutcome("choose")).toBe("connected");
    expect(gitHubOutcome("denied")).toBe("denied");
  });

  it("keeps a custom MCP destination untouched", () => {
    expect(mcpReturnHref({ result: "connected" })).toBe(
      "/settings/mcp?mcp=connected",
    );
    expect(
      mcpReturnHref({ result: "connected", destination: "/thread/abc" }),
    ).toBe("/thread/abc");
  });
});
