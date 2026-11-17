import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  foldForDisplay,
  foldViewport,
  pointToDevice,
  resolveDeviceFrame,
  rotateCorners,
} from "./device-frames";
import { type DeviceControl, DeviceShell, deviceKeyFor } from "./device-shell";
import { ScreenshotHistory, screenshotEntries } from "./screenshot-history";
import { signedUrlOf } from "./screenshot-url";

afterEach(cleanup);

describe("device frames", () => {
  it("resolves a known model in portrait", () => {
    const frame = resolveDeviceFrame("ios", "iPhone 16", undefined, false);
    expect(frame.size).toEqual({ width: 1359, height: 2736 });
    expect(frame.screen.x).toBe(90);
  });

  it("falls back to the default frame per OS", () => {
    expect(resolveDeviceFrame("ios", "Unknown", undefined, false).size).toEqual(
      { width: 1470, height: 3000 },
    );
    expect(
      resolveDeviceFrame("android", undefined, undefined, false).size,
    ).toEqual({ width: 1107, height: 2347 });
  });

  it("mirrors the android landscape screen", () => {
    const frame = resolveDeviceFrame("android", "Pixel 7", undefined, true);
    expect(frame.size).toEqual({ width: 2347, height: 1107 });
    expect(frame.screen).toEqual({ x: 33, y: 36, width: 2253, height: 1035 });
  });

  it("rotates a frame without a landscape skin by a quarter turn", () => {
    const frame = resolveDeviceFrame("ios", "iPhone 16", undefined, true);
    expect(frame.size).toEqual({ width: 2736, height: 1359 });
    expect(frame.screen).toEqual({ x: 90, y: 90, width: 2556, height: 1179 });
  });

  it("rotates corners", () => {
    expect(rotateCorners([1, 2, 3, 4], 1)).toEqual([4, 1, 2, 3]);
    expect(rotateCorners([1, 2, 3, 4], -1)).toEqual([2, 3, 4, 1]);
  });

  it("uses the fold frame for foldable models", () => {
    const folded = resolveDeviceFrame("ios", "iPhone Duo", "folded", true);
    expect(folded.corners).toEqual([177, 177, 24, 24]);
    expect(foldForDisplay("iPhone Duo", 3, { width: 1, height: 1 })).toBe(
      "unfolded",
    );
    expect(
      foldForDisplay("iPhone Duo", undefined, { width: 1398, height: 2034 }),
    ).toBe("folded");
    expect(
      foldForDisplay("iPhone 16", 1, { width: 1, height: 1 }),
    ).toBeUndefined();
    expect(foldViewport("folded", true)).toEqual({ width: 678, height: 466 });
  });

  it("maps client points to device pixels", () => {
    const rect = { left: 10, top: 20, width: 100, height: 200 };
    expect(pointToDevice(rect, { width: 1000, height: 2000 }, 60, 120)).toEqual(
      { x: 500, y: 1000 },
    );
    expect(
      pointToDevice({ ...rect, width: 0 }, { width: 1, height: 1 }, 0, 0),
    ).toBeUndefined();
  });

  it("maps points inside the letterboxed video only", () => {
    const rect = { left: 0, top: 0, width: 200, height: 200 };
    const device = { width: 100, height: 200 };
    expect(pointToDevice(rect, device, 50, 100)).toEqual({ x: 0, y: 100 });
    expect(pointToDevice(rect, device, 150, 200)).toEqual({ x: 100, y: 200 });
    expect(pointToDevice(rect, device, 100, 50)).toEqual({ x: 50, y: 50 });
    expect(pointToDevice(rect, device, 20, 100)).toBeUndefined();
    expect(pointToDevice(rect, device, 20, 100, true)).toEqual({
      x: 0,
      y: 100,
    });
  });
});

describe("DeviceShell", () => {
  const base = {
    device: { width: 390, height: 844 },
    os: "ios" as const,
    frameStyle: "panel" as const,
    retry: () => {},
    videoRef: { current: null },
  };

  it("shows the connecting notice without a poster", () => {
    render(<DeviceShell {...base} phase={{ phase: "connecting" }} />);
    expect(screen.getByText("Connecting to the phone")).toBeTruthy();
  });

  it("shows a badge while connecting over a poster", () => {
    render(
      <DeviceShell
        {...base}
        phase={{ phase: "reconnecting" }}
        poster={<span>poster</span>}
      />,
    );
    expect(
      screen
        .getAllByRole("status")
        .some((el) => el.textContent === "Reconnecting"),
    ).toBe(true);
  });

  it("offers retry when the live view failed", () => {
    const retry = vi.fn();
    render(
      <DeviceShell
        {...base}
        retry={retry}
        phase={{ phase: "failed", reason: "The phone stopped responding." }}
      />,
    );
    expect(screen.getByText("Live view failed")).toBeTruthy();
    expect(screen.getByText("The phone stopped responding.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("labels an unavailable live view", () => {
    render(
      <DeviceShell {...base} phase={{ phase: "unavailable", reason: "Off" }} />,
    );
    expect(screen.getByText("Live view unavailable")).toBeTruthy();
  });

  it("forwards keys and text to the device only while live", () => {
    const api = {
      touchDown: vi.fn(),
      touchMove: vi.fn(),
      touchUp: vi.fn(),
      type: vi.fn(),
      key: vi.fn(),
      paste: vi.fn(),
    };
    const control: DeviceControl = { phase: "open", api };
    const { container, rerender } = render(
      <DeviceShell {...base} control={control} phase={{ phase: "live" }} />,
    );
    const surface = container.querySelector("[tabindex]");
    if (surface === null) throw new Error("no focusable surface");
    fireEvent.keyDown(surface, { key: "a" });
    fireEvent.keyDown(surface, { key: "Enter" });
    fireEvent.keyDown(surface, { key: "ArrowLeft" });
    fireEvent.keyDown(surface, { key: "c", metaKey: true });
    expect(api.type).toHaveBeenCalledWith("a");
    expect(api.key).toHaveBeenCalledWith("ENTER");
    expect(api.type).toHaveBeenCalledTimes(1);
    rerender(
      <DeviceShell
        {...base}
        control={control}
        phase={{ phase: "reconnecting" }}
      />,
    );
    expect(container.querySelector("[tabindex]")).toBeNull();
  });

  it("maps device keys", () => {
    expect(deviceKeyFor("Backspace")).toBe("BACKSPACE");
    expect(deviceKeyFor("toString")).toBeUndefined();
  });
});

describe("ScreenshotHistory", () => {
  it("numbers screenshots newest first", () => {
    expect(
      screenshotEntries([{ fileId: "a" }, { fileId: "b" }]).map((entry) => [
        entry.key,
        entry.label,
      ]),
    ).toEqual([
      ["b", "Screenshot 2"],
      ["a", "Screenshot 1"],
    ]);
  });

  it("renders nothing without screenshots", () => {
    const { container } = render(
      <ScreenshotHistory jamId="jam_sample" screenshots={[]} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("lists previews with a count", () => {
    render(
      <ScreenshotHistory
        jamId="jam_sample"
        screenshots={[{ fileId: "a" }, { fileId: "b" }]}
      />,
    );
    expect(screen.getByRole("region", { name: "Screenshots" })).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(
      screen.getAllByRole("button").map((b) => b.getAttribute("aria-label")),
    ).toEqual(["Preview Screenshot 2", "Preview Screenshot 1"]);
  });

  it("closes the preview with Escape and returns focus", () => {
    render(
      <ScreenshotHistory jamId="jam_sample" screenshots={[{ fileId: "a" }]} />,
    );
    const thumbnail = screen.getByRole("button", {
      name: "Preview Screenshot 1",
    });
    thumbnail.focus();
    fireEvent.click(thumbnail);
    const preview = screen.getByRole("dialog", { name: "Screenshot 1" });
    expect(document.activeElement).toBe(preview);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(thumbnail);
  });

  it("reads signed urls from either response shape", () => {
    expect(signedUrlOf({ url: "https://example.com/a.png" })).toBe(
      "https://example.com/a.png",
    );
    expect(signedUrlOf("https://example.com/b.png")).toBe(
      "https://example.com/b.png",
    );
    expect(signedUrlOf({})).toBeUndefined();
  });
});
