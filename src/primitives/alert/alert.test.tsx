import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  alertVariants,
} from "./alert";

afterEach(cleanup);

describe("Alert", () => {
  it("renders Capy's alert surface with the neutral intent by default", () => {
    render(
      <Alert>
        <span>icon</span>
        <AlertTitle>Heads up</AlertTitle>
      </Alert>,
    );
    const alert = screen.getByRole("alert");
    expect(alert.dataset.slot).toBe("alert");
    expect(alert.className).toContain("rounded-(--radius-card)");
    expect(alert.className).toContain("border-hairline");
    expect(alert.className).toContain("bg-card");
    expect(alert.className).toContain("p-4");
    expect(alert.className).toContain("text-sm");
    expect(alert.className).toContain("shadow-card");
    expect(alert.className).toContain("text-foreground");
  });

  it("maps every intent the contract exposes", () => {
    expect(alertVariants({ color: "neutral" })).not.toContain("[--intent-text:");
    expect(alertVariants({ color: "danger" })).toContain(
      "[--intent-text:var(--destructive)]",
    );
    expect(alertVariants({ color: "accent" })).toContain(
      "[--intent-text:var(--primary-ink)]",
    );
    expect(alertVariants({ color: "success" })).toContain("--intent-text");
  });

  it("keeps Capy's icon and action grid selectors", () => {
    const classes = alertVariants();
    expect(classes).toContain("[&>svg]:absolute");
    expect(classes).toContain("[&>svg]:size-(--icon-base)");
    expect(classes).toContain("[&>svg~*:not([data-slot=alert-action])]:pl-6.5");
    expect(classes).toContain("has-[>[data-slot=alert-action]]:grid");
    expect(classes).toContain(
      "has-[>[data-slot=alert-action]]:grid-cols-[minmax(0,1fr)_auto]",
    );
    expect(classes).toContain(
      "[&>[data-slot=alert-description]]:text-muted-foreground-1",
    );
  });

  it("appends a caller className after the variant classes", () => {
    render(<Alert className="max-w-md">body</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("max-w-md");
    expect(alert.className).toContain("bg-card");
  });

  it("renders the title as a heading that gaps itself above a description", () => {
    render(
      <Alert>
        <AlertTitle>Build failed</AlertTitle>
        <AlertDescription>Retry the run.</AlertDescription>
      </Alert>,
    );
    const title = screen.getByText("Build failed");
    expect(title.tagName).toBe("H5");
    expect(title.dataset.slot).toBe("alert-title");
    expect(title.className).toContain("leading-4");
    expect(title.className).toContain("font-medium");
    expect(title.className).toContain(
      "[&:has(~[data-slot=alert-description])]:mb-1",
    );
    const description = screen.getByText("Retry the run.");
    expect(description.dataset.slot).toBe("alert-description");
    expect(description.className).toContain("break-words");
  });

  it("places the action in the grid's second column", () => {
    render(
      <Alert>
        <AlertTitle>Build failed</AlertTitle>
        <AlertDescription>Retry the run.</AlertDescription>
        <AlertAction>
          <button type="button">Retry</button>
        </AlertAction>
      </Alert>,
    );
    const action = screen.getByText("Retry").parentElement;
    expect(action?.dataset.slot).toBe("alert-action");
    expect(action?.className).toContain("col-start-2");
    expect(action?.className).toContain("row-span-2");
    expect(action?.className).toContain("row-start-1");
    expect(action?.className).toContain("gap-2");
  });
});
