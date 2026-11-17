import { describe, expect, it } from "vitest";
import {
  type AttachmentEntry,
  attachmentMessages,
  declareFile,
  formatBytes,
  inferMediaType,
  isBrowserRenderable,
  pastedPlainText,
  rejectReason,
  statusLabel,
} from "./attachments";

const entry = (
  status: AttachmentEntry["status"],
  name = "notes.md",
): AttachmentEntry => ({
  localId: "a",
  name,
  mediaType: "text/markdown",
  sizeBytes: 2048,
  status,
});

const clipboard = (data: Record<string, string>, files: File[] = []) =>
  ({
    getData: (type: string) => data[type] ?? "",
    files,
  }) as unknown as DataTransfer;

describe("attachment helpers", () => {
  it("formats sizes like Capy", () => {
    expect(formatBytes(22)).toBe("22 B");
    expect(formatBytes(107_520)).toBe("105 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(182e6)).toBe("174 MB");
    expect(formatBytes(-1)).toBe("—");
  });

  it("labels each phase", () => {
    expect(statusLabel(entry({ phase: "uploading" }))).toBe(
      "2.0 KB · Preparing",
    );
    expect(statusLabel(entry({ phase: "uploading", progress: 42 }))).toBe(
      "2.0 KB · 42%",
    );
    expect(statusLabel(entry({ phase: "uploading", progress: 100 }))).toBe(
      "2.0 KB · Finishing",
    );
    expect(statusLabel(entry({ phase: "failed", message: "Empty file" }))).toBe(
      "2.0 KB · Empty file",
    );
    expect(
      statusLabel(
        entry({
          phase: "ready",
          ref: {
            fileId: "f" as never,
            name: "notes.md",
            mediaType: "text/markdown",
            sizeBytes: 2048,
          },
        }),
      ),
    ).toBe("2.0 KB · MD");
    expect(
      statusLabel({
        ...entry({
          phase: "ready",
          ref: {
            fileId: "f" as never,
            name: "LICENSE",
            mediaType: "text/plain",
            sizeBytes: 2048,
          },
        }),
        name: "LICENSE",
        mediaType: "text/plain",
      }),
    ).toBe("2.0 KB · plain");
  });

  it("rejects files in Capy's order", () => {
    expect(rejectReason(0, 0, true)).toBe(attachmentMessages.empty);
    expect(rejectReason(262_144_001, 0, true)).toBe(
      attachmentMessages.tooLarge,
    );
    expect(rejectReason(200e6, 2_000_000_000, true)).toBe(
      attachmentMessages.overTotal,
    );
    expect(rejectReason(10, 0, false)).toBe(attachmentMessages.unavailable);
    expect(rejectReason(10, 0, true)).toBeUndefined();
  });

  it("declares names and media types", () => {
    expect(declareFile(new File(["x"], "photo.HEIC"))).toEqual({
      name: "photo.HEIC",
      mediaType: "image/heic",
      sizeBytes: 1,
    });
    expect(declareFile(new File(["x"], "")).name).toBe("file");
    expect(inferMediaType("data.bin")).toBeUndefined();
    expect(isBrowserRenderable("image/png")).toBe(true);
    expect(isBrowserRenderable("image/heic")).toBe(false);
    expect(isBrowserRenderable("application/pdf")).toBe(true);
  });

  it("pastes spreadsheet cells as text and leaves plain pastes alone", () => {
    const png = new File(["x"], "cells.png", { type: "image/png" });
    expect(
      pastedPlainText(
        clipboard({ "text/plain": "a\tb\r\n", "text/html": "<table>" }),
      ),
    ).toBe("a\tb");
    expect(
      pastedPlainText(
        clipboard({ "text/plain": "a", "text/html": "<p>a</p>" }, [png]),
      ),
    ).toBe("a");
    expect(
      pastedPlainText(
        clipboard({ "text/plain": "a", "text/html": "<p>a</p>" }),
      ),
    ).toBeUndefined();
    expect(
      pastedPlainText(
        clipboard({ "text/plain": "a", "text/html": "<img src=x>" }, [png]),
      ),
    ).toBeUndefined();
    expect(pastedPlainText(clipboard({}, [png]))).toBeUndefined();
  });
});
