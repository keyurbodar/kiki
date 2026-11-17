import { describe, expect, it } from "vitest";
import { settingsNav, settingsNavGroups } from "./registry";
import { isSettingsRowVisible, searchSettings } from "./search";

describe("settings nav registry", () => {
  it("has one entry per Capy settings page with unique ids, routes and row ids", () => {
    expect(settingsNav).toHaveLength(33);
    expect(new Set(settingsNav.map((e) => e.id)).size).toBe(33);
    expect(new Set(settingsNav.map((e) => e.to)).size).toBe(33);
    const rowIds = settingsNav.flatMap((e) => (e.rows ?? []).map((r) => r.id));
    expect(new Set(rowIds).size).toBe(rowIds.length);
  });

  it("orders the sidebar like Capy", () => {
    const labels = (section: string) =>
      settingsNav.filter((e) => e.section === section).map((e) => e.label);
    expect(settingsNavGroups.map((g) => g.section)).toEqual([
      "personal",
      "agent",
      "review",
      "organization",
    ]);
    expect(labels("personal")).toEqual([
      "General",
      "Appearance",
      "Profile",
      "Security",
      "Referrals",
      "Experiments",
      "Notifications",
      "Shortcuts",
      "Models",
      "Projects & setup",
      "MCP & plugins",
      "Integrations",
      "Cloud credentials",
      "API",
      "Devices",
    ]);
    expect(labels("agent")).toEqual([
      "Instructions",
      "Skills",
      "Threads",
      "Git & pull requests",
    ]);
    expect(labels("review")).toEqual(["Repositories", "Agent config"]);
    expect(labels("organization")).toEqual([
      "General",
      "Identity & access",
      "Issue states",
      "Members",
      "Billing",
      "Usage",
      "Activity",
      "Audit log",
    ]);
    expect(labels("search")).toEqual([
      "Email",
      "This device",
      "Slack",
      "Slack",
    ]);
  });
});

describe("searchSettings", () => {
  it("returns nothing for a blank query", () => {
    expect(searchSettings("   ")).toEqual([]);
  });

  it("returns every visible row when the page itself matches", () => {
    const [first] = searchSettings("security");
    expect(first?.page.id).toBe("security");
    expect(first?.rows.map((r) => r.id)).toEqual([
      "sign-in-methods",
      "two-step-verification",
      "authenticator-app",
      "backup-codes",
      "passkeys",
    ]);
  });

  it("matches rows by page title, row title and keywords, all terms required", () => {
    const results = searchSettings("diff colors");
    expect(results.map((r) => r.page.id)).toEqual(["appearance"]);
    expect(results[0]?.rows.map((r) => r.id)).toEqual(["diff-colors"]);
  });

  it("lists search-only pages in catalog order", () => {
    const pages = searchSettings("unsubscribe").map((r) => r.page.id);
    expect(pages).toEqual(["notifications", "notifications-email"]);
  });

  it("hides desktop-only rows on the web and shows win32 titles on Windows", () => {
    const web = searchSettings("menu bar").flatMap((r) => r.rows);
    expect(web).toEqual([]);
    const windows = searchSettings("tray", {
      desktop: { platform: "win32", loginItem: true },
    }).flatMap((r) => r.rows.map((row) => row.title));
    expect(windows).toContain("Show in system tray");
  });

  it("hides the Memory experiment while the memory experiment is paused", () => {
    expect(
      searchSettings("memory").flatMap((r) => r.rows.map((row) => row.id)),
    ).toContain("capy-memory");
    expect(
      searchSettings("memory", {
        pausedExperiments: new Set(["memory"]),
      }).flatMap((r) => r.rows.map((row) => row.id)),
    ).not.toContain("capy-memory");
  });

  it("gates billing rows on the org's balance", () => {
    const row = { id: "x", title: "x", creditSourcesOnly: true };
    expect(isSettingsRowVisible(row)).toBe(false);
    expect(isSettingsRowVisible(row, { creditSources: true })).toBe(true);
  });
});
