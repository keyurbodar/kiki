import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fitRows,
  isTall,
  MarkdownGallery,
  MarkdownMediaProvider,
  singleImageStyle,
} from "./gallery";
import { MarkdownVideo } from "./video";

const imgs = (n: number, size?: { width: number; height: number }) =>
  Array.from({ length: n }, (_, i) => `shot-${i}`).map((name, i) => (
    <img key={name} src={`/${name}.png`} alt={`Shot ${i}`} {...size} />
  ));

afterEach(cleanup);

describe("MarkdownGallery", () => {
  it("lays out by count", () => {
    const one = render(<MarkdownGallery>{imgs(1)}</MarkdownGallery>).container;
    expect(
      one.querySelector("span[data-slot=markdown-gallery]"),
    ).not.toBeNull();
    const three = render(
      <MarkdownGallery>{imgs(3)}</MarkdownGallery>,
    ).container;
    expect(three.querySelectorAll("[data-gallery-index]")).toHaveLength(3);
    expect(three.querySelector(".flex-\\[1\\.5\\]")).not.toBeNull();
  });

  it("collapses past four images into +N and keeps the rest hidden", () => {
    const { container } = render(<MarkdownGallery>{imgs(6)}</MarkdownGallery>);
    expect(container.querySelectorAll("[data-gallery-index]")).toHaveLength(4);
    expect(screen.getByText("+2")).toBeTruthy();
    expect(
      container.querySelector("span[hidden]")?.querySelectorAll("img"),
    ).toHaveLength(2);
  });

  it("uses fitted rows when sizes are known", () => {
    expect(fitRows(2, [1, 1])).toEqual([[0, 1]]);
    expect(fitRows(2, [3, 3])).toEqual([[0], [1]]);
    expect(fitRows(5, [1, 1, 1, 1])).toEqual([
      [0, 1],
      [2, 3],
    ]);
    expect(fitRows(3, [1, 1, 1])).toBeUndefined();
    expect(fitRows(4, [1, 1])).toBeUndefined();
    expect(isTall({ width: 100, height: 200 })).toBe(true);
    expect(singleImageStyle({ width: 100, height: 200 }).aspectRatio).toBe(
      "0.75",
    );
  });

  it("opens the lightbox through the provider", () => {
    const onOpen = vi.fn();
    render(
      <MarkdownMediaProvider value={{ onOpen }}>
        <MarkdownGallery>{imgs(2)}</MarkdownGallery>
      </MarkdownMediaProvider>,
    );
    fireEvent.click(screen.getByAltText("Shot 1"));
    expect(onOpen).toHaveBeenCalledWith(
      [
        { kind: "image", src: "/shot-0.png", label: "Shot 0" },
        { kind: "image", src: "/shot-1.png", label: "Shot 1" },
      ],
      1,
    );
  });

  it("opens the clicked image, not the first one with the same src", () => {
    const onOpen = vi.fn();
    render(
      <MarkdownMediaProvider value={{ onOpen }}>
        <MarkdownGallery>
          <img src="/same.png" alt="First" />
          <img src="/same.png" alt="Second" />
        </MarkdownGallery>
      </MarkdownMediaProvider>,
    );
    fireEvent.click(screen.getByAltText("Second"));
    expect(onOpen.mock.calls[0]?.[1]).toBe(1);
  });

  it("shows image-unavailable for a broken image", () => {
    const { container } = render(<MarkdownGallery>{imgs(2)}</MarkdownGallery>);
    fireEvent.error(screen.getByAltText("Shot 0"));
    expect(
      container.querySelector("[data-slot=image-unavailable]"),
    ).not.toBeNull();
  });
});

describe("MarkdownVideo", () => {
  it("renders the inline player labelled by its title", () => {
    const { container } = render(
      <MarkdownVideo src="/clip.mp4" title="Clip" />,
    );
    const slot = container.querySelector("[data-slot=markdown-video]");
    expect(slot?.getAttribute("data-video-src")).toBe("/clip.mp4");
    expect(screen.getByLabelText("Play Clip")).toBeTruthy();
  });

  it("falls back to a new-tab link when the video fails", () => {
    const { container } = render(<MarkdownVideo src="/clip.mp4" />);
    const video = container.querySelector("video");
    if (video === null) throw new Error("no video");
    fireEvent.error(video);
    const link = screen.getByText("Video unavailable, open in a new tab");
    expect(link.getAttribute("href")).toBe("/clip.mp4");
  });
});
