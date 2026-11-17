import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CountedList, serverFacts } from "./listing-items";

afterEach(cleanup);

const items = Array.from({ length: 16 }, (_, index) => ({
  key: `skill-${index}`,
  icon: null,
  name: `skill-${index}`,
}));

describe("CountedList", () => {
  it("shows five rows and expands the rest", () => {
    render(<CountedList noun="skill" items={items} />);
    expect(screen.getByText("16 skills")).toBeTruthy();
    expect(screen.queryByText("skill-5")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "View 11 more" }));
    expect(screen.getByText("skill-15")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Show less" })).toBeTruthy();
  });

  it("renders nothing without items", () => {
    const { container } = render(<CountedList noun="file" items={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("describes a server", () => {
    expect(
      serverFacts(
        {
          displayName: "Docs",
          transport: "stdio",
          placement: "machine",
          url: null,
          command: "npx docs-mcp",
          auth: "headers",
          connection: "member",
          scopes: [],
          secrets: ["DOCS_KEY"],
        },
        "Acme",
      ),
    ).toEqual([
      ["Transport", "Local command"],
      ["Command", "npx docs-mcp"],
      ["Runs", "On each thread's machine"],
      ["Sign in", "Each member adds an API key"],
      ["Scopes", "None"],
      ["Secrets", "DOCS_KEY"],
    ]);
  });
});
