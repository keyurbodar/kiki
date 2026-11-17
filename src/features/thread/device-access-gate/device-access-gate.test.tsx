import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DeviceAccessGate,
  deviceAccessGateCopy,
  gateStatus,
} from "./device-access-gate";

afterEach(cleanup);

describe("deviceAccessGateCopy and gateStatus", () => {
  it("uses the exact requested and revoked copy", () => {
    expect(deviceAccessGateCopy("requested", "studio")).toEqual({
      title: "Access requested",
      description:
        "This thread runs on studio, send again once the owner approves",
    });
    expect(deviceAccessGateCopy("revoked", "studio")).toEqual({
      title: "Access revoked",
      description: "The owner of studio revoked access to this thread",
    });
    expect(gateStatus({ viewerAccess: "requested" })).toBe("requested");
    expect(gateStatus({ viewerAccess: "revoked" })).toBe("revoked");
    expect(gateStatus({ viewerAccess: "granted" })).toBeNull();
    expect(gateStatus(null)).toBeNull();
    expect(gateStatus(undefined)).toBeNull();
  });
});

describe("DeviceAccessGate", () => {
  it("omits the stop button unless a handler is supplied", () => {
    const { rerender } = render(
      <DeviceAccessGate device={{ name: "studio" }} status="requested" />,
    );
    expect(screen.getByText("Access requested")).toBeTruthy();
    expect(
      screen.getByText(
        "This thread runs on studio, send again once the owner approves",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Stop run" })).toBeNull();

    const onStop = vi.fn();
    rerender(
      <DeviceAccessGate
        device={{ name: "studio" }}
        status="revoked"
        stop={{ onStop }}
      />,
    );
    expect(screen.getByText("Access revoked")).toBeTruthy();
    expect(
      screen.getByText("The owner of studio revoked access to this thread"),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Stop run" }));
    expect(onStop).toHaveBeenCalledOnce();
  });
});
