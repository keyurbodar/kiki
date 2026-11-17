import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Badge, badgeVariants } from "./badge";

afterEach(cleanup);

describe("Badge", () => {
  it("renders a static badge as a div with the default variants", () => {
    render(<Badge>Beta</Badge>);
    const badge = screen.getByText("Beta");
    expect(badge.tagName).toBe("DIV");
    expect(badge.dataset.slot).toBe("badge");
    expect(badge.className).toContain("h-(--h-badge-base)");
    expect(badge.className).toContain("select-none");
  });

  it("adds the intent glyph for status colours with text children", () => {
    const { container } = render(<Badge color="success">Live</Badge>);
    expect(
      container.querySelector('[data-icon="circle-check"]'),
    ).not.toBeNull();
  });

  it("skips the glyph when asked, for count badges and without a colour", () => {
    const { container } = render(
      <>
        <Badge color="danger" glyph={false}>
          Off
        </Badge>
        <Badge color="info" size="count">
          4
        </Badge>
        <Badge>Plain</Badge>
      </>,
    );
    expect(container.querySelector("[data-icon]")).toBeNull();
    expect(screen.getByText("4").tagName).toBe("SPAN");
  });

  it("renders a button when clickable", () => {
    const onClick = vi.fn();
    render(<Badge onClick={onClick}>Filter</Badge>);
    const badge = screen.getByRole("button", { name: "Filter" });
    expect(badge.dataset.slot).toBe("badge");
    expect(badge.className).toContain("cursor-pointer");
    fireEvent.click(badge);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("maps every variant and size key", () => {
    expect(badgeVariants({ variant: "filled", size: "xs" })).toContain(
      "h-(--h-badge-xs)",
    );
    expect(badgeVariants({ variant: "ghost", size: "auto" })).toContain(
      "bg-transparent",
    );
  });
});
