import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  activeViewKey,
  defaultPageState,
  emptyFilters,
} from "@/features/automations/automations-page";
import {
  creatorChoices,
  filterChips,
  orderingChoices,
  pickCreator,
  pickSource,
  pickStatus,
  sourceChoices,
  statusChoices,
} from "./automations/automation-filters";
import { formatBytes, formatUsage } from "./drive/format-bytes";
import { MobileListEmpty } from "./list-states";

afterEach(cleanup);

describe("mobile drive sizes", () => {
  it("formats bytes the way the drive table does", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(95 * 1024)).toBe("95 KB");
    expect(formatBytes(226 * 1024 * 1024)).toBe("226 MB");
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe("2.0 GB");
  });

  it("labels usage and clamps the bar", () => {
    const usage = formatUsage(
      0.2 * 1024 * 1024 * 1024,
      10 * 1024 * 1024 * 1024,
    );
    expect(usage.label).toBe("0.2 GB of 10 GB");
    expect(usage.percent).toBe(2);
    expect(
      formatUsage(20 * 1024 * 1024 * 1024, 10 * 1024 * 1024 * 1024).percent,
    ).toBe(100);
  });
});

describe("mobile automation filters", () => {
  it("reads the applied axes back as chips", () => {
    expect(filterChips({ ...emptyFilters, creators: null }, "Alex")).toEqual([
      { key: "creator", property: "Creator", value: "Me" },
    ]);
    expect(filterChips({ ...emptyFilters, status: "disabled" }, "A")).toEqual([
      { key: "status", property: "Status", value: "Disabled" },
    ]);
  });

  it("marks the current choice in each drawer", () => {
    const mine = { ...emptyFilters, creators: null, status: "active" };
    expect(
      creatorChoices(mine, "Alex").map((choice) => choice.checked),
    ).toEqual([true, false]);
    expect(statusChoices(mine).map((choice) => choice.checked)).toEqual([
      true,
      false,
    ]);
    expect(
      sourceChoices({ ...mine, sources: ["slack"] }).find(
        (choice) => choice.key === "slack",
      )?.checked,
    ).toBe(true);
    expect(orderingChoices("name").map((choice) => choice.checked)).toEqual([
      false,
      false,
      true,
    ]);
  });

  it("toggles a filter off when it is picked again", () => {
    const mine = pickCreator(emptyFilters, "me");
    expect(mine.creators).toBeNull();
    expect(pickCreator(mine, "anyone").creators).toEqual([]);
    const active = pickStatus(emptyFilters, "active");
    expect(active.status).toBe("active");
    expect(pickStatus(active, "active").status).toBeNull();
    const slack = pickSource(emptyFilters, "slack");
    expect(slack.sources).toEqual(["slack"]);
    expect(pickSource(slack, "slack").sources).toEqual([]);
  });

  it("keeps the default view active until a filter changes", () => {
    expect(activeViewKey(defaultPageState)).toBe("mine");
    expect(
      activeViewKey({
        ...defaultPageState,
        filters: { ...emptyFilters, status: "active" },
      }),
    ).toBeUndefined();
  });
});

describe("mobile list empty state", () => {
  it("renders Capy's line, sub and action", () => {
    render(
      <MobileListEmpty
        line="No featured plugins yet"
        sub="Newly listed plugins appear here"
        action={{ label: "Clear search", onClick: () => {} }}
      />,
    );
    expect(screen.getByText("No featured plugins yet")).toBeTruthy();
    expect(screen.getByText("Newly listed plugins appear here")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Clear search" })).toBeTruthy();
  });
});
