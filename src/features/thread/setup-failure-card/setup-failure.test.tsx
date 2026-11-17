import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  lastLines,
  type SetupFailure,
  setupFailureDescription,
  setupFailureTitle,
  setupOutcomeLabel,
  setupStepLabel,
} from "./setup-failure";
import { SetupFailureCard } from "./setup-failure-card";

afterEach(cleanup);

const failure = (overrides: Partial<SetupFailure> = {}): SetupFailure => ({
  machineId: "machine_a",
  repo: "acme/web",
  detail: "line one\nline two\nline three\nline four",
  stopped: false,
  ...overrides,
});

describe("setupStepLabel", () => {
  it("labels workspace and checkout failures", () => {
    expect(setupStepLabel(failure({ repo: undefined }))).toBe(
      "Workspace setup",
    );
    expect(setupStepLabel(failure())).toBe("Checkout of web");
  });

  it("labels setup phases and startup entries", () => {
    expect(setupStepLabel(failure({ phase: "initialize" }))).toBe(
      "Setup step initialize for web",
    );
    expect(setupStepLabel(failure({ phase: "startup", entry: "dev" }))).toBe(
      "Setup step dev for web",
    );
  });
});

describe("setup failure text", () => {
  it("reports stopped and retrying failures", () => {
    expect(setupFailureTitle(failure())).toBe("Checkout of web failed");
    expect(setupFailureTitle(failure({ stopped: true }))).toBe(
      "Checkout of web failed again, Capy stopped retrying",
    );
    expect(
      setupOutcomeLabel(
        failure({ outcome: { kind: "recovered", at: new Date() } }),
      ),
    ).toBe("Checkout of web passed on retry");
  });

  it("describes the affected step", () => {
    expect(
      setupFailureDescription(failure({ phase: "startup", entry: "dev" })),
    ).toBe(
      "Capy keeps working, commands that need dev may fail until it passes",
    );
    expect(setupFailureDescription(failure({ stopped: true }))).toBe(
      "Capy keeps working, commands that need web will fail until the step is fixed",
    );
  });

  it("keeps only the last lines of the log", () => {
    expect(lastLines(failure().detail, 3)).toBe(
      "line two\nline three\nline four",
    );
  });
});

describe("SetupFailureCard", () => {
  it("collapses a recovered outcome and expands the alert on click", () => {
    render(
      <SetupFailureCard
        setup={failure({ outcome: { kind: "recovered", at: new Date() } })}
      />,
    );
    const toggle = screen.getByRole("button", { name: /passed on retry/ });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(toggle);
    expect(screen.getByText("Checkout of web failed")).toBeTruthy();
  });
});
