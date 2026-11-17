import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { FileId } from "@/data/api/schemas/files";
import { makeUploader } from "./upload";
import { useComposerAttachments } from "./use-composer-attachments";

const uploader = makeUploader({
  upload: async (files) => ({
    targets: files.map((_, index) => ({
      fileId: `file_${index}` as FileId,
      url: `https://uploads.capy.invalid/file_${index}`,
    })),
  }),
  pendingPreview: async () => undefined,
});

const file = (name: string, body = "hello") =>
  new File([body], name, { type: "text/plain" });

describe("useComposerAttachments", () => {
  it("uploads added files to ready and hands back their refs", async () => {
    const { result } = renderHook(() => useComposerAttachments(uploader));
    act(() => result.current.add([file("a.txt"), file("b.txt")]));
    expect(result.current.uploading).toBe(true);
    await waitFor(() => expect(result.current.uploading).toBe(false));
    expect(result.current.entries.map((e) => e.status.phase)).toEqual([
      "ready",
      "ready",
    ]);
    expect(result.current.getReadyRefs().map((ref) => ref.name)).toEqual([
      "a.txt",
      "b.txt",
    ]);
  });

  it("fails empty files and every file without an uploader", () => {
    const { result } = renderHook(() => useComposerAttachments(undefined));
    act(() => result.current.add([file("empty.txt", ""), file("a.txt")]));
    expect(result.current.entries.map((e) => e.status)).toEqual([
      { phase: "failed", message: "Empty file" },
      { phase: "failed", message: "Upload unavailable" },
    ]);
  });

  it("removes, clears sent entries and restores refs", async () => {
    const { result } = renderHook(() => useComposerAttachments(uploader));
    act(() => result.current.add([file("a.txt"), file("", "")]));
    await waitFor(() => expect(result.current.uploading).toBe(false));
    act(() => result.current.clearSent());
    expect(result.current.entries.map((e) => e.name)).toEqual(["file"]);
    act(() => result.current.remove(result.current.entries[0]?.localId ?? ""));
    expect(result.current.entries).toEqual([]);
    act(() =>
      result.current.restore([
        {
          fileId: "file_9" as FileId,
          name: "kept.txt",
          mediaType: "text/plain",
          sizeBytes: 5,
        },
      ]),
    );
    expect(result.current.getReadyRefs().map((ref) => ref.fileId)).toEqual([
      "file_9",
    ]);
    act(() => result.current.reset());
    expect(result.current.entries).toEqual([]);
  });
});
