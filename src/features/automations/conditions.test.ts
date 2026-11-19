import { describe, expect, it } from "vitest";
import {
  conditionFields,
  conditionSearchLabel,
  conditionSummary,
  memberLogins,
  patternSubject,
  primaryFields,
} from "./conditions";

const keys = (type: string, event?: string) =>
  conditionFields(type, event).map((field) => field.key);

describe("the filters an event offers", () => {
  it("narrows a pull request trigger by repository and author", () => {
    expect(keys("github", "pull_request_opened")).toEqual([
      "repositories",
      "authors",
    ]);
    expect(keys("github", "pull_request_review_submitted")).toEqual([
      "repositories",
      "actors",
    ]);
    expect(keys("github", "branch_push")).toEqual([
      "repositories",
      "branches",
      "actors",
    ]);
    expect(keys("github", "checks")).toEqual(["repositories"]);
  });

  it("offers the reactions filter on a reaction trigger only", () => {
    expect(keys("slack", "reaction")).toEqual([
      "users",
      "channels",
      "reactions",
    ]);
    expect(keys("slack", "message")).toEqual(["users", "channels"]);
    expect(keys("sentry", "any_issue")).toEqual(["projects"]);
    expect(keys("linear", "status_changed")).toEqual(["teams"]);
    expect(keys("incoming_webhook")).toEqual(["contains", "excludes"]);
    expect(keys("on_demand")).toEqual([]);
  });

  it("shows the first two fields before anything is chosen", () => {
    expect(primaryFields("github", "branch_push").map((f) => f.key)).toEqual([
      "repositories",
      "branches",
    ]);
    expect(primaryFields("slack", "reaction").map((f) => f.key)).toEqual([
      "users",
      "channels",
      "reactions",
    ]);
  });
});

describe("how a filter chip reads", () => {
  const repository = conditionFields("github", "checks")[0];
  const actor = conditionFields("github", "comment")[1];

  it("says anyone, or any noun, while nothing is chosen", () => {
    expect(
      repository === undefined ? "" : conditionSummary(repository, []),
    ).toBe("any repository");
    expect(actor === undefined ? "" : conditionSummary(actor, [])).toBe(
      "anyone",
    );
  });

  it("lists two values and counts more", () => {
    if (repository === undefined) throw new Error("no repository field");
    expect(conditionSummary(repository, ["acme/web", "acme/api"])).toBe(
      "acme/web, acme/api",
    );
    expect(
      conditionSummary(repository, ["acme/web", "acme/api", "acme/docs"]),
    ).toBe("3 repositories");
  });

  it("names the field a menu searches", () => {
    expect(
      repository === undefined ? "" : conditionSearchLabel(repository),
    ).toBe("Search or add repository");
  });

  it("subjects the pattern to the body, or the message on Slack", () => {
    expect(patternSubject("slack")).toBe("message");
    expect(patternSubject("github")).toBe("body");
    expect(patternSubject("incoming_webhook")).toBe("body");
  });
});

describe("member logins", () => {
  it("reads a login per member and skips the ones without one", () => {
    expect(
      memberLogins([
        { firstName: "Alex", lastName: "Morgan", githubLogin: "alex-morgan" },
        { firstName: "Sam", lastName: "Sample", githubLogin: "" },
        { name: "Priya", githubLogin: "priya-sample" },
        { githubLogin: "casey-sample", email: "casey@example.com" },
      ]),
    ).toEqual([
      { value: "alex-morgan", label: "Alex Morgan" },
      { value: "priya-sample", label: "Priya" },
      { value: "casey-sample", label: "casey@example.com" },
    ]);
  });

  it("accepts the wrapped member list the contract serves", () => {
    expect(
      memberLogins({
        members: [{ firstName: "Sam", lastName: "Rivera", githubLogin: "sam" }],
      }),
    ).toEqual([{ value: "sam", label: "Sam Rivera" }]);
    expect(memberLogins(undefined)).toEqual([]);
  });
});
