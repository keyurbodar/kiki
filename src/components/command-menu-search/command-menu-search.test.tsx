import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommandMenuSearch } from "./command-menu-search";
import { emptySearchData } from "./search";

const now = 1_000_000_000;

const operatorData = {
  ...emptySearchData,
  threads: [
    {
      id: "t-sam",
      title: "Wire the retries",
      status: "working" as const,
      updatedAt: now - 1000,
      author: "Sam Rivera",
      labels: ["release"],
    },
    {
      id: "t-priya",
      title: "Shard the suite",
      status: "waiting" as const,
      updatedAt: now - 1000,
      author: "Priya Shah",
      labels: [],
    },
  ],
};

const type = (value: string) => {
  const input = screen.getByRole("combobox");
  fireEvent.change(input, { target: { value } });
  return input;
};

afterEach(cleanup);

describe("CommandMenuSearch", () => {
  it("switches category with the arrow keys and composes on Tab", () => {
    const onCompose = vi.fn();
    render(<CommandMenuSearch data={emptySearchData} onCompose={onCompose} />);
    const input = screen.getByPlaceholderText(
      "Search threads, actions, settings…",
    );
    fireEvent.keyDown(input, { key: "ArrowRight" });
    expect(screen.getByPlaceholderText("Search Captains…")).toBeTruthy();
    fireEvent.keyDown(input, { key: "ArrowLeft" });
    fireEvent.keyDown(input, { key: "ArrowLeft" });
    expect(screen.getByPlaceholderText("Search settings…")).toBeTruthy();
    fireEvent.keyDown(input, { key: "Tab" });
    expect(onCompose).toHaveBeenCalledWith({ query: "", seed: "" });
  });

  it("offers New thread for a query with no results", () => {
    render(<CommandMenuSearch data={emptySearchData} initialQuery="zzzqqq" />);
    expect(screen.getByText("New thread: zzzqqq")).toBeTruthy();
  });

  it("closes on Escape", () => {
    const close = vi.fn();
    render(<CommandMenuSearch data={emptySearchData} close={close} />);
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
    expect(close).toHaveBeenCalled();
  });
});

describe("typed operators in the palette", () => {
  it("commits a typed operator to a token and narrows the results", () => {
    render(<CommandMenuSearch data={operatorData} now={now} />);
    expect(screen.getByText("Shard the suite")).toBeTruthy();
    type("author:Priya ");
    expect(screen.getByText("Author: Priya")).toBeTruthy();
    expect(screen.getByText("Shard the suite")).toBeTruthy();
    expect(screen.queryByText("Wire the retries")).toBeNull();
    // The committed token leaves the input holding only free text.
    expect((screen.getByRole("combobox") as HTMLInputElement).value).toBe("");
  });

  it("removes one stale token without clearing the query", () => {
    render(<CommandMenuSearch data={operatorData} now={now} />);
    type("author:Nobody ");
    expect(screen.getByText("No results")).toBeTruthy();
    expect(screen.getByText("Author: Nobody")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Remove Author filter" }),
    );
    expect(screen.queryByText("Author: Nobody")).toBeNull();
    expect(screen.getByText("Shard the suite")).toBeTruthy();
  });

  it("clears every filter from the empty state", () => {
    render(<CommandMenuSearch data={operatorData} now={now} />);
    type("author:Nobody ");
    expect(screen.getByText("No results")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.queryByText("Author: Nobody")).toBeNull();
    expect(screen.getByText("Shard the suite")).toBeTruthy();
    expect(screen.getByText("Wire the retries")).toBeTruthy();
  });

  it("shows only the value page while a value is being typed", () => {
    render(<CommandMenuSearch data={operatorData} now={now} />);
    type("author:");
    expect(
      screen.getAllByText(
        (_, element) => element?.textContent === "Sam Rivera",
      ),
    ).not.toHaveLength(0);
    expect(screen.queryByText("Wire the retries")).toBeNull();
  });

  it("suggests keys and values for the token under the caret", () => {
    render(<CommandMenuSearch data={operatorData} now={now} />);
    type("au");
    expect(
      screen.getAllByText((_, element) => element?.textContent === "author:"),
    ).not.toHaveLength(0);
    type("author:");
    expect(
      screen.getAllByText(
        (_, element) => element?.textContent === "Sam Rivera",
      ),
    ).not.toHaveLength(0);
    type("author:pri");
    fireEvent.click(
      screen.getAllByText(
        (_, element) => element?.textContent === "Priya Shah",
      )[0] as Element,
    );
    expect(screen.getByText("Author: Priya Shah")).toBeTruthy();
    expect(screen.queryByText("Wire the retries")).toBeNull();
  });

  it("pops the last token on Backspace in an empty input", () => {
    render(<CommandMenuSearch data={operatorData} now={now} />);
    type("author:Priya ");
    expect(screen.getByText("Author: Priya")).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Backspace" });
    expect(screen.queryByText("Author: Priya")).toBeNull();
    expect(screen.getByText("Wire the retries")).toBeTruthy();
  });
});
