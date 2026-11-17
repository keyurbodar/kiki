import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FooterTrigger, StatusTrigger } from "./status-trigger";

afterEach(cleanup);

describe("StatusTrigger", () => {
  it("renders a ghost button with a status dot and a chevron", () => {
    render(<StatusTrigger color="success">Connected</StatusTrigger>);
    const button = screen.getByRole("button", { name: "Connected" });
    expect(button.dataset.slot).toBe("button");
    expect(button.querySelector(".bg-success")).not.toBeNull();
    expect(
      button.querySelector('[data-icon="chevron-down-small"]'),
    ).not.toBeNull();
  });

  it("defaults to a neutral dot and can drop the chevron", () => {
    render(<StatusTrigger chevron={false}>Reconnect</StatusTrigger>);
    const button = screen.getByRole("button", { name: "Reconnect" });
    expect(button.querySelector(".bg-muted-foreground-3")).not.toBeNull();
    expect(button.querySelector("[data-icon]")).toBeNull();
  });
});

describe("FooterTrigger", () => {
  it("shows the icon, a truncated detail, an optional dot and an up chevron", () => {
    render(
      <FooterTrigger icon={<svg data-testid="lead" />} color="warning">
        Cloud
      </FooterTrigger>,
    );
    const button = screen.getByRole("button", { name: "Cloud" });
    expect(button.firstElementChild?.getAttribute("data-testid")).toBe("lead");
    expect(screen.getByText("Cloud").className).toContain("truncate");
    expect(button.querySelector(".bg-warning")).not.toBeNull();
    expect(
      button.querySelector('[data-icon="chevron-top-small"]'),
    ).not.toBeNull();
  });

  it("leaves the dot out without a color", () => {
    render(<FooterTrigger chevron={false}>main</FooterTrigger>);
    const button = screen.getByRole("button", { name: "main" });
    expect(button.querySelector(".rounded-full")).toBeNull();
    expect(button.querySelector("[data-icon]")).toBeNull();
  });
});
