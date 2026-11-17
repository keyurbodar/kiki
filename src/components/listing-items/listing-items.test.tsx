import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CountedList, countedListLabel, ItemRow } from "./listing-items";

afterEach(cleanup);

const items = Array.from({ length: 7 }, (_, index) => ({
  name: `Item ${index + 1}`,
  trailing: `${index + 1}`,
}));

it("pluralises the counted label", () => {
  expect(countedListLabel(1, "server")).toBe("1 server");
  expect(countedListLabel(4, "server")).toBe("4 servers");
});

it("renders nothing for an empty list", () => {
  const { container } = render(<CountedList noun="server" items={[]} />);
  expect(container.innerHTML).toBe("");
});

it("shows the limit then expands and collapses", () => {
  render(<CountedList noun="server" items={items} limit={5} />);
  expect(screen.getByText("7 servers")).toBeTruthy();
  expect(screen.queryByText("Item 6")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "View 2 more" }));
  expect(screen.getByText("Item 6")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Show less" }));
  expect(screen.queryByText("Item 6")).toBeNull();
});

it("hides the toggle when everything fits", () => {
  render(<CountedList noun="server" items={items.slice(0, 3)} limit={5} />);
  expect(screen.queryByRole("button")).toBeNull();
});

it("opens the detail dialog from a row that has one", () => {
  render(
    <ItemRow item={{ name: "Retry policy", detail: <p>Retries twice.</p> }} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Retry policy" }));
  expect(screen.getByText("Retries twice.")).toBeTruthy();
});

it("does not make a row without a detail clickable", () => {
  render(<ItemRow item={{ name: "Retry policy" }} />);
  const onClick = vi.fn();
  expect(screen.queryByRole("button")).toBeNull();
  expect(onClick).not.toHaveBeenCalled();
});
