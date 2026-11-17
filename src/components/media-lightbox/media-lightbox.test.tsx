import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mediaActions } from "./media-actions";
import {
  MediaLightbox,
  type MediaLightboxEntry,
  STRIP_STRIDE,
  stripWindow,
} from "./media-lightbox";

afterEach(cleanup);

const entries: MediaLightboxEntry[] = [
  { key: "a", label: "first.png", kind: "image" },
  { key: "b", label: "second.png", kind: "image" },
  { key: "c", label: "clip.mp4", kind: "video" },
];

function Harness({
  onClose = () => {},
  onEscape,
  items = entries,
}: {
  onClose?: () => void;
  onEscape?: () => boolean | undefined;
  items?: MediaLightboxEntry[];
}) {
  const [index, setIndex] = useState(0);
  return (
    <MediaLightbox
      entries={items}
      index={index}
      onIndexChange={setIndex}
      onClose={onClose}
      onEscape={onEscape}
      renderMedia={(entry) => <span data-testid="media">{entry.label}</span>}
      renderThumbnail={(entry) => <span>{entry.key}</span>}
      renderActions={() => <button type="button">extra</button>}
      aside={<aside>comments</aside>}
    />
  );
}

const dialog = () => screen.getByRole("dialog");
const media = () => screen.getByTestId("media").textContent;

describe("MediaLightbox", () => {
  it("shows the counter, actions, close and navigation", () => {
    render(<Harness />);
    expect(dialog().getAttribute("aria-label")).toBe("first.png");
    expect(screen.getByText("1 / 3")).toBeTruthy();
    expect(screen.getByText("extra")).toBeTruthy();
    expect(screen.getByText("comments")).toBeTruthy();
    expect(
      document.querySelector('[data-slot="lightbox-actions"]')?.textContent,
    ).toContain("extra");
    expect(screen.getByLabelText("Close preview")).toBeTruthy();
    expect(screen.getByLabelText("Zoom in")).toBeTruthy();
  });

  it("wraps with the next and previous buttons", () => {
    render(<Harness />);
    fireEvent.click(screen.getByLabelText("Previous item"));
    expect(media()).toBe("clip.mp4");
    expect(screen.queryByLabelText("Zoom in")).toBeNull();
    fireEvent.click(screen.getByLabelText("Next item"));
    expect(media()).toBe("first.png");
  });

  it("navigates with the arrow keys", () => {
    render(<Harness />);
    fireEvent.keyDown(dialog(), { key: "ArrowRight" });
    expect(media()).toBe("second.png");
    fireEvent.keyDown(dialog(), { key: "ArrowLeft" });
    expect(media()).toBe("first.png");
  });

  it("closes on Escape unless onEscape handles it", () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <Harness onClose={onClose} onEscape={() => true} />,
    );
    fireEvent.keyDown(dialog(), { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    unmount();
    render(<Harness onClose={onClose} />);
    fireEvent.keyDown(dialog(), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from the close button", () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Close preview"));
    expect(onClose).toHaveBeenCalled();
  });

  it("labels the thumbnail strip", () => {
    render(<Harness />);
    const strip = document.querySelector('[data-slot="lightbox-strip"]');
    expect(strip?.getAttribute("aria-label")).toBe("Thumbnails");
  });

  it("drops the counter, arrows and strip for one item", () => {
    render(<Harness items={entries.slice(0, 1)} />);
    expect(screen.queryByText("1 / 1")).toBeNull();
    expect(screen.queryByLabelText("Next item")).toBeNull();
    expect(document.querySelector('[data-slot="lightbox-strip"]')).toBeNull();
  });
});

describe("stripWindow", () => {
  it("renders the visible thumbnails plus overscan", () => {
    expect(stripWindow(0, STRIP_STRIDE * 3, 100)).toEqual({ start: 0, end: 7 });
    expect(stripWindow(STRIP_STRIDE * 10, STRIP_STRIDE * 2, 100)).toEqual({
      start: 6,
      end: 16,
    });
    expect(stripWindow(STRIP_STRIDE * 98, STRIP_STRIDE * 5, 100).end).toBe(100);
  });
});

describe("mediaActions", () => {
  it("copies images only and downloads anything with a source", () => {
    expect(
      mediaActions({ kind: "image", name: "a.png", url: "/a.png" }).copy,
    ).toBeTypeOf("function");
    const video = mediaActions({ kind: "video", name: "a.mp4", url: "/a.mp4" });
    expect(video.copy).toBeUndefined();
    expect(video.download).toBeTypeOf("function");
    expect(mediaActions({ kind: "image", name: "a.png" })).toEqual({
      copy: undefined,
      download: undefined,
    });
  });
});
