import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "@/primitives/toaster";
import {
  FeedbackDialog,
  feedbackBuildId,
  feedbackPayload,
} from "./feedback-dialog";

vi.mock("@/primitives/toaster", async () => ({
  ...(await vi.importActual<typeof import("@/primitives/toaster")>(
    "@/primitives/toaster",
  )),
  toast: { success: vi.fn(), error: vi.fn() },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const location = { origin: "https://app.example.com", pathname: "/threads" };

describe("feedbackPayload", () => {
  it("trims the message and records the page", () => {
    expect(
      feedbackPayload("  Faster search  ", "org_sample", location),
    ).toEqual({
      message: "Faster search",
      orgId: "org_sample",
      page: "https://app.example.com/threads",
      buildId: feedbackBuildId,
    });
  });

  it("returns nothing for a blank message", () => {
    expect(feedbackPayload("   ", "org_sample", location)).toBeUndefined();
  });
});

describe("FeedbackDialog", () => {
  it("disables send until there is text", () => {
    render(
      <FeedbackDialog
        open
        onOpenChange={() => {}}
        submitFeedback={() => Promise.resolve()}
      />,
    );
    const send = screen.getByRole("button", { name: "Send feedback" });
    expect(send.hasAttribute("disabled")).toBe(true);
    fireEvent.change(screen.getByLabelText("Feedback"), {
      target: { value: "More themes" },
    });
    expect(send.hasAttribute("disabled")).toBe(false);
  });

  it("submits, toasts and closes", async () => {
    const submitFeedback = vi.fn(() => Promise.resolve());
    const onOpenChange = vi.fn();
    render(
      <FeedbackDialog
        open
        orgId="org_sample"
        onOpenChange={onOpenChange}
        submitFeedback={submitFeedback}
      />,
    );
    fireEvent.change(screen.getByLabelText("Feedback"), {
      target: { value: "More themes" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(submitFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ message: "More themes", orgId: "org_sample" }),
    );
    expect(toast.success).toHaveBeenCalledWith("Feedback sent");
  });

  it("toasts an error and stays open when sending fails", async () => {
    const onOpenChange = vi.fn();
    render(
      <FeedbackDialog
        open
        onOpenChange={onOpenChange}
        submitFeedback={() => Promise.reject(new Error("offline"))}
      />,
    );
    fireEvent.change(screen.getByLabelText("Feedback"), {
      target: { value: "More themes" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Could not send feedback"),
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
