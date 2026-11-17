import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Pager } from "./theme-browse";

afterEach(cleanup);

it("renders nothing for a single page", () => {
  const { container } = render(
    <Pager current={1} pages={1} onPage={() => {}} />,
  );
  expect(container.innerHTML).toBe("");
});

it("steps between pages and disables the ends", () => {
  const onPage = vi.fn();
  render(<Pager current={1} pages={3} onPage={onPage} />);
  expect(
    screen.getByRole("navigation", { name: "Theme pages" }).textContent,
  ).toContain("1 of 3");
  expect(screen.getByRole("button", { name: "Previous" })).toHaveProperty(
    "disabled",
    true,
  );
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(onPage).toHaveBeenCalledWith(2);
});
