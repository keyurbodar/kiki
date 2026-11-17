import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SelectorMenuList } from "./selector-menu-list";

afterEach(cleanup);

describe("SelectorMenuList", () => {
  it("renders the search slot, the scrolling list and an optional footer", () => {
    const { rerender } = render(
      <SelectorMenuList search={<input aria-label="Search" />}>
        <span>row</span>
      </SelectorMenuList>,
    );
    const list = screen.getByText("row").parentElement;
    expect(list?.dataset.slot).toBe("selector-menu-list");
    expect(list?.dataset.menuList).toBe("true");
    expect(
      list?.previousElementSibling?.contains(screen.getByLabelText("Search")),
    ).toBe(true);
    expect(list?.nextElementSibling).toBeNull();

    rerender(
      <SelectorMenuList footer={<span>footer</span>}>
        <span>row</span>
      </SelectorMenuList>,
    );
    expect(screen.getByText("footer").parentElement?.className).toContain(
      "sticky bottom-0",
    );
  });
});
