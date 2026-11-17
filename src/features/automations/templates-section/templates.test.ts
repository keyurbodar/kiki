import { describe, expect, it } from "vitest";
import { automationTemplates, findTemplate, templateStatus } from "./templates";

describe("automation templates", () => {
  it("lists Capy's six templates", () => {
    expect(automationTemplates.map((template) => template.id)).toEqual([
      "slack-customer-bug-triage",
      "slack-support-question-triage",
      "linear-issue-to-pr",
      "sentry-issue-investigation",
      "weekly-dependency-updates",
      "custom-webhook-triage",
    ]);
  });

  it("holds back templates with unshipped triggers", () => {
    const sentry = automationTemplates.find(
      (t) => t.id === "sentry-issue-investigation",
    );
    expect(sentry && templateStatus(sentry)).toBe("coming_soon");
    expect(findTemplate("sentry-issue-investigation")).toBeUndefined();
    expect(findTemplate("linear-issue-to-pr")?.name).toBe("Linear issue to PR");
    expect(findTemplate(undefined)).toBeUndefined();
  });
});
