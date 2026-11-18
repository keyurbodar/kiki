import { readdirSync, readFileSync } from "node:fs";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { morphMotion, TextMorph } from ".";

afterEach(cleanup);

describe("TextMorph", () => {
  it("renders its text", () => {
    render(<TextMorph>$1.20</TextMorph>);
    expect(screen.getByText("$1.20")).toBeTruthy();
  });

  it("renders a number as text", () => {
    render(<TextMorph>{42}</TextMorph>);
    expect(screen.getByText("42")).toBeTruthy();
  });

  it("moves the changed characters rather than replacing the string", () => {
    const { rerender } = render(<TextMorph>$1.20</TextMorph>);
    const before = document.querySelectorAll("[data-torph]").length;
    rerender(<TextMorph>$1.30</TextMorph>);
    // The shared prefix keeps its nodes: torph matches characters, so the
    // string is not torn down and rebuilt.
    expect(document.querySelectorAll("[data-torph]").length).toBe(before);
    expect(screen.getByText("$1.30")).toBeTruthy();
  });

  it("takes its timing from the motion tokens", () => {
    const { duration, ease } = morphMotion();
    expect(duration).toBe(300);
    expect(ease).toContain("cubic-bezier");
  });
});

describe("text morph ownership", () => {
  const sources = readdirSync("src", { recursive: true, encoding: "utf8" })
    .map((path) => `src/${path.replaceAll("\\", "/")}`)
    .filter((path) => /\.tsx?$/.test(path));

  it("imports torph only from this primitive", () => {
    const offenders = sources.filter(
      (path) =>
        !path.startsWith("src/primitives/text-morph/") &&
        /from "torph(\/[^"]*)?"/.test(readFileSync(path, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
