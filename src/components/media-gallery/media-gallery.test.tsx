import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FileId } from "@/data/api/schemas/files";
import {
  audioEntries,
  fileEntries,
  formatBytes,
  formatDuration,
  type GalleryEntry,
  ImageUnavailable,
  JustifiedMediaGrid,
  MediaGalleryMixed,
  mediaItems,
  mediaKind,
  mediaLabel,
  mediaSize,
} from ".";

const entry = (
  id: string,
  mediaType: string,
  extra: Partial<GalleryEntry["file"]> = {},
  title?: string,
): GalleryEntry => ({
  file: {
    fileId: `file_${id}` as FileId,
    name: `${id}.${mediaType.split("/").at(-1)}`,
    mediaType,
    sizeBytes: 2048,
    ...extra,
  },
  title,
  url: `https://files.example.com/${id}`,
});

const html = (ui: Parameters<typeof render>[0]) => render(ui).container;

describe("formatBytes", () => {
  it("matches Capy's thresholds", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1023)).toBe("1023 B");
    expect(formatBytes(26)).toBe("26 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1024 * 1024 * 12)).toBe("12 MB");
    expect(formatBytes(-1)).toBe("—");
    expect(formatBytes(Number.NaN)).toBe("—");
  });
});

describe("formatDuration", () => {
  it("reads as a player clock", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(7000)).toBe("0:07");
    expect(formatDuration(751_000)).toBe("12:31");
    expect(formatDuration(-500)).toBe("0:00");
  });
});

describe("media kinds", () => {
  it("splits images, video, audio and documents", () => {
    const entries = [
      entry("shot", "image/png"),
      entry("clip", "video/mp4"),
      entry("note", "audio/wav"),
      entry("brief", "application/pdf"),
    ];
    expect(entries.map((item) => mediaKind(item))).toEqual([
      "image",
      "video",
      "audio",
      undefined,
    ]);
    expect(mediaItems(entries).map((item) => item.kind)).toEqual([
      "image",
      "video",
    ]);
    expect(audioEntries(entries).map(mediaLabel)).toEqual(["note.wav"]);
    expect(fileEntries(entries).map(mediaLabel)).toEqual(["brief.pdf"]);
  });

  it("prefers the message's title over the file name", () => {
    expect(mediaLabel(entry("shot", "image/png", {}, "Home page"))).toBe(
      "Home page",
    );
  });

  it("reads a size only when the file carries one", () => {
    expect(mediaSize(entry("shot", "image/png"))).toBeUndefined();
    expect(
      mediaSize(entry("shot", "image/png", { width: 960, height: 540 })),
    ).toEqual({ width: 960, height: 540 });
  });
});

describe("JustifiedMediaGrid", () => {
  const tile = (index: number) => <span>{`tile ${index}`}</span>;

  it("pairs two near-square images on one row", () => {
    const root = html(
      <JustifiedMediaGrid
        count={2}
        sizes={[
          { width: 800, height: 800 },
          { width: 800, height: 800 },
        ]}
        tile={tile}
      />,
    ).firstElementChild;
    expect(root?.className).toContain("flex-col");
    expect(root?.querySelectorAll(".flex.gap-1")).toHaveLength(1);
  });

  it("stacks two wide images on their own rows", () => {
    const root = html(
      <JustifiedMediaGrid
        count={2}
        sizes={[
          { width: 1600, height: 500 },
          { width: 1600, height: 500 },
        ]}
        tile={tile}
      />,
    ).firstElementChild;
    expect(root?.querySelectorAll(".flex.gap-1")).toHaveLength(2);
  });

  it("gives three images a hero and a stack", () => {
    const root = html(
      <JustifiedMediaGrid count={3} sizes={[]} tile={tile} />,
    ).firstElementChild;
    expect(root?.className).toContain("aspect-[2/1]");
    expect(root?.textContent).toBe("tile 0tile 1tile 2");
  });

  it("lays four out in two rows without sizes", () => {
    const root = html(
      <JustifiedMediaGrid count={4} sizes={[]} tile={tile} />,
    ).firstElementChild;
    expect(root?.querySelectorAll(".flex.gap-1")).toHaveLength(2);
  });

  it("renders nothing below four entries without a full-size run", () => {
    expect(
      html(<JustifiedMediaGrid count={1} sizes={[]} tile={tile} />).textContent,
    ).toBe("");
  });
});

describe("MediaGalleryMixed", () => {
  const items = mediaItems(
    Array.from({ length: 7 }, (_, index) =>
      entry(`shot${index}`, "image/png", { width: 960, height: 540 }),
    ),
  );

  it("keeps Capy's data-slot and six-tile grid", () => {
    const root = html(<MediaGalleryMixed items={items} />).firstElementChild;
    expect(root?.getAttribute("data-slot")).toBe("media-gallery-mixed");
    expect(root?.querySelectorAll("button")).toHaveLength(6);
  });

  it("counts the entries past the sixth on the last tile", () => {
    const root = html(<MediaGalleryMixed items={items} />);
    expect(root.querySelectorAll("button")[5]?.textContent).toContain("+1");
  });

  it("labels every tile with Capy's preview name", () => {
    const root = html(<MediaGalleryMixed items={items} />);
    expect(root.querySelector("button")?.getAttribute("aria-label")).toBe(
      "Preview shot0.png",
    );
  });
});

describe("ImageUnavailable", () => {
  it("renders the state and its copy", () => {
    const root = html(<ImageUnavailable label="shot.png" />).firstElementChild;
    expect(root?.getAttribute("data-slot")).toBe("image-unavailable");
    expect(root?.getAttribute("role")).toBe("img");
    expect(root?.getAttribute("aria-label")).toBe(
      "shot.png, image unavailable",
    );
    expect(root?.textContent).toContain("Image unavailable");
    expect(root?.textContent).toContain("shot.png");
  });

  it("reads on its own without a label", () => {
    const root = html(<ImageUnavailable />).firstElementChild;
    expect(root?.getAttribute("aria-label")).toBe("Image unavailable");
    expect(root?.textContent).toBe("Image unavailable");
  });
});
