import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { WorkGroup } from "./work-group";

afterEach(cleanup);

const at = (ms: number) => new Date(Date.UTC(2026, 0, 1, 12, 0, 0) + ms);

const row = (live: boolean, expanded = false) =>
  ({
    id: "wg1",
    eventId: "01JAAAAAAAAAAAAAAAAAAAAAAA",
    createdAt: at(0),
    type: "work-group",
    activeMs: 247_000,
    failures: 1,
    chunks: [],
    live,
    expanded,
    entries: [
      {
        id: "a1",
        eventId: "01JAAAAAAAAAAAAAAAAAAAAAAA",
        createdAt: at(0),
        type: "activity",
        kind: "text",
        text: "Looking at the settings page.",
        turnOpen: false,
        turnCloses: false,
      },
    ],
  }) as unknown as Parameters<typeof WorkGroup>[0]["row"];

it("labels a settled group with its active time and failures", () => {
  render(<WorkGroup row={row(false)} />);
  const button = screen.getByRole("button");
  expect(button.textContent).toContain("Worked");
  expect(button.textContent).toContain("4m 7s");
  expect(button.textContent).toContain(", 1 failed");
  expect(button.getAttribute("aria-expanded")).toBe("false");
});

it("expands to show its entries", () => {
  const { container } = render(<WorkGroup row={row(false)} />);
  expect(container.textContent).not.toContain("Looking at the settings page.");
  fireEvent.click(screen.getByRole("button"));
  expect(screen.getByRole("button").getAttribute("aria-expanded")).toBe("true");
  expect(container.textContent).toContain("Looking at the settings page.");
});

it("lays its label out as one truncating line with the clock beside it", () => {
  const { container } = render(<WorkGroup row={row(false)} />);
  expect(container.querySelector("[data-slot=live-status]")).toBeNull();
  const head = container.querySelector("button > span");
  expect(head?.className).toContain("items-baseline");
  expect(head?.firstElementChild?.className).toContain("truncate");
  expect(head?.lastElementChild?.className).toContain("whitespace-pre");
});

it("shows the live tail and a working shimmer while live", () => {
  const { container } = render(<WorkGroup row={row(true)} />);
  expect(screen.getByRole("button").textContent).toContain("Working");
  expect(
    container
      .querySelector('[data-slot="shimmer-text"]')
      ?.getAttribute("data-state"),
  ).toBe("live");
  expect(container.textContent).toContain("Looking at the settings page.");
});

const notice = (index: number, notificationKey: string, summary: string) =>
  ({
    id: `u${index}`,
    eventId: "01JAAAAAAAAAAAAAAAAAAAAAAA",
    createdAt: at(index),
    type: "update",
    kind: "notice",
    notificationKey,
    summary,
  }) as unknown as NonNullable<
    Parameters<typeof WorkGroup>[0]["row"]["entries"][number]
  >;

const withEntries = (
  entries: ReadonlyArray<ReturnType<typeof notice>>,
  failures = 0,
) =>
  ({
    ...row(false),
    failures,
    entries: [...row(false).entries, ...entries],
  }) as unknown as Parameters<typeof WorkGroup>[0]["row"];

it("aggregates a run of issue activity into one phrase", () => {
  render(
    <WorkGroup
      row={withEntries([
        notice(1, "issue_activity", "KIKI-4 updated AMA-146"),
        notice(2, "issue_activity", "KIKI-4 updated AMA-147"),
        notice(3, "issue_activity", "KIKI-4 updated AMA-148"),
        notice(4, "issue_activity", "KIKI-4 updated AMA-149"),
      ])}
    />,
  );
  const text = screen.getByRole("button").textContent ?? "";
  expect(text).toContain("4 issue updates,worked");
  expect(text).not.toContain("AMA-146");
});

it("keeps a notice's own phrase and the failure tail in order", () => {
  render(
    <WorkGroup
      row={withEntries(
        [
          notice(1, "issue_activity", "KIKI-4 updated AMA-146"),
          notice(2, "issue_activity", "KIKI-4 updated AMA-147"),
          notice(3, "ci_result", "review of PR #446 failed"),
        ],
        1,
      )}
    />,
  );
  const text = screen.getByRole("button").textContent ?? "";
  expect(text).toContain(
    "2 issue updates, review of PR #446 failed,worked for 4m 7s, 1 failed",
  );
});

it("says one issue update for a single row", () => {
  render(<WorkGroup row={withEntries([notice(1, "issue_activity", "a")])} />);
  expect(screen.getByRole("button").textContent).toContain("1 issue update,worked");
});

it("leaves a group with no notices on its plain label", () => {
  render(<WorkGroup row={row(false)} />);
  expect(screen.getByRole("button").textContent).toContain("Worked for 4m 7s");
});
