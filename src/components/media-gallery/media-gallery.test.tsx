import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ImageUnavailable,
  isTallMedia,
  MediaGalleryMixed,
  MediaGrid,
  type MediaGridTile,
  mediaGridRows,
  mediaRatio,
  ProgressRing,
  singleMediaStyle,
} from "./media-gallery";

afterEach(cleanup);

const tile: MediaGridTile = (index, layout, more) => (
  <span
    data-testid={`tile-${index}`}
    data-layout={layout}
    data-more={more ?? ""}
  >
    {index}
  </span>
);

describe("media sizing helpers", () => {
  it("detects tall media", () => {
    expect(isTallMedia({ width: 400, height: 300 })).toBe(false);
    expect(isTallMedia({ width: 2, height: 3 })).toBe(true);
    expect(isTallMedia({ width: 3, height: 4 })).toBe(false);
    expect(isTallMedia(undefined)).toBe(false);
  });

  it("clamps media ratios to 0.75 and 3", () => {
    expect(mediaRatio({ width: 1, height: 10 })).toBe(0.75);
    expect(mediaRatio({ width: 10, height: 1 })).toBe(3);
    expect(mediaRatio({ width: 16, height: 9 })).toBeCloseTo(16 / 9);
  });

  it("builds single media styles with a bounded aspect ratio", () => {
    expect(singleMediaStyle({ width: 640, height: 480 })).toEqual({
      width:
        "min(100%, var(--media-box-w), 640px, calc(var(--media-box-h) * 1.3333333333333333))",
      aspectRatio: "1.3333333333333333",
    });
    expect(singleMediaStyle({ width: 300, height: 400 }).aspectRatio).toBe(
      "0.75",
    );
  });
});

describe("mediaGridRows", () => {
  it("stacks two wide media items", () => {
    expect(mediaGridRows(2, [2, 2.5])).toEqual([[0], [1]]);
  });

  it("pairs two narrow media items", () => {
    expect(mediaGridRows(2, [1, 1])).toEqual([[0, 1]]);
  });

  it("lays out four items in two rows", () => {
    expect(mediaGridRows(4, [1, 2, 3, 1])).toEqual([
      [0, 1],
      [2, 3],
    ]);
  });
});

describe("MediaGrid", () => {
  it("renders four tiles without sizes and passes the overflow count to the last tile", () => {
    render(<MediaGrid count={4} tile={tile} />);
    expect(screen.getAllByTestId(/^tile-/)).toHaveLength(4);
    expect(screen.getByTestId("tile-3").dataset.more).toBe("0");
    expect(screen.getByTestId("tile-0").dataset.layout).toBe("grid");
  });

  it("counts media beyond four in the overflow badge", () => {
    render(<MediaGrid count={6} tile={tile} />);
    expect(screen.getByTestId("tile-3").dataset.more).toBe("2");
  });

  it("uses hero and stack layouts for three items", () => {
    render(<MediaGrid count={3} tile={tile} />);
    expect(screen.getByTestId("tile-0").dataset.layout).toBe("hero");
    expect(screen.getByTestId("tile-1").dataset.layout).toBe("stack");
    expect(screen.getByTestId("tile-2").dataset.layout).toBe("stack");
  });

  it("uses the pair layout for two items without sizes", () => {
    render(<MediaGrid count={2} tile={tile} />);
    expect(screen.getByTestId("tile-0").dataset.layout).toBe("pair");
    expect(screen.getByTestId("tile-1").dataset.layout).toBe("pair");
  });

  it("uses sized two-item rows", () => {
    render(
      <MediaGrid
        count={2}
        sizes={[
          { width: 16, height: 9 },
          { width: 9, height: 16 },
        ]}
        tile={tile}
      />,
    );
    expect(screen.getByTestId("tile-0").dataset.layout).toBe("fit");
    expect(screen.getByTestId("tile-1").dataset.layout).toBe("fit");
  });
});

it("ImageUnavailable exposes an accessible image placeholder", () => {
  render(<ImageUnavailable label="x" />);
  const image = screen.getByRole("img", { name: "x, image unavailable" });
  expect(image.dataset.slot).toBe("image-unavailable");
});

it("MediaGalleryMixed marks its container", () => {
  const { container } = render(<MediaGalleryMixed />);
  expect(container.firstElementChild?.getAttribute("data-slot")).toBe(
    "media-gallery-mixed",
  );
});

it("ProgressRing exposes its value to assistive technology", () => {
  render(<ProgressRing value={42} label="Uploading photo.png" />);
  expect(
    screen
      .getByRole("progressbar", { name: "Uploading photo.png" })
      .getAttribute("aria-valuenow"),
  ).toBe("42");
});

it("tile callback receives index, layout, more and style", () => {
  const spy = vi.fn(tile);
  render(
    <MediaGrid
      count={2}
      sizes={[
        { width: 4, height: 3 },
        { width: 3, height: 4 },
      ]}
      tile={spy}
    />,
  );
  expect(spy).toHaveBeenCalledWith(0, "fit", undefined, {
    flex: "1.3333333333333333 1 0%",
    aspectRatio: "1.3333333333333333",
  });
  expect(spy).toHaveBeenCalledWith(1, "fit", undefined, {
    flex: "0.75 1 0%",
    aspectRatio: "0.75",
  });
});
