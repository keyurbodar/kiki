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
