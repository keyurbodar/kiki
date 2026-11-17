import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Kbd } from "./kbd";

afterEach(cleanup);

describe("Kbd", () => {
  it("renders the kbd slot and variants", () => {
    render(
      <>
        <Kbd>K</Kbd>
        <Kbd variant="chip">J</Kbd>
      </>,
    );
    expect(screen.getByText("K").tagName).toBe("KBD");
    expect(screen.getByText("K").dataset.slot).toBe("kbd");
    expect(screen.getByText("J").className).toContain("rounded-(--radius-kbd)");
  });
});
