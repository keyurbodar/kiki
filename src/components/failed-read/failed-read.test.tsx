import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FailedRead } from "./failed-read";

afterEach(cleanup);

describe("FailedRead", () => {
  it("renders the line, the sub-line and its own slot", () => {
    const { container } = render(
      <FailedRead
        slot="setup-load-failed"
        line="Couldn't load Setup"
        sub="It did not load"
      />,
    );
    expect(
      container.querySelector('[data-slot="setup-load-failed"]'),
    ).not.toBeNull();
    expect(screen.getByText("Couldn't load Setup")).toBeTruthy();
    expect(screen.getByText("It did not load")).toBeTruthy();
  });

  it("calls the retry it is given", () => {
    const retry = vi.fn();
    render(<FailedRead line="Couldn't load Setup" onRetry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("omits the action when there is nothing to retry", () => {
    render(<FailedRead line="Couldn't load Setup" />);
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });
});
