import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { decodeOrgActivity } from "./activity-schema";
import { contributionModel } from "./contribution-grid";
import {
  memberDisplay,
  memberRowsFrom,
  OrgActivityBody,
  type OrgActivityBodyProps,
  serviceUsersNote,
} from "./org-activity-page";

afterEach(cleanup);

const now = new Date("2026-03-15T12:00:00.000Z");

const payload = {
  from: "2026-02-14T00:00:00.000Z",
  to: now.toISOString(),
  repoCount: 4,
  projectOptions: [
    { id: "proj_web", name: "Web app", repos: ["acme/web"] },
    { id: "proj_api", name: "API", repos: ["acme/api", "acme/shared"] },
  ],
  membersWithoutLogin: [],
  connectedAt: "2026-02-22T12:00:00.000Z",
  merged: { current: 42, previous: 30 },
  mergedAll: { current: 50, previous: 40 },
  threadMerged: 42,
  reviewOnlyMerged: 0,
  contributed: { current: 61, previous: 48 },
  findings: { current: 12, previous: 9 },
  loops: { current: 18, previous: 14 },
  loopDays: [
    { date: "2026-03-01T12:00:00.000Z", trigger: "ci_failed", loops: 4 },
  ],
  agentMs: { current: 3_600_000 * 9, previous: 3_600_000 * 6 },
  hoursDays: [{ date: "2026-03-01T12:00:00.000Z", agentMs: 3_600_000 }],
  days: [
    { date: "2026-03-01T12:00:00.000Z", merged: 4, mergedAll: 5, without: 1 },
    { date: "2026-03-02T12:00:00.000Z", merged: 6, mergedAll: 7, without: 1 },
  ],
  touches: [
    {
      date: "2026-03-01T12:00:00.000Z",
      total: 12,
      repos: [{ repoFullName: "acme/web", touches: 8 }],
      moreRepos: 0,
      moreTouches: 0,
      noRepo: 4,
    },
  ],
  mergedByMember: {
    members: [{ userId: "user_sample_alex", total: 20 }],
    others: 22,
    days: [
      { date: "2026-03-01T12:00:00.000Z", members: [3], others: 1 },
      { date: "2026-03-02T12:00:00.000Z", members: [4], others: 2 },
    ],
  },
  loopsByMember: {
    members: [{ userId: "user_sample_alex", total: 9 }],
    others: 9,
    days: [{ date: "2026-03-01T12:00:00.000Z", members: [2], others: 2 }],
  },
  hoursByMember: {
    members: [{ userId: "user_sample_alex", total: 3_600_000 }],
    others: 3_600_000,
    days: [{ date: "2026-03-01T12:00:00.000Z", members: [1], others: 1 }],
  },
  serviceUsers: { count: 1, merged: 2, loops: 1, agentMs: null },
};

const activity = decodeOrgActivity(payload);

const body = (props: Partial<OrgActivityBodyProps>) =>
  render(
    <OrgActivityBody
      search={{}}
      now={now}
      activity={undefined}
      activityFailed={false}
      hourly={undefined}
      hourlyFailed={false}
      members={[]}
      onSearch={vi.fn()}
      onRetry={vi.fn()}
      onRetryHourly={vi.fn()}
      {...props}
    />,
  );

describe("OrgActivityBody", () => {
  it("shows the range presets with 30d selected by default", () => {
    body({});
    for (const preset of ["24h", "7d", "30d", "90d", "Custom"])
      expect(screen.getByRole("button", { name: preset })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "30d" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.getByRole("group", { name: "Machine" })).toBeTruthy();
  });

  it("shows loading skeletons before activity arrives", () => {
    body({});
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
  });

  it("renders the stats and contribution grid", () => {
    body({ activity });
    for (const label of [
      "Capy contribution",
      "Issues detected",
      "PRs contributed to",
      "PRs merged",
      "Feedback loops",
      "Agent hours",
    ])
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    expect(screen.getByText(/touches in the last 365 days/)).toBeTruthy();
    expect(
      screen.getByText("Pull requests merged with Capy vs without"),
    ).toBeTruthy();
  });

  it("shows the error state with a retry", () => {
    const onRetry = vi.fn();
    body({ activityFailed: true, onRetry });
    expect(screen.getByText("Could not load activity")).toBeTruthy();
    screen.getByRole("button", { name: "Retry" }).click();
    expect(onRetry).toHaveBeenCalled();
  });

  it("shows Capy's empty copy when nothing merged", () => {
    const quiet = decodeOrgActivity({
      ...payload,
      mergedAll: { current: 0, previous: 0 },
      loops: { current: 0, previous: 0 },
      agentMs: { current: 0, previous: 0 },
    });
    body({ activity: quiet });
    expect(
      screen.getByText("No pull requests merged in selected period"),
    ).toBeTruthy();
    expect(
      screen.getByText("No feedback loops in selected period"),
    ).toBeTruthy();
    expect(
      screen.getAllByText("No agent time in selected period").length,
    ).toBeGreaterThan(0);
  });
});

describe("decodeOrgActivity", () => {
  it("reads Capy's payload and survives junk", () => {
    expect(activity.merged.current).toBe(42);
    expect(activity.days).toHaveLength(2);
    expect(activity.loopDays?.[0]?.trigger).toBe("ci_failed");
    const empty = decodeOrgActivity(null);
    expect(empty.merged.current).toBe(0);
    expect(empty.loopDays).toBeNull();
    expect(empty.serviceUsers.loops).toBeNull();
  });
});

describe("contributionModel", () => {
  it("lays a year of days into week columns", () => {
    const model = contributionModel(activity, "UTC");
    expect(model.days).toHaveLength(365);
    expect(model.weeks).toBe(Math.ceil((365 + model.offset) / 7));
    expect(model.total).toBe(
      model.days.reduce((sum, day) => sum + day.total, 0),
    );
    expect(model.level(0)).toBe(0);
    expect(model.level(Math.max(...model.days.map((day) => day.total)))).toBe(
      4,
    );
    expect(model.monthLabels.filter(Boolean).length).toBeGreaterThanOrEqual(11);
  });
});

describe("member helpers", () => {
  it("reads members from a list or a page", () => {
    const rows = memberRowsFrom({
      items: [
        { userId: "u1", firstName: "Alex", lastName: "Morgan" },
        { nope: 1 },
      ],
    });
    expect(rows.map((row) => row.userId)).toEqual(["u1"]);
    const [first] = rows;
    expect(first !== undefined && memberDisplay(first).name).toBe(
      "Alex Morgan",
    );
    expect(memberDisplay({ userId: "u2", email: "sam@example.com" }).name).toBe(
      "sam@example.com",
    );
    expect(memberRowsFrom(undefined)).toEqual([]);
  });

  it("describes service users left out of member splits", () => {
    expect(
      serviceUsersNote({ count: 1, merged: 3, loops: 1, agentMs: null }),
    ).toBe(
      "Member splits leave out the API-key service user: 3 PRs merged, 1 feedback loop",
    );
    expect(
      serviceUsersNote({
        count: 2,
        merged: 1,
        loops: null,
        agentMs: 7_200_000,
      }),
    ).toBe(
      "Member splits leave out 2 API-key service users: 1 PR merged, 2.0h agent time",
    );
  });
});
