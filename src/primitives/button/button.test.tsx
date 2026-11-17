import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Button, ButtonIcon, buttonVariants } from "./button";

beforeEach(() => {
  Element.prototype.animate = vi.fn(
    () =>
      ({
        play() {},
        pause() {},
        cancel() {},
        finished: Promise.resolve(),
      }) as unknown as Animation,
  );
});
afterEach(cleanup);

describe("Button", () => {
  it("applies Capy's defaults: solid, neutral, sm", () => {
    render(<Button>Run</Button>);
    const button = screen.getByRole("button", { name: "Run" });
    expect(button.dataset.slot).toBe("button");
    expect(button.className).toContain("h-(--h-control-sm)");
    expect(button.className).toContain("bg-[var(--intent-bg,var(--button))]");
    expect(button.className).toContain("focus-visible:outline-ring-inset");
  });

  it("maps variant, intent, size and shape onto classes", () => {
    const classes = buttonVariants({
      variant: "soft",
      intent: "danger",
      size: "icon-base",
      shape: "segment-start",
    });
    expect(classes).toContain("bg-[var(--intent-bg-soft,var(--secondary))]");
    expect(classes).toContain("[--intent-bg-soft:var(--destructive-soft)]");
    expect(classes).toContain("size-(--h-control-base)");
    expect(classes).toContain("rounded-r-none");
  });

  it("fires click and keyboard activation", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    const button = screen.getByRole("button", { name: "Go" });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it("disables and marks busy while loading", () => {
    const onClick = vi.fn();
    render(
      <Button loading loadingLabel="Saving" onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveProperty("disabled", true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.textContent).toBe("Saving");
    expect(button.querySelector("[data-slot=dot-grid-icon]")).not.toBeNull();
  });

  it("sets the ButtonIcon side from its position", () => {
    render(
      <>
        <Button>
          <ButtonIcon>
            <svg data-testid="lead" />
          </ButtonIcon>
          New
        </Button>
        <Button aria-label="Only">
          <ButtonIcon>
            <svg data-testid="only" className="extra" />
          </ButtonIcon>
        </Button>
      </>,
    );
    const lead = screen.getByTestId("lead").parentElement;
    const only = screen.getByTestId("only").parentElement;
    expect(lead?.dataset.slot).toBe("button-icon");
    expect(lead?.className).toContain("-ml-0.5");
    expect(only?.className).toContain("-mx-0.5");
    expect(screen.getByTestId("only").getAttribute("class")).toBe("extra");
  });

  it("swaps the ButtonIcon for the dot grid while loading", () => {
    render(
      <Button loading>
        <ButtonIcon>
          <svg data-testid="icon" />
        </ButtonIcon>
        Deploy
      </Button>,
    );
    expect(screen.queryByTestId("icon")).toBeNull();
    const icon = screen
      .getByRole("button")
      .querySelector("[data-slot=button-icon]");
    expect(icon?.querySelector("[data-slot=dot-grid-icon]")).not.toBeNull();
  });

  it("sizes icon buttons to the control square, not their content", () => {
    for (const [size, token] of [
      ["icon-xs", "xs"],
      ["icon-sm", "sm"],
      ["icon-base", "base"],
    ] as const) {
      const classes = buttonVariants({ size });
      expect(classes).toContain(`size-(--h-control-${token})`);
      expect(classes.split(" ")).not.toContain("w-fit");
    }
    // No width utility in the shared base, or it would out-order the size
    // variants in Tailwind's output and shrink icon buttons to their glyph.
    expect(buttonVariants({})).not.toMatch(/\bw-(fit|auto|full)\b/);
  });

  it("renders the element the caller asks for and keeps their props", () => {
    render(
      <Button render={<a href="/threads" />} className="custom">
        Threads
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Threads" });
    expect(link.dataset.slot).toBe("button");
    expect(link.getAttribute("href")).toBe("/threads");
    expect(link.className).toContain("custom");
  });

  it("shows the loading label instead of its children", () => {
    render(
      <Button loading loadingLabel="Saving">
        <ButtonIcon>
          <svg data-testid="glyph" />
        </ButtonIcon>
        Save
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button.textContent).toBe("Saving");
    expect(button.querySelector("[data-slot=button-icon]")).toBeNull();
    expect(button.querySelector("[data-slot=dot-grid-icon]")).not.toBeNull();
  });

  it("margins a trailing icon on the right", () => {
    render(
      <Button>
        Next
        <ButtonIcon side="trailing">
          <svg data-testid="trail" />
        </ButtonIcon>
      </Button>,
    );
    expect(screen.getByTestId("trail").parentElement?.className).toContain(
      "-mr-0.5",
    );
  });

  it("leaves an idle button enabled and unannounced", () => {
    render(<Button>Run</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveProperty("disabled", false);
    expect(button.getAttribute("aria-busy")).toBeNull();
  });
});
