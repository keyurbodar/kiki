import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuitDialogView } from "./desktop-quit-dialog";

afterEach(cleanup);

const base = {
  noun: "Mac" as const,
  askWhenIdle: true,
  setAskWhenIdle: () => {},
};

describe("QuitDialogView", () => {
  it("quits from the idle view and toggles the ask preference", () => {
    const answer = vi.fn();
    const setAskWhenIdle = vi.fn();
    render(
      <QuitDialogView
        {...base}
        view={{ tier: "idle" }}
        answer={answer}
        setAskWhenIdle={setAskWhenIdle}
      />,
    );
    expect(screen.getByText("Quit Capy? This Mac goes offline")).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(setAskWhenIdle).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByRole("button", { name: "Quit" }));
    expect(answer).toHaveBeenCalledWith(true, true);
  });

  it("lists busy threads up to five with a remainder", () => {
    const answer = vi.fn();
    const threads = Array.from({ length: 7 }, (_, index) => ({
      id: `t${index}`,
      title: index === 0 ? null : `Sample thread ${index}`,
      sortActivityAt: new Date("2026-01-01T00:00:00Z"),
      pullCount: index === 1 ? 2 : 0,
    }));
    render(
      <QuitDialogView
        {...base}
        view={{ tier: "busy", threads }}
        answer={answer}
        now={new Date("2026-01-01T00:10:00Z")}
      />,
    );
    expect(screen.getByText("Untitled thread")).toBeTruthy();
    expect(screen.getByText("2 PRs")).toBeTruthy();
    expect(screen.queryByText("Sample thread 5")).toBeNull();
    expect(screen.getByText("2 more")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Keep Running" }));
    expect(answer).toHaveBeenCalledWith(false, true);
  });

  it("announces the checking state", () => {
    render(
      <QuitDialogView
        {...base}
        view={{ tier: "checking" }}
        answer={() => {}}
      />,
    );
    expect(screen.getByRole("status").textContent).toBe(
      "Checking what's running on this Mac",
    );
    expect(screen.getByRole("button", { name: "Quit Anyway" })).toBeTruthy();
  });
});
