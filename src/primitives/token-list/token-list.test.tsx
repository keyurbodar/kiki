import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { TokenList } from "./token-list";

afterEach(cleanup);

it("renders the token list container", () => {
  render(<TokenList>tokens</TokenList>);
  const list = screen.getByText("tokens");
  expect(list.dataset.slot).toBe("token-list");
  expect(list.className).toContain("divide-border-1");
});
