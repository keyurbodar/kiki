import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "./alert";

afterEach(cleanup);

describe("Alert", () => {
  it("renders the alert parts with Capy's slots", () => {
    render(
      <Alert color="danger">
        <AlertTitle>Failed</AlertTitle>
        <AlertDescription>Try again</AlertDescription>
        <AlertAction>Retry</AlertAction>
      </Alert>,
    );
    const alert = screen.getByRole("alert");
    expect(alert.dataset.slot).toBe("alert");
    expect(alert.className).toContain(
      "[&>svg]:[--intent-text:var(--destructive)]",
    );
    expect(screen.getByText("Failed").tagName).toBe("H5");
    expect(screen.getByText("Failed").dataset.slot).toBe("alert-title");
    expect(screen.getByText("Try again").dataset.slot).toBe(
      "alert-description",
    );
    expect(screen.getByText("Retry").dataset.slot).toBe("alert-action");
  });
});
