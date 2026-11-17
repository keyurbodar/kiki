import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  defaultWebhookCoalescing,
  validateWebhookCoalescing,
} from "./coalescing";
import { WebhookCoalescing } from "./webhook-coalescing";

afterEach(cleanup);

describe("validateWebhookCoalescing", () => {
  it("accepts the default and no batching", () => {
    expect(validateWebhookCoalescing(undefined)).toBeUndefined();
    expect(validateWebhookCoalescing(defaultWebhookCoalescing)).toBeUndefined();
  });

  it("checks wait time, event limit and the rest", () => {
    expect(
      validateWebhookCoalescing({
        ...defaultWebhookCoalescing,
        max_wait_seconds: 0,
      }),
    ).toBe("Wait time must be a whole number from 1 to 3600 seconds");
    expect(
      validateWebhookCoalescing({
        ...defaultWebhookCoalescing,
        max_events: 1.5,
      }),
    ).toBe("Event limit must be a whole number from 2 to 100");
    expect(
      validateWebhookCoalescing({
        ...defaultWebhookCoalescing,
        quiet_period_seconds: 120,
      }),
    ).toBe("Check the batching settings");
    expect(
      validateWebhookCoalescing({ ...defaultWebhookCoalescing, rules: [] }),
    ).toBe("Check the batching settings");
  });
});

describe("WebhookCoalescing", () => {
  it("turns grouping on with Capy's defaults", () => {
    const onChange = vi.fn();
    render(<WebhookCoalescing value={undefined} onChange={onChange} />);
    expect(screen.queryByLabelText("Wait time in seconds")).toBeNull();
    fireEvent.click(screen.getByRole("switch", { name: "Group events" }));
    expect(onChange).toHaveBeenCalledWith(defaultWebhookCoalescing);
  });

  it("edits the limits and shows the validation error", () => {
    const onChange = vi.fn();
    render(
      <WebhookCoalescing
        value={{ ...defaultWebhookCoalescing, max_events: 200 }}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("alert").textContent).toBe(
      "Event limit must be a whole number from 2 to 100",
    );
    fireEvent.change(screen.getByLabelText("Wait time in seconds"), {
      target: { value: "90" },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...defaultWebhookCoalescing,
      max_events: 200,
      max_wait_seconds: 90,
    });
  });
});
