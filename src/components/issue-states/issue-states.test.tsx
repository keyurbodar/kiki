import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/primitives/tooltip";
import { IssueColorSwatchPicker } from "./issue-states";

afterEach(cleanup);

it("marks the current colour and reports a new pick", () => {
  const onChange = vi.fn();
  render(
    <TooltipProvider>
      <IssueColorSwatchPicker value="blue" onChange={onChange} />
    </TooltipProvider>,
  );
  const radios = screen.getAllByRole("radio");
  expect(radios).toHaveLength(9);
  expect(screen.getByLabelText("Blue").getAttribute("aria-checked")).toBe(
    "true",
  );
  fireEvent.click(screen.getByLabelText("Lime"));
  expect(onChange).toHaveBeenCalledWith("lime");
});
