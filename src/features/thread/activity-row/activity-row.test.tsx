import { RegistryContext } from "@effect/atom-react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen } from "@testing-library/react";
import type { Schema } from "effect";
import { AtomRegistry } from "effect/reactivity";
import { afterEach, expect, it } from "vitest";
import type { ActivityRow as ActivityRowSchema } from "@/data/events";
import { threads } from "@/data/mocks/fixtures/world";
import { ActivityRow } from "./activity-row";

type ActivityRowData = Schema.Schema.Type<typeof ActivityRowSchema>;

afterEach(cleanup);

const at = (ms: number) => new Date(Date.UTC(2026, 0, 1, 12, 0, 0) + ms);

const toolRow = (over: Record<string, unknown> = {}) =>
  ({
    id: "toolu_1",
    eventId: "01JAAAAAAAAAAAAAAAAAAAAAAA",
    createdAt: at(0),
    type: "activity",
    kind: "tool",
    toolName: "bash",
    args: { command: "bun test" },
    phase: "done",
    turnOpen: false,
    turnCloses: false,
    startedAt: at(0),
    result: {
      blocks: [{ type: "text", text: "42 pass" }],
      isError: false,
      settledAt: at(2_400),
    },
    ...over,
  }) as unknown as ActivityRowData;

it("shows how long a settled call ran beside its label", () => {
  const { container } = render(<ActivityRow row={toolRow()} />);
  expect(container.textContent).toContain("3s");
});

it("draws one chevron on a row that opens a panel", () => {
  const { container } = render(<ActivityRow row={toolRow()} />);
  const trigger = container.querySelector("[data-slot=collapsible-trigger]");
  expect(trigger).not.toBeNull();
  expect(trigger?.querySelectorAll("svg").length).toBe(1);
});

it("keeps the clock on a row that has no panel to open", () => {
  const { container } = render(
    <ActivityRow
      row={toolRow({
        args: {},
        result: { blocks: [], isError: false, settledAt: at(2_400) },
      })}
    />,
  );
  expect(container.querySelector("[data-slot=collapsible-trigger]")).toBeNull();
  expect(container.textContent).toContain("3s");
});

it("keeps a row without a panel static and chevronless", () => {
  const { container } = render(
    <ActivityRow row={toolRow({ args: {}, result: undefined })} />,
  );
  expect(container.querySelector("[data-slot=collapsible-trigger]")).toBeNull();
  expect(container.querySelectorAll("svg").length).toBe(0);
});

const renderRow = async (row: ActivityRowData) => {
  const registry = AtomRegistry.make();
  const root = createRootRoute({ component: () => <ActivityRow row={row} /> });
  const router = createRouter({
    routeTree: root,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  const { container } = render(
    <RegistryContext.Provider value={registry}>
      <RouterProvider router={router} />
    </RegistryContext.Provider>,
  );
  await router.load();
  return container;
};

it("links a tool row whose args name a thread to that thread", async () => {
  const container = await renderRow(
    toolRow({ args: { params: { jamId: threads.darkMode.id } } }),
  );
  const chip = await screen.findByRole("link", {
    name: new RegExp(threads.darkMode.title),
  });
  expect(chip.getAttribute("href")).toBe(`/thread/${threads.darkMode.id}`);
  expect(chip.textContent).toBe(threads.darkMode.title);
  const head = container.querySelector('[data-slot="activity-row-head"]');
  expect(head?.children).toHaveLength(3);
});

it("renders no reference at all on a tool row whose args name nothing", () => {
  const { container } = render(
    <ActivityRow
      row={toolRow({ args: { command: "bun test" }, result: undefined })}
    />,
  );
  expect(container.querySelector('[data-slot="tool-refs"]')).toBeNull();
  expect(container.querySelectorAll("a")).toHaveLength(0);
  const head = container.querySelector('[data-slot="activity-row-head"]');
  expect(head?.children).toHaveLength(1);
});
