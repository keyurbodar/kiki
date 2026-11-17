import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RawDeviceAccess } from "@/features/thread/device-access-dialog";
import {
  attachmentCount,
  DeviceAccessOwnerTakeoverView,
  DeviceAccessRequesterTakeoverView,
  devicePermissionHeading,
} from "./device-access-takeover";
import { heldMessageFor, oldestRequested } from "./takeover-containers";

afterEach(cleanup);

const requestedAt = new Date("2026-11-17T12:00:00.000Z");

describe("DeviceAccessOwnerTakeoverView", () => {
  it("names the requester and pluralizes attachment counts", () => {
    const { rerender } = render(
      <DeviceAccessOwnerTakeoverView
        member="Jordan Lee"
        deviceName="studio"
        text="Please review the Acme draft"
        fileCount={2}
      />,
    );
    expect(
      screen.getByText("Jordan Lee wants to message this thread on studio"),
    ).toBeTruthy();
    expect(screen.getByText("2 attachments")).toBeTruthy();
    rerender(
      <DeviceAccessOwnerTakeoverView
        member="Jordan Lee"
        deviceName="studio"
        text="Please review the Acme draft"
        fileCount={1}
      />,
    );
    expect(screen.getByText("1 attachment")).toBeTruthy();
    expect(screen.queryByText("2 attachments")).toBeNull();
    expect(attachmentCount(0)).toBe("0 attachments");
  });
});

describe("DeviceAccessRequesterTakeoverView", () => {
  it("shows the waiting message and disables Withdraw without a handler", () => {
    const { rerender } = render(
      <DeviceAccessRequesterTakeoverView
        owner="Alex"
        deviceName="studio"
        text="Waiting on approval"
      />,
    );
    expect(
      screen.getByText("Waiting for Alex to allow this on studio"),
    ).toBeTruthy();
    const withdraw = screen.getByRole("button", { name: "Withdraw" });
    expect((withdraw as HTMLButtonElement).disabled).toBe(true);

    const onWithdraw = vi.fn();
    rerender(
      <DeviceAccessRequesterTakeoverView
        owner="Alex"
        deviceName="studio"
        text="Waiting on approval"
        onWithdraw={onWithdraw}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    expect(onWithdraw).toHaveBeenCalledOnce();
  });
});

describe("devicePermissionHeading", () => {
  it("distinguishes execution from computer use", () => {
    expect(devicePermissionHeading("execution", "studio")).toBe(
      "Capy wants to use studio",
    );
    expect(devicePermissionHeading("computer_use", "studio")).toBe(
      "Capy wants to control applications on studio",
    );
  });
});

describe("oldestRequested and heldMessageFor", () => {
  const row = (
    id: string,
    status: RawDeviceAccess["status"],
    at: Date,
    threadId = "jam_root",
    held: RawDeviceAccess["held"] = null,
  ): RawDeviceAccess => ({
    id,
    threadId,
    userId: "jam_user",
    status,
    requestedAt: at,
    resolvedAt: null,
    held,
  });

  it("picks the earliest pending row", () => {
    expect(
      oldestRequested([
        row(
          "jam_sample_late",
          "requested",
          new Date(requestedAt.getTime() + 10),
        ),
        row("jam_sample_granted", "granted", new Date(0)),
        row("jam_sample_early", "requested", requestedAt),
      ])?.id,
    ).toBe("jam_sample_early");
    expect(
      oldestRequested([row("jam_sample_granted", "granted", requestedAt)]),
    ).toBeUndefined();
  });

  it("picks the earliest held message on the matching thread", () => {
    const held = { text: "Please review", fileCount: 2 };
    const found = heldMessageFor(
      [
        row(
          "jam_sample_late",
          "requested",
          new Date(requestedAt.getTime() + 10),
          "jam_root",
          held,
        ),
        row("jam_sample_other", "requested", requestedAt, "jam_other", held),
        row("jam_sample_early", "granted", requestedAt, "jam_root", held),
        row("jam_sample_empty", "requested", new Date(0), "jam_root"),
      ],
      "jam_root",
    );
    expect(found?.row.id).toBe("jam_sample_early");
    expect(found?.held).toEqual(held);
  });
});
