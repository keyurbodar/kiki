import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarkdownDiff } from "./markdown-diff";

const file = {
  path: "src/docs/guide.md",
  kind: "modified" as const,
  additions: 4,
  deletions: 2,
};

describe("MarkdownDiff", () => {
  it("renders the patchless header and toggles collapse", () => {
    const onCollapsedChange = vi.fn();
    render(
      <MarkdownDiff
        file={file}
        rendered
        onRenderedChange={vi.fn()}
        collapsed={false}
        onCollapsedChange={onCollapsedChange}
        patch={<p>Rendered markdown</p>}
      />,
    );
    expect(screen.getByText("guide.md")).toBeTruthy();
    expect(screen.getByText("src/docs/")).toBeTruthy();
    expect(screen.getByText("+4")).toBeTruthy();
    expect(screen.getByText("-2")).toBeTruthy();
    screen.getByLabelText("Collapse file").click();
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
  });
});
