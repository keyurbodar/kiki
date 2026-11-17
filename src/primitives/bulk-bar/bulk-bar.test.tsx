import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { BulkBar, BulkBarAction, BulkBarLabel } from "@/primitives/bulk-bar";

afterEach(cleanup);

it("shows the count and clears the selection", () => {
  const onClear = vi.fn();
  render(
    <BulkBar count={3} onClear={onClear}>
      <button type="button">Archive</button>
    </BulkBar>,
  );
  expect(screen.getByText("3 selected")).toBeTruthy();
  const clear = screen.getByRole("button", { name: "Clear selection" });
  expect(clear.querySelector("[data-icon=cross-medium]")).not.toBeNull();
  fireEvent.click(clear);
  expect(onClear).toHaveBeenCalledOnce();
  const bar = screen.getByText("3 selected").closest("[data-slot=bulk-bar]");
  expect(bar?.className).toContain("@container/bulk");
  expect(screen.getByRole("button", { name: "Archive" })).toBeTruthy();
});

it("keeps a disabled action reachable for its tooltip", () => {
  render(
    <>
      <BulkBarAction label="Delete" disabled>
        <button type="button" disabled>
          Delete
        </button>
      </BulkBarAction>
      <BulkBarAction label="Move">
        <button type="button">Move</button>
      </BulkBarAction>
    </>,
  );
  const disabled = screen.getByRole("button", { name: "Delete" });
  expect(disabled.parentElement?.tagName).toBe("SPAN");
  expect(disabled.parentElement?.dataset.slot).toBe("tooltip-trigger");
  expect(screen.getByRole("button", { name: "Move" }).dataset.slot).toBe(
    "tooltip-trigger",
  );
});

it("collapses action labels at the chosen container width", () => {
  render(
    <>
      <BulkBarLabel>Narrow</BulkBarLabel>
      <BulkBarLabel collapseAt="xl">Wide</BulkBarLabel>
    </>,
  );
  expect(screen.getByText("Narrow").className).toBe("@max-lg/bulk:hidden");
  expect(screen.getByText("Wide").className).toBe("@max-xl/bulk:hidden");
});
