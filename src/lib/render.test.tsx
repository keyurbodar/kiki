import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

afterEach(cleanup);

it("renders a React component into the DOM", () => {
  render(<h1>Hello from kiki</h1>);
  expect(screen.getByRole("heading").textContent).toBe("Hello from kiki");
});
