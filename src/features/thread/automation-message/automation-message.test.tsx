import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  AutomationMessage,
  automationName,
  shouldClampMessage,
} from "./automation-message";

afterEach(cleanup);

describe("automationName", () => {
  it("resolves a name and falls back when missing", () => {
    expect(automationName([{ id: "a1", name: "Nightly review" }], "a1")).toBe(
      "Nightly review",
    );
    expect(automationName([], "a1")).toBe("Automation");
  });
});

describe("shouldClampMessage", () => {
  it("clamps long or multiline messages", () => {
    expect(shouldClampMessage("short body")).toBe(false);
    expect(shouldClampMessage("a".repeat(421))).toBe(true);
    expect(shouldClampMessage(Array(10).fill("line").join("\n"))).toBe(true);
  });
});

describe("AutomationMessage", () => {
  it("renders the title and body", () => {
    render(<AutomationMessage title="Nightly review" body="Thread A passed" />);
    expect(screen.getByText("Nightly review")).toBeTruthy();
    expect(screen.getByText("Thread A passed")).toBeTruthy();
  });

  it("toggles a long body between Show more and Show less", () => {
    render(<AutomationMessage title="Nightly review" body={"a".repeat(421)} />);
    const toggle = screen.getByRole("button", { name: "Show more" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Show less" })).toBeTruthy();
  });
});
