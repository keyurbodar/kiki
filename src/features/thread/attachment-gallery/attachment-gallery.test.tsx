import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { GalleryEntry } from "@/components/media-gallery";
import type { FileId } from "@/data/api/schemas/files";
import { AttachmentGallery, AudioCard, FileCard, PendingCard } from ".";

const entry = (
  id: string,
  mediaType: string,
  extra: Partial<GalleryEntry["file"]> = {},
): GalleryEntry => ({
  file: {
    fileId: `file_${id}` as FileId,
    name: `${id}.${mediaType.split("/").at(-1)}`,
    mediaType,
    sizeBytes: 2048,
    ...extra,
  },
  url: `https://files.example.com/${id}`,
});

const shot = (id: string) =>
  entry(id, "image/png", { width: 960, height: 540 });
const doc = (id: string, mediaType = "text/markdown") => entry(id, mediaType);
const clip = () => entry("note", "audio/wav", { transcript: "hello" });

const html = (ui: Parameters<typeof render>[0]) => render(ui).container;

describe("AttachmentGallery", () => {
  it("renders nothing without entries", () => {
    expect(html(<AttachmentGallery entries={[]} />).textContent).toBe("");
  });

  it("renders a single image through the measured tile", () => {
    const root = html(<AttachmentGallery entries={[shot("a")]} />);
    expect(root.querySelectorAll("button")).toHaveLength(1);
    expect(root.querySelector("button")?.getAttribute("aria-label")).toBe(
      "Preview a.png",
    );
  });

  it("pairs two images in the justified gallery", () => {
    const root = html(<AttachmentGallery entries={[shot("a"), shot("b")]} />);
    expect(root.querySelectorAll("button")).toHaveLength(2);
  });

  it("switches to the mixed grid when a video joins", () => {
    const root = html(
      <AttachmentGallery
        entries={[shot("a"), entry("b", "video/mp4"), shot("c")]}
      />,
    );
    expect(
      root.querySelector('[data-slot="media-gallery-mixed"]'),
    ).not.toBeNull();
  });

  it("puts audio and documents after the gallery", () => {
    const root = html(
      <AttachmentGallery entries={[shot("a"), clip(), doc("brief")]} />,
    );
    expect(root.querySelector('[aria-label="Play note.wav"]')).not.toBeNull();
    expect(root.textContent).toContain("brief.markdown");
    expect(root.querySelector("audio")).not.toBeNull();
  });

  it("aligns an end-aligned gallery", () => {
    const root = html(
      <AttachmentGallery entries={[shot("a")]} align="end" />,
    ).firstElementChild;
    expect(root?.className).toContain("items-end");
  });

  it("renders the compact chip row", () => {
    const root = html(
      <AttachmentGallery
        entries={[shot("a"), doc("brief")]}
        variant="compact"
      />,
    );
    const row = root.firstElementChild;
    expect(row?.className).toContain("flex-wrap");
    expect(row?.querySelectorAll("button, a")).toHaveLength(2);
  });

  it("shows sending chips while the attachments upload", () => {
    const root = html(
      <AttachmentGallery
        entries={[shot("a"), doc("brief")]}
        variant="compact"
        pending
      />,
    );
    expect(root.querySelectorAll('[aria-busy="true"]')).toHaveLength(1);
    expect(root.querySelector('[aria-label="Sending a.png"]')).not.toBeNull();
  });

  it("drops duplicate attachments", () => {
    const root = html(
      <AttachmentGallery entries={[shot("a"), shot("a")]} variant="compact" />,
    );
    expect(root.querySelectorAll("button")).toHaveLength(1);
  });

  it("opens the lightbox on the clicked tile", () => {
    const root = html(<AttachmentGallery entries={[shot("a"), shot("b")]} />)
      .firstElementChild as HTMLElement;
    const tiles = root.querySelectorAll("button");
    tiles[1]?.click();
    expect(root.querySelector('[data-slot="image-unavailable"]')).toBeNull();
    expect(root.querySelector("img[alt='b.png']")).not.toBeNull();
  });
});

describe("FileCard", () => {
  it("downloads a resolved file", () => {
    const root = html(<FileCard entry={doc("brief", "application/pdf")} />);
    const link = root.querySelector("a");
    expect(link?.getAttribute("download")).toBe("brief.pdf");
    expect(link?.getAttribute("aria-label")).toBe("Download brief.pdf");
    expect(root.textContent).toContain("2.0 KB · PDF");
  });

  it("reads the failed state", () => {
    const root = html(
      <FileCard entry={{ ...doc("brief"), unavailable: true }} />,
    );
    expect(root.textContent).toContain("Download failed");
  });

  it("opens instead of downloading when asked", () => {
    let opened = 0;
    const root = html(
      <FileCard entry={doc("brief")} onOpen={() => (opened += 1)} />,
    );
    root.querySelector("button")?.click();
    expect(opened).toBe(1);
  });
});

describe("AudioCard", () => {
  it("carries the player, its clock and its transcript", () => {
    const root = html(<AudioCard entry={clip()} />);
    expect(root.querySelector("audio")).not.toBeNull();
    expect(root.textContent).toContain("note.wav");
    expect(root.textContent).toContain("0:00 / 0:00");
    expect(root.textContent).toContain("hello");
    expect(root.querySelector('[aria-label="Seek note.wav"]')).not.toBeNull();
    expect(root.querySelector('[aria-label="Play note.wav"]')).not.toBeNull();
  });

  it("reads unavailable when the file will not resolve", () => {
    const root = html(
      <AudioCard entry={{ ...clip(), url: undefined, unavailable: true }} />,
    );
    expect(root.textContent).toContain("Unavailable");
    expect(
      root
        .querySelector('[aria-label="Play note.wav"]')
        ?.hasAttribute("disabled"),
    ).toBe(true);
  });
});

describe("PendingCard", () => {
  it("announces the upload in the thumbnail well", () => {
    const root = html(<PendingCard entry={shot("a")} />);
    expect(root.querySelector('[aria-label="Sending a.png"]')).not.toBeNull();
    expect(root.textContent).toContain("2.0 KB · PNG");
  });
});
