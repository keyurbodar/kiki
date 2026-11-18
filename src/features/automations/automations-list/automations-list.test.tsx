import { RegistryProvider } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { AutomationRow } from "./automation";
import {
  type AutomationListSection,
  AutomationsList,
  type AutomationsListProps,
  type StandingThread,
} from "./automations-list";

afterEach(cleanup);

const base = new Date("2026-01-01T00:00:00Z");

const row = (
  id: string,
  name: string,
  overrides: Partial<AutomationRow> = {},
): AutomationRow => ({
  id,
  projectId: "proj_1",
  name,
  description: null,
  triggers: [{ type: "schedule", cron: "0 2 * * *", timezone: "UTC" }],
  enabled: true,
  creatorUserId: "user_1",
  creator: "Alex Morgan",
  singleJamId: null,
  lastTriggeredAt: null,
  createdAt: base,
  updatedAt: base,
  ...overrides,
});

const sections: ReadonlyArray<AutomationListSection> = [
  {
    id: "active",
    label: "Active",
    members: [row("auto_active", "Nightly check")],
  },
  {
    id: "disabled",
    label: "Disabled",
    members: [
      row("auto_disabled", "Follow up on merged PRs", { enabled: false }),
    ],
  },
];

const props: AutomationsListProps = {
  sections,
  now: base.getTime(),
  selectedId: null,
  onSelect: () => {},
  checked: new Set<string>(),
  onCheckedChange: () => {},
  onDelete: () => {},
  emptyText: "No automations yet",
  orgId: "org_1",
  standingThreads: new Map<string, StandingThread>(),
};

function renderList(node: ReactNode = <AutomationsList {...props} />) {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => node }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(
    <RegistryProvider>
      <RouterProvider router={router} />
    </RegistryProvider>,
  );
}

const sectionRoots = () => [
  ...document.querySelectorAll("[data-slot=collapsible]"),
];

const sectionOf = (label: string) =>
  sectionRoots().find((root) => root.textContent?.startsWith(label));

const headerOf = (label: string) =>
  sectionOf(label)?.querySelector("[data-slot=collapsible-trigger]") ?? null;

const panelOf = (label: string) =>
  sectionOf(label)?.querySelector("[data-slot=collapsible-panel]") ?? null;

describe("AutomationsList sections", () => {
  it("wraps every section in Capy's collapsible", async () => {
    renderList();
    await waitFor(() => expect(sectionRoots()).toHaveLength(2));
    expect(
      sectionRoots().map((root) =>
        root.textContent?.startsWith("Active") ? "active" : "disabled",
      ),
    ).toEqual(["active", "disabled"]);
    for (const section of sections) {
      expect(headerOf(section.label)?.textContent).toBe(
        `${section.label}${section.members.length}`,
      );
      expect(panelOf(section.label)?.textContent).toContain(
        section.members[0]?.name,
      );
    }
  });

  it("opens every section by default with one chevron in the header", async () => {
    renderList();
    const header = await waitFor(() => {
      const found = headerOf("Active");
      if (found === null) throw new Error("no content header");
      return found;
    });
    expect(header.getAttribute("aria-expanded")).toBe("true");
    expect(header.querySelectorAll("svg")).toHaveLength(1);
    expect(header.className).toContain("w-full");
    expect(header.className).toContain("bg-section");
    expect(panelOf("Active")?.textContent).toContain("Nightly check");
  });

  it("collapses a section from its header and reopens it", async () => {
    renderList();
    const header = await waitFor(() => {
      const found = headerOf("Disabled");
      if (found === null) throw new Error("no disabled header");
      return found;
    });

    fireEvent.click(header);
    await waitFor(() =>
      expect(header.getAttribute("aria-expanded")).toBe("false"),
    );
    expect(panelOf("Disabled")).toBeNull();

    fireEvent.click(header);
    await waitFor(() =>
      expect(panelOf("Disabled")?.textContent).toContain(
        "Follow up on merged PRs",
      ),
    );
  });

  it("keeps Capy's Active then Disabled order", async () => {
    renderList();
    await waitFor(() => expect(sectionRoots()).toHaveLength(2));
    expect(
      sectionRoots().map((root) =>
        root
          .querySelector("[data-slot=collapsible-trigger]")
          ?.textContent?.replace(/\d+$/, ""),
      ),
    ).toEqual(["Active", "Disabled"]);
  });
});

describe("AutomationsList standing thread", () => {
  it("labels the standing thread with its code", async () => {
    renderList(
      <AutomationsList
        {...props}
        sections={[
          {
            id: "active",
            label: "Active",
            members: [
              row("auto_standing", "Flake watch", { singleJamId: "jam_1" }),
            ],
          },
        ]}
        standingThreads={
          new Map<string, StandingThread>([
            ["jam_1", { code: "WEB-41", status: "waiting" }],
          ])
        }
      />,
    );
    const chip = await waitFor(() => {
      const found = document.querySelector("button[data-slot=badge]");
      if (found === null) throw new Error("no standing thread chip");
      return found;
    });
    expect(chip.getAttribute("aria-label")).toBe("Runs in WEB-41, open thread");
    expect(chip.textContent).toBe("WEB-41");
  });
});
