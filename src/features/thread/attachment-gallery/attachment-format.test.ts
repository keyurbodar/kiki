import { describe, expect, it } from "vitest";
import type { FileRef } from "@/data/events";
import {
  attachmentKind,
  composerUploadStatus,
  type ComposerUpload,
  fileMeta,
  fileTypeLabel,
  formatBytes,
  formatClock,
  keyAttachments,
  mediaSizeOf,
  previewVariant,
  splitAttachments,
  uploadPercent,
} from "./attachment-format";

const file = (overrides: Partial<FileRef> = {}): FileRef => ({
  fileId: "file_1",
  name: "photo.png",
  mediaType: "image/png",
  sizeBytes: 2048,
  ...overrides,
});

const upload = (overrides: Partial<ComposerUpload> = {}): ComposerUpload => ({
  localId: "local_1",
  name: "photo.png",
  mediaType: "image/png",
  sizeBytes: 2048,
  status: "uploading",
  ...overrides,
});

describe("formatBytes", () => {
  it("formats byte and kilobyte sizes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1023)).toBe("1023 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(15360)).toBe("15 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("uses an em dash for negative, NaN and infinite sizes", () => {
    expect(formatBytes(-1)).toBe("—");
    expect(formatBytes(Number.NaN)).toBe("—");
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("fileTypeLabel", () => {
  it("uppercases the extension", () => {
    expect(fileTypeLabel(file({ name: "notes.pdf", mediaType: "text/plain" }))).toBe("PDF");
  });

  it("falls back to the media type subtype, then to file", () => {
    expect(fileTypeLabel(file({ name: "document", mediaType: "application/pdf" }))).toBe("pdf");
    expect(fileTypeLabel(file({ name: "document", mediaType: "" }))).toBe("file");
  });
});

it("fileMeta combines size and type", () => {
  expect(fileMeta(file({ sizeBytes: 15360, name: "notes.pdf", mediaType: "application/pdf" }))).toBe(
    "15 KB · PDF",
  );
});

describe("attachmentKind", () => {
  it("classifies image, video and audio media types", () => {
    expect(attachmentKind(file({ mediaType: "image/png" }))).toBe("image");
    expect(attachmentKind(file({ mediaType: "video/mp4" }))).toBe("video");
    expect(attachmentKind(file({ mediaType: "audio/mp4" }))).toBe("audio");
  });

  it("classifies video and audio by extension", () => {
    expect(attachmentKind(file({ name: "clip.mp4", mediaType: "application/octet-stream" }))).toBe("video");
    expect(attachmentKind(file({ name: "memo.m4a", mediaType: "application/octet-stream" }))).toBe("audio");
  });

  it("returns undefined for other files", () => {
    expect(attachmentKind(file({ name: "notes.pdf", mediaType: "application/pdf" }))).toBeUndefined();
  });
});

describe("keyAttachments", () => {
  it("dedupes identical fileId and title pairs", () => {
    const first = { file: file() };
    const second = {
      file: file(),
      title: "Renamed",
    };
    expect(keyAttachments([first, first, second, { ...second }])).toEqual([
      { ...first, key: JSON.stringify(["file_1", "photo.png"]) },
      { ...second, key: JSON.stringify(["file_1", "Renamed"]) },
    ]);
  });

  it("keys by fileId and title or name", () => {
    const [withTitle, withName] = keyAttachments([
      { file: file({ fileId: "file_2" }), title: "A title" },
      { file: file({ fileId: "file_3" }) },
    ]);
    expect(withTitle?.key).toBe(JSON.stringify(["file_2", "A title"]));
    expect(withName?.key).toBe(JSON.stringify(["file_3", "photo.png"]));
  });
});

describe("splitAttachments", () => {
  it("groups media, audio and files using titles as labels", () => {
    const media = { file: file({ fileId: "file_1" }), title: "Snapshot", key: "media" };
    const video = {
      file: file({ fileId: "file_2", name: "clip.mp4", mediaType: "video/mp4" }),
      key: "video",
    };
    const audio = {
      file: file({ fileId: "file_3", name: "memo.m4a", mediaType: "audio/mp4" }),
      key: "audio",
    };
    const document = {
      file: file({ fileId: "file_4", name: "notes.pdf", mediaType: "application/pdf" }),
      key: "file",
    };
    expect(splitAttachments([media, video, audio, document])).toEqual({
      media: [
        { key: "media", label: "Snapshot", kind: "image", entry: media },
        { key: "video", label: "clip.mp4", kind: "video", entry: video },
      ],
      audio: [audio],
      files: [document],
    });
  });
});

describe("previewVariant", () => {
  const item = (name: string, mediaType: string) => ({
    key: "key",
    label: name,
    kind: "image" as const,
    entry: { file: file({ name, mediaType }), key: "key" },
  });

  it("uses preview for JPEG and PNG images", () => {
    expect(previewVariant(item("photo.jpg", "image/jpeg"))).toBe("preview");
    expect(previewVariant(item("photo.png", "image/png"))).toBe("preview");
  });

  it("uses display for GIFs and videos", () => {
    expect(previewVariant(item("motion.gif", "image/gif"))).toBe("display");
    expect(previewVariant({ ...item("clip.mp4", "video/mp4"), kind: "video" })).toBe("display");
  });
});

describe("mediaSizeOf", () => {
  it("returns image dimensions when both are present", () => {
    const dimensions = { width: 640, height: 480 };
    expect(
      mediaSizeOf({
        key: "key",
        label: "photo.png",
        kind: "image",
        entry: { file: file(dimensions), key: "key" },
      }),
    ).toEqual(dimensions);
  });

  it("returns undefined for incomplete dimensions and non-images", () => {
    const make = (kind: "image" | "video", overrides: Partial<FileRef>) => ({
      key: "key",
      label: "photo.png",
      kind,
      entry: { file: file(overrides), key: "key" },
    });
    expect(mediaSizeOf(make("image", { width: 640 }))).toBeUndefined();
    expect(mediaSizeOf(make("video", { width: 640, height: 480 }))).toBeUndefined();
  });
});

it("formatClock formats millisecond durations", () => {
  expect(formatClock(0)).toBe("0:00");
  expect(formatClock(65000)).toBe("1:05");
  expect(formatClock(3605000)).toBe("60:05");
  expect(formatClock(-1000)).toBe("0:00");
});

describe("composerUploadStatus", () => {
  it("reports lost and not-kept uploads", () => {
    expect(composerUploadStatus(upload({ lost: true }))).toBe("Not kept across reload");
    expect(composerUploadStatus(upload({ kept: false }))).toBe("Not kept across reload");
  });

  it("reports failed uploads", () => {
    expect(composerUploadStatus(upload({ status: "failed" }))).toBe("Upload failed");
  });

  it("reports upload progress", () => {
    expect(composerUploadStatus(upload())).toBe("Preparing");
    expect(composerUploadStatus(upload({ progress: 42 }))).toBe("42%");
    expect(composerUploadStatus(upload({ progress: 100 }))).toBe("Finishing");
  });

  it("reports the type label for completed uploads", () => {
    expect(composerUploadStatus(upload({ status: "done" }))).toBe("PNG");
  });
});

it("uploadPercent caps at 100 and floors fractional progress", () => {
  expect(uploadPercent(3, 4)).toBe(75);
  expect(uploadPercent(1, 3)).toBe(33);
  expect(uploadPercent(10, 4)).toBe(100);
});
