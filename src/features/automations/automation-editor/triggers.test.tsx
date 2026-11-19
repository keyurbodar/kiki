import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EventTrigger } from "./model";
import { TriggerRow } from "./triggers";

afterEach(cleanup);

const githubTrigger = (
  overrides: Partial<EventTrigger> = {},
): EventTrigger => ({
  type: "github",
  event: "pull_request_merged",
  conditions: {},
  ...overrides,
});

describe("an event trigger row", () => {
  it("names the event the trigger fires on", () => {
    render(
      <TriggerRow
        trigger={githubTrigger()}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Event" }).textContent).toContain(
      "Pull request merged",
    );
  });

  it("shows every condition and drops one on its remove control", () => {
    const onChange = vi.fn();
    render(
      <TriggerRow
        trigger={githubTrigger({
          conditions: { repository: ["acme/web"], author: ["sam-sample"] },
        })}
        onChange={onChange}
        onRemove={() => {}}
      />,
    );
    const repository = document.querySelector(
      '[data-slot="trigger-condition"]',
    );
    expect(repository?.textContent).toContain("repository");
    expect(repository?.textContent).toContain("acme/web");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove condition repository is acme/web",
      }),
    );
    expect(onChange).toHaveBeenCalledWith({
      type: "github",
      event: "pull_request_merged",
      conditions: { author: ["sam-sample"] },
    });
  });

  it("offers batching settings on a webhook trigger only", () => {
    const { unmount } = render(
      <TriggerRow
        trigger={{ type: "incoming_webhook", conditions: {} }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(screen.getByRole("switch", { name: "Group events" })).toBeTruthy();
    unmount();
    render(
      <TriggerRow
        trigger={githubTrigger()}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(screen.queryByRole("switch", { name: "Group events" })).toBeNull();
  });

  it("keeps a schedule row free of event controls", () => {
    render(
      <TriggerRow
        trigger={{ type: "schedule", cron: "0 9 * * *", timezone: "UTC" }}
        onChange={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: "Event" })).toBeNull();
    expect(
      document.querySelector('[data-slot="trigger-condition"]'),
    ).toBeNull();
  });
});
