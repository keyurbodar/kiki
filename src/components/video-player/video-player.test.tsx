import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VideoPlayer } from "./video-player";
import { resetVideoPreferences } from "./video-player-state";

afterEach(() => {
  cleanup();
  localStorage.clear();
  resetVideoPreferences();
});

describe("VideoPlayer", () => {
  it("renders Capy's slots and labelled controls", () => {
    const { container } = render(<VideoPlayer src="/demo.mp4" label="Demo" />);
    expect(container.querySelector("[data-slot=video-player]")).not.toBeNull();
    expect(
      container.querySelector("[data-slot=video-player-bar]"),
    ).not.toBeNull();
    expect(container.querySelector("video")?.getAttribute("src")).toBe(
      "/demo.mp4#t=0.001",
    );
    expect(screen.getByLabelText("Play Demo")).toBeTruthy();
    expect(screen.getByLabelText("Seek Demo")).toBeTruthy();
    expect(screen.getByLabelText("Playback speed, auto 1×")).toBeTruthy();
    expect(screen.queryByLabelText("Expand Demo")).toBeNull();
    expect(container.querySelector("[data-slot=video-volume]")).toBeNull();
  });

  it("shows Expand only with onExpand and hands off", () => {
    const onExpand = vi.fn();
    render(<VideoPlayer src="/demo.mp4" label="Demo" onExpand={onExpand} />);
    fireEvent.click(screen.getByLabelText("Expand Demo"));
    expect(onExpand).toHaveBeenCalledOnce();
  });

  it("swaps in the fallback when the video fails", () => {
    const onFailed = vi.fn();
    const { container } = render(
      <VideoPlayer
        src="/x.mp4"
        label="X"
        onFailed={onFailed}
        fallback={<a href="/x.mp4">gone</a>}
      />,
    );
    const video = container.querySelector("video");
    if (video === null) throw new Error("no video");
    fireEvent.error(video);
    expect(onFailed).toHaveBeenCalledOnce();
    expect(screen.getByText("gone")).toBeTruthy();
  });

  it("steps speed with ] and persists it", () => {
    const { container } = render(<VideoPlayer src="/demo.mp4" label="Demo" />);
    const root = container.querySelector("[data-slot=video-player]");
    if (root === null) throw new Error("no root");
    fireEvent.keyDown(root, { key: "]" });
    expect(screen.getByLabelText("Playback speed, 1.5×")).toBeTruthy();
    expect(localStorage.getItem("capy-web:video-speed")).toBe("1.5");
  });
});
