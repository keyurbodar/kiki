import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FilesBand } from "./files-band";

afterEach(() => {
  document.body.innerHTML = "";
});

const renderBand = (focus?: "search" | "drive") => {
  const onFocus = vi.fn();
  const view = render(
    <FilesBand
      query=""
      onQueryChange={() => undefined}
      count={0}
      highlighted={0}
      onHighlight={() => undefined}
      onOpenHighlighted={() => undefined}
      focus={focus}
      onFocus={onFocus}
      filter="all"
      onFilter={() => undefined}
    />,
  );
  const input = view.container.querySelector("input");
  return { input, onFocus, view };
};

describe("files search band", () => {
  it("takes focus when the pane was opened for a search", () => {
    const { input, onFocus } = renderBand("search");
    expect(document.activeElement).toBe(input);
    // The intent is spent once it is used, so the next ask can arrive again.
    expect(onFocus).toHaveBeenCalledWith(undefined);
  });

  it("leaves focus alone when the pane was opened any other way", () => {
    const { input, onFocus } = renderBand();
    expect(document.activeElement).not.toBe(input);
    expect(onFocus).not.toHaveBeenCalled();
  });

  it("prints the shortcut table's own binding beside the field", () => {
    const { view } = renderBand();
    expect(view.container.textContent).toContain("P");
  });
});
