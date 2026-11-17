import { RegistryProvider } from "@effect/atom-react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ThreadRoute } from "@/routes/_app/thread/$threadId";

afterEach(cleanup);

const renderRoute = (threadId: string) =>
  render(
    <RegistryProvider>
      <ThreadRoute threadId={threadId} pane={undefined} />
    </RegistryProvider>,
  );

const slot = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-slot="${name}"]`);

describe("thread view composer slot", () => {
  it("shows the composer on a thread with nothing waiting", () => {
    const { container } = renderRoute("jam_sample");
    expect(slot(container, "composer")).not.toBeNull();
    expect(slot(container, "clarify-takeover")).toBeNull();
    expect(slot(container, "request-takeover")).toBeNull();
  });

  it("replaces the composer with the clarify takeover", () => {
    const { container, getByText } = renderRoute("jam_sample_clarify");
    expect(slot(container, "clarify-takeover")).not.toBeNull();
    expect(slot(container, "composer")).toBeNull();
    expect(getByText("Where should the toggle live?")).toBeDefined();
  });

  it("replaces the composer with the environment request takeover", () => {
    const { container, getByText } = renderRoute("jam_sample_environment");
    expect(slot(container, "request-takeover")).not.toBeNull();
    expect(slot(container, "composer")).toBeNull();
    expect(getByText("SAMPLE_API_KEY")).toBeDefined();
  });
});
