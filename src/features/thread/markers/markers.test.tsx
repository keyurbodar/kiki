import { cleanup, render } from "@testing-library/react";
import type { Schema } from "effect";
import { afterEach, expect, it } from "vitest";
import type { MarkerRow as MarkerRowSchema } from "@/data/events";
import { MarkerDivider, WaitingMarker } from "./markers";

type MarkerRowData = Schema.Schema.Type<typeof MarkerRowSchema>;

afterEach(cleanup);

const marker = (over: Record<string, unknown> = {}) =>
  ({
    id: "m1",
    eventId: "01JAAAAAAAAAAAAAAAAAAAAAAA",
    createdAt: new Date(Date.UTC(2026, 0, 1, 12, 0, 0)),
    type: "marker",
    kind: "retry",
    label: "Keyur retried",
    actor: { type: "user", userId: "user_1" },
    ...over,
  }) as unknown as MarkerRowData;

it("draws a retry marker as a rule, an icon and a truncating label", () => {
  const { container } = render(<MarkerDivider row={marker()} />);
  const row = container.firstElementChild as HTMLElement;
  expect(row.className).toContain("min-h-7");
  expect(row.className).toContain("gap-3");
  expect(row.querySelectorAll("svg[data-icon]").length).toBe(1);
  const truncating = [...row.querySelectorAll("span")].filter(
    (el) =>
      el.textContent === "Keyur retried" && el.className.includes("truncate"),
  );
  expect(truncating.length).toBe(1);
});

it("leads the waiting marker with a 3x3 dot grid in the primary ink", () => {
  const { container } = render(<WaitingMarker needsYou enter />);
  const svg = container.querySelector("svg.dot-grid");
  expect(svg).not.toBeNull();
  expect(svg?.getAttribute("class")).toContain("text-primary-ink");
  expect(svg?.querySelectorAll("circle").length).toBe(9);
  expect(container.textContent).toContain("Needs you");
});

it("fades the waiting marker in with the capture's motion classes", () => {
  const { container } = render(<WaitingMarker needsYou enter />);
  const line = container.querySelector("[data-slot=waiting-marker] > span");
  expect(line?.className).toContain("motion-safe:starting:opacity-0");
  expect(line?.className).toContain("motion-safe:duration-waiting-in");
});
