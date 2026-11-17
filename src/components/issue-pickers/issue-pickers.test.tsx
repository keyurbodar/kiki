import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IssuePickerCheck, pickerDigit } from "./issue-pickers";
import { searchIssueOptions } from "./match";

afterEach(cleanup);

const states = ["In progress", "In review", "Todo", "Backlog", "Done"];
const search = (query: string) =>
  searchIssueOptions(states, (name) => [name], query);

describe("searchIssueOptions", () => {
  it("returns every option for a blank query", () => {
    expect(search("  ")).toEqual(states);
  });

  it("ranks exact, then prefix, then word-start matches", () => {
    expect(search("in")).toEqual(["In progress", "In review"]);
    expect(search("review")).toEqual(["In review"]);
    expect(search("do")).toEqual(["Done", "Todo"]);
  });

  it("ignores case and extra whitespace", () => {
    expect(search("IN   REVIEW")).toEqual(["In review"]);
  });

  it("drops single-letter matches inside a word and has no fuzzy tier", () => {
    expect(search("k")).toEqual([]);
    expect(search("ip")).toEqual([]);
  });

  it("keeps the original order on ties", () => {
    expect(search("o")).toEqual([]);
    expect(search("og")).toEqual(["In progress", "Backlog"]);
  });
});

describe("IssuePickerCheck", () => {
  it("numbers the first ten rows 1 to 9 then 0", () => {
    expect([0, 8, 9, 10].map(pickerDigit)).toEqual(["1", "9", "0", undefined]);
  });

  it("renders the digit and the check", () => {
    const { container } = render(<IssuePickerCheck checked index={2} />);
    expect(screen.getByText("3").dataset.menuDigit).toBe("3");
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
