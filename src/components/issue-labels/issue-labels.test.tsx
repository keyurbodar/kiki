import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  findLabelByName,
  IssueLabelCreateRow,
  nextLabelColor,
  normalizeLabelName,
} from "./issue-labels";

afterEach(cleanup);

const labels = [
  { id: "a", name: "Bug", color: "red" },
  { id: "b", name: "Feature", color: "blue" },
];

describe("issue label helpers", () => {
  it("normalises names before comparing", () => {
    expect(normalizeLabelName("  Needs\u200b   design ")).toBe("Needs design");
    expect(findLabelByName(labels, " bug ")?.id).toBe("a");
    expect(findLabelByName(labels, "Docs")).toBeUndefined();
  });

  it("rotates new label colours without gray", () => {
    expect(nextLabelColor(0)).toBe("blue");
    expect(nextLabelColor(7)).toBe("green");
    expect(nextLabelColor(8)).toBe("blue");
  });
});

describe("IssueLabelCreateRow", () => {
  const row = (query: string, matches: number) =>
    render(
      <IssueLabelCreateRow
        query={query}
        labels={labels}
        matches={matches}
        pending={false}
        full={false}
        onCreate={() => undefined}
      />,
    );

  it("hints when nothing is typed and nothing matches", () => {
    row("", 0);
    expect(screen.getByText("Type a name to create a label")).toBeTruthy();
  });

  it("renders nothing for an existing name", () => {
    const { container } = row("bug", 1);
    expect(container.textContent).toBe("");
  });
});
