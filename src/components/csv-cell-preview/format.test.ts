import { describe, expect, it } from "vitest";
import { formatCellPreview, PREVIEW_LIMIT } from "./format";

describe("formatCellPreview", () => {
  it("pretty prints JSON values", () => {
    expect(formatCellPreview(' {"a":[1,2]} ')).toEqual({
      json: true,
      cut: false,
      text: '{\n  "a": [\n    1,\n    2\n  ]\n}',
    });
  });

  it("keeps plain and invalid JSON text as written", () => {
    expect(formatCellPreview("{not json")).toEqual({
      json: false,
      cut: false,
      text: "{not json",
    });
    expect(formatCellPreview("plain text")).toEqual({
      json: false,
      cut: false,
      text: "plain text",
    });
  });

  it("cuts long values at the preview limit", () => {
    const preview = formatCellPreview("x".repeat(PREVIEW_LIMIT + 5));
    expect(preview.cut).toBe(true);
    expect(preview.text).toHaveLength(PREVIEW_LIMIT);
  });
});
