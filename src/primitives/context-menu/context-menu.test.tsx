import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { MenuItem } from "@/primitives/menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "./context-menu";

afterEach(cleanup);

it("renders Capy's context menu slots around a menu list", () => {
  render(
    <ContextMenu open>
      <ContextMenuTrigger>Row</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <MenuItem>Open</MenuItem>
      </ContextMenuContent>
    </ContextMenu>,
  );
  expect(screen.getByText("Row").dataset.slot).toBe("context-menu-trigger");
  const content = document.querySelector<HTMLElement>(
    "[data-slot=context-menu-content]",
  );
  expect(content?.className).toContain("min-w-32");
  expect(content?.className).toContain("w-56");
  expect(content?.className).toContain(
    "max-h-[min(60dvh,var(--available-height))]",
  );
  expect(content?.firstElementChild?.hasAttribute("data-menu-list")).toBe(true);
  expect(screen.getByText("Open").dataset.slot).toBe("menu-item");
});
