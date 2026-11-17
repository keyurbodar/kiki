import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { TerminalRequestTakeoverView } from "./terminal-request-takeover-view";

afterEach(cleanup);

it("waits for the command, then drops the status once it exits", () => {
  render(
    <TerminalRequestTakeoverView
      command="gh auth login"
      reason="Sign in, then press Done"
      onOpenInTab={() => {}}
      onLater={() => {}}
      terminal={({ onExited }) => (
        <button type="button" onClick={() => onExited(0)}>
          exit
        </button>
      )}
    />,
  );
  expect(screen.getByText("Finish gh auth login")).toBeTruthy();
  expect(screen.getByText("Waiting for the command to exit")).toBeTruthy();
  expect(screen.getByText("Open in tab")).toBeTruthy();
  fireEvent.click(screen.getByText("exit"));
  expect(screen.queryByText("Waiting for the command to exit")).toBeNull();
  expect(screen.queryByText("Open in tab")).toBeNull();
});

it("says when the command is gone", () => {
  render(
    <TerminalRequestTakeoverView
      command="npm login"
      reason="r"
      gone
      onLater={() => {}}
    />,
  );
  expect(
    screen.getByText("The command is no longer running on the machine"),
  ).toBeTruthy();
});
