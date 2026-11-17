import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { FeedbackRequestTakeoverView } from "./feedback-request-takeover-view";

afterEach(cleanup);

it("shows the failure status and disables both actions while busy", () => {
  const { rerender } = render(
    <FeedbackRequestTakeoverView
      failed
      onSend={() => {}}
      onDecline={() => {}}
      onLater={() => {}}
    />,
  );
  expect(screen.getByText("Couldn't send, try again")).toBeTruthy();
  expect(screen.getByText("Send this feedback to the Capy team?")).toBeTruthy();
  rerender(<FeedbackRequestTakeoverView busy="send" onLater={() => {}} />);
  expect(screen.getByText("Sending").closest("button")?.disabled).toBe(true);
  expect(screen.getByText("Decline").closest("button")?.disabled).toBe(true);
});
