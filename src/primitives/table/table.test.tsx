import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SortableTableHeaderCell,
  Table,
  TableActionRow,
  TableCell,
  TableGroup,
  TableHeader,
  TableHeaderCell,
  TableRow,
  tableColumns,
} from "@/primitives/table";

afterEach(cleanup);

describe("tableColumns", () => {
  it("floors zero-minimum tracks, the first with the lead minimum", () => {
    expect(tableColumns("minmax(0,1fr) minmax(0px, 2fr) auto")).toBe(
      "minmax(var(--table-lead-min),1fr) minmax(var(--table-fluid-min), 2fr) auto",
    );
  });

  it("expands repeat() before rewriting tracks", () => {
    expect(tableColumns("auto repeat(2, minmax(0,1fr))")).toBe(
      "auto minmax(var(--table-fluid-min),1fr) minmax(var(--table-fluid-min),1fr)",
    );
  });

  it("lets fixed-minimum auto tracks relax on narrow screens", () => {
    expect(tableColumns("minmax(6rem, auto) 1fr")).toBe(
      "minmax(var(--table-auto-min,6rem),auto) 1fr",
    );
  });

  it("returns templates it cannot tokenise unchanged", () => {
    expect(tableColumns("minmax(0,1fr) (broken")).toBe("minmax(0,1fr) (broken");
    expect(tableColumns("auto 1fr auto")).toBe("auto 1fr auto");
  });
});

describe("Table", () => {
  it("lays rows out on the columns grid with the density row height", () => {
    render(
      <Table columns="auto minmax(0,1fr)" density="compact">
        <TableRow>
          <TableCell lead>Name</TableCell>
          <TableCell numeric>3</TableCell>
        </TableRow>
      </Table>,
    );
    const table = screen.getByRole("table");
    expect(table.dataset.slot).toBe("table");
    expect(table.style.gridTemplateColumns).toBe(
      "auto minmax(var(--table-fluid-min),1fr)",
    );
    expect(table.className).toContain("[--table-row-h:2rem]");
    expect(table.className).not.toContain("[--table-row-h:3.125rem]");
    expect(table.hasAttribute("data-pin-lead")).toBe(false);
    expect(screen.getByText("Name").className).toContain("text-foreground");
    expect(screen.getByText("3").className).toContain("justify-end");
  });

  it("marks itself scrolled while scrolled sideways and forwards onScroll", () => {
    const onScroll = vi.fn();
    render(<Table pinLead onScroll={onScroll} />);
    const table = screen.getByRole("table");
    expect(table.dataset.pinLead).toBe("true");
    table.scrollLeft = 40;
    fireEvent.scroll(table);
    expect(table.hasAttribute("data-scrolled")).toBe(true);
    table.scrollLeft = 0;
    fireEvent.scroll(table);
    expect(table.hasAttribute("data-scrolled")).toBe(false);
    expect(onScroll).toHaveBeenCalledTimes(2);
  });

  it("fills header rows and drops group bands inside a card", () => {
    render(
      <Table card cardClassName="extra">
        <TableHeader>
          <TableHeaderCell>Head</TableHeaderCell>
        </TableHeader>
        <TableGroup label="Group" count={2} />
      </Table>,
    );
    const table = screen.getByRole("table");
    expect(table.parentElement?.dataset.slot).toBe("card");
    expect(table.parentElement?.className).toContain("extra");
    const [header, group] = screen.getAllByRole("row") as [
      HTMLElement,
      HTMLElement,
    ];
    expect(header.className).toContain("before:bg-section");
    expect(group.className).toContain("mt-2");
    expect(group.querySelector(".bg-section")).toBeNull();
  });

  it("leaves headers unfilled outside a card unless asked", () => {
    render(
      <Table>
        <TableHeader>
          <TableHeaderCell>Plain</TableHeaderCell>
        </TableHeader>
        <TableHeader filled>
          <TableHeaderCell>Filled</TableHeaderCell>
        </TableHeader>
        <TableGroup label="Group" count={4} />
      </Table>,
    );
    const [plain, filled, group] = screen.getAllByRole("row") as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    expect(plain.className).not.toContain("before:bg-section");
    expect(filled.className).toContain("before:bg-section");
    expect(group.querySelector(".bg-section")).not.toBeNull();
    expect(screen.getByText("4").className).toContain("tabular-nums");
  });
});

describe("Table flush", () => {
  it("drops the gutter and narrow-screen floors instead of overriding them", () => {
    render(
      <>
        <Table aria-label="padded" />
        <Table aria-label="flush" flush />
      </>,
    );
    const padded = screen.getByRole("table", { name: "padded" }).className;
    const flush = screen.getByRole("table", { name: "flush" }).className;
    expect(padded).toContain("px-4");
    expect(padded).toContain("max-md:[--table-fluid-min:8rem]");
    expect(flush).not.toContain("px-");
    expect(flush).not.toContain("max-md:[--table-fluid-min:8rem]");
    expect(flush).toContain("scroll-fade-x");
  });
});

describe("TableHeaderCell", () => {
  it("shows the sort arrow only when sorted", () => {
    render(
      <>
        <TableHeaderCell>Plain</TableHeaderCell>
        <TableHeaderCell sorted>Sorted</TableHeaderCell>
      </>,
    );
    expect(screen.getByText("Plain").querySelector("svg")).toBeNull();
    expect(screen.getByText("Sorted").querySelector("svg")?.dataset.icon).toBe(
      "arrow-down",
    );
  });
});

describe("SortableTableHeaderCell", () => {
  it("reports its direction and flips the arrow when ascending", () => {
    const onSort = vi.fn();
    render(
      <>
        <SortableTableHeaderCell onSort={onSort}>Name</SortableTableHeaderCell>
        <SortableTableHeaderCell direction="ascending">
          Age
        </SortableTableHeaderCell>
        <SortableTableHeaderCell direction="descending">
          Size
        </SortableTableHeaderCell>
      </>,
    );
    const [name, age, size] = screen.getAllByRole("columnheader") as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    expect(name.getAttribute("aria-sort")).toBe("none");
    expect(name.querySelector("svg")).toBeNull();
    expect(age.getAttribute("aria-sort")).toBe("ascending");
    expect(age.querySelector("svg")?.getAttribute("class")).toContain(
      "rotate-180",
    );
    expect(size.querySelector("svg")?.getAttribute("class")).not.toContain(
      "rotate-180",
    );
    fireEvent.click(screen.getByRole("button", { name: "Name" }));
    expect(onSort).toHaveBeenCalledOnce();
  });
});

describe("TableRow", () => {
  it("draws the hover band unless the row is static", () => {
    render(
      <>
        <TableRow>
          <TableCell>a</TableCell>
        </TableRow>
        <TableRow interactive={false}>
          <TableCell>b</TableCell>
        </TableRow>
      </>,
    );
    const [hover, plain] = screen.getAllByRole("row") as [
      HTMLElement,
      HTMLElement,
    ];
    expect(hover.className).toContain("hover:before:bg-section");
    expect(plain.className).not.toContain("hover:before:bg-section");
  });
});

async function inRouter(node: ReactNode) {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => node }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await act(() => router.load());
  render(<RouterProvider router={router} />);
}

describe("TableActionRow", () => {
  it("is a button with the icon, the label and a chevron", () => {
    const onClick = vi.fn();
    render(
      <TableActionRow icon={<span data-testid="icon" />} onClick={onClick}>
        Add project
      </TableActionRow>,
    );
    const button = screen.getByRole("button", { name: "Add project" });
    expect(button.getAttribute("type")).toBe("button");
    expect(screen.getByTestId("icon")).toBeTruthy();
    expect(
      button.querySelector("[data-icon=chevron-right-small]"),
    ).not.toBeNull();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders as a router link when given a destination", async () => {
    await inRouter(
      <TableActionRow to="/settings/general">Open settings</TableActionRow>,
    );
    const link = await screen.findByRole("link", { name: "Open settings" });
    expect(link.getAttribute("href")).toBe("/settings/general");
    expect(link.hasAttribute("type")).toBe(false);
  });
});
