import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type DiffMove,
  MoveChip,
  moveChipLabel,
  moveJumpTarget,
} from "./move-chip";
import { PreviewNotice, previewNoticeText } from "./preview-notice";

afterEach(cleanup);

const samePath: DiffMove = {
  fromPath: "src/a.ts",
  fromLine: 10,
  toPath: "src/a.ts",
  toLine: 20,
  lineCount: 3,
};

describe("move helpers", () => {
  it("labels moves within one path by line", () => {
    expect(moveChipLabel(samePath, "origin")).toBe("Moved to line 20");
    expect(moveChipLabel(samePath, "destination")).toBe("Moved from line 10");
  });

  it("labels moves across paths with the destination path", () => {
    const move = { ...samePath, toPath: "src/b.ts" };
    expect(moveChipLabel(move, "origin")).toBe("Moved to src/b.ts");
    expect(moveChipLabel(move, "destination")).toBe("Moved from src/a.ts");
  });

  it("builds jump targets for each side", () => {
    expect(moveJumpTarget(samePath, "origin")).toEqual({
      path: "src/a.ts",
      line: 20,
      side: "additions",
    });
    expect(moveJumpTarget(samePath, "destination")).toEqual({
      path: "src/a.ts",
      line: 10,
      side: "deletions",
    });
  });
});

describe("previewNoticeText", () => {
  it("describes each preview failure", () => {
    expect(previewNoticeText("failed", true)).toBe(
      "Could not render this diff",
    );
    expect(previewNoticeText("failed", false)).toBe("File did not load");
    expect(previewNoticeText("too-large", false)).toBe(
      "File is too large to preview",
    );
    expect(previewNoticeText("unavailable", false)).toBe("Preview unavailable");
  });
});

describe("PreviewNotice", () => {
  it("links to GitHub when an error href is provided", () => {
    render(
      <PreviewNotice
        status="failed"
        errorHref="https://github.com/acme/web/pull/12"
      />,
    );
    const link = screen.getByRole("link", { name: "view on GitHub" });
    expect(link.getAttribute("href")).toBe(
      "https://github.com/acme/web/pull/12",
    );
  });
});

describe("MoveChip", () => {
  it("jumps to the target when clicked", () => {
    const onJump = vi.fn();
    const move = { ...samePath, toPath: "src/b.ts" };
    render(<MoveChip metadata={{ move, at: "origin" }} onJump={onJump} />);
    fireEvent.click(screen.getByRole("button", { name: /Moved to src\/b.ts/ }));
    expect(onJump).toHaveBeenCalledWith("src/b.ts", 20, "additions");
  });
});
