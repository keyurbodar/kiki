import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FilterChipBar } from "./view-toolbar";

afterEach(cleanup);

const bar = (dirty: boolean, onSave?: () => void) => (
  <FilterChipBar chips={[]} dirty={dirty} onClear={() => {}} onSave={onSave} />
);

describe("the filter chip bar", () => {
  it("offers neither Clear nor Save while the filters match the view", () => {
    render(bar(false, () => {}));
    expect(screen.queryByText("Clear")).toBeNull();
    expect(screen.queryByText("Save")).toBeNull();
  });

  it("offers Clear once the filters differ from the view", () => {
    render(bar(true));
    expect(screen.getByText("Clear")).toBeTruthy();
    expect(screen.queryByText("Save")).toBeNull();
  });

  it("offers Save only when the view can be saved", () => {
    render(bar(true, () => {}));
    expect(screen.getByText("Clear")).toBeTruthy();
    expect(screen.getByText("Save")).toBeTruthy();
  });
});
