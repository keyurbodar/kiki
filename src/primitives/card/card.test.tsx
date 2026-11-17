import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardListHeader,
  CardTitle,
  cardVariants,
} from "./card";

const classOf = (element: Element) => element.className;

afterEach(cleanup);

it("keeps Capy's card variants and their class strings", () => {
  expect(cardVariants({})).toContain("flex flex-col overflow-clip");
  expect(cardVariants({})).toContain("bg-card");
  expect(cardVariants({ variant: "ghost" })).toBe(
    "flex flex-col overflow-clip bg-transparent rounded-(--radius-card)",
  );
  expect(cardVariants({ variant: "interactive" })).toContain(
    "cursor-pointer select-none transition-colors duration-hover hover:bg-card-hover",
  );
  expect(cardVariants({ variant: "panel" })).toContain(
    "md:rounded-(--radius-panel) md:border-hairline md:border-(--card-hairline) md:shadow-card",
  );
  expect(cardVariants({ rows: true })).toContain(
    "divide-y-hairline divide-border-1",
  );
  expect(cardVariants({ rows: false })).not.toContain("divide-y-hairline");
});

it("renders the card and its parts in Capy's slots", () => {
  render(
    <Card rows>
      <CardHeader>
        <CardTitle>Connections</CardTitle>
      </CardHeader>
      <CardContent>Body</CardContent>
      <CardFooter>Footer</CardFooter>
    </Card>,
  );
  const card = screen.getByText("Connections").closest("[data-slot=card]");
  expect(card).not.toBeNull();
  expect(classOf(card as Element)).toContain("divide-y-hairline");
  const slots = [
    [
      "card-header",
      "flex items-center gap-2 border-b-hairline border-border-1 px-4 py-3",
    ],
    ["card-title", "text-base font-medium text-foreground"],
    ["card-content", "p-4"],
    [
      "card-footer",
      "flex items-center justify-end gap-2 border-t-hairline border-border-1 px-4 py-3",
    ],
  ] as const;
  for (const [slot, classes] of slots) {
    const element = card?.querySelector(`[data-slot=${slot}]`);
    expect(element).not.toBeNull();
    expect(classOf(element as Element)).toContain(classes);
  }
});

it("keeps a caller className after the card variant classes", () => {
  render(<Card className="mt-2" variant="ghost" />);
  const className = classOf(
    document.querySelector("[data-slot=card]") as Element,
  );
  expect(className).toContain("bg-transparent");
  expect(className.indexOf("mt-2")).toBeGreaterThan(
    className.indexOf("bg-transparent"),
  );
});

it("renders children in the list header when it is used as a plain div", () => {
  render(<CardListHeader>Managed servers</CardListHeader>);
  const header = screen.getByText("Managed servers");
  expect(header.dataset.slot).toBe("card-list-header");
  expect(header.className).toContain(
    "flex min-h-15 items-center justify-between gap-3 py-3 pr-2 pl-4",
  );
});

it("opens the list header search from its button and clears it", () => {
  const onChange = vi.fn();
  render(
    <CardListHeader
      label="Servers"
      search={{ placeholder: "Search servers", value: "git", onChange }}
    />,
  );
  const input = screen.getByLabelText("Search servers");
  expect(input).toHaveProperty("value", "git");
  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(onChange).toHaveBeenCalledWith("");
});

it("shows the label and search trigger when no search text is entered", () => {
  const onChange = vi.fn();
  render(
    <CardListHeader
      label="Servers"
      search={{ placeholder: "Search servers", value: "", onChange }}
    />,
  );
  expect(screen.getByText("Servers")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Search servers" }));
  expect(screen.getByLabelText("Search servers")).toBeTruthy();
});
