import { afterEach, describe, expect, it, vi } from "vitest";
import type { FileId } from "@/data/api/schemas/files";
import {
  makeUploader,
  simulatedTicks,
  simulateUpload,
  type UploadResult,
} from "./upload";

const item = (name: string, size = 4) => ({
  localId: name,
  file: new File(["x".repeat(size)], name, { type: "text/plain" }),
  declared: { name, mediaType: "text/plain", sizeBytes: size },
  signal: new AbortController().signal,
  onProgress: () => undefined,
});

afterEach(() => vi.useRealTimers());

describe("uploads", () => {
  it("settles every item against its target and flags missing targets", async () => {
    const uploader = makeUploader({
      upload: async () => ({
        targets: [
          {
            fileId: "file_1" as FileId,
            url: "https://uploads.capy.invalid/file_1",
          },
        ],
      }),
      pendingPreview: async () => undefined,
    });
    const results: Array<[number, UploadResult]> = [];
    await uploader([item("a.txt"), item("b.txt")], (index, result) =>
      results.push([index, result]),
    );
    expect(results).toContainEqual([
      0,
      {
        ok: true,
        ref: {
          fileId: "file_1",
          name: "a.txt",
          mediaType: "text/plain",
          sizeBytes: 4,
        },
        previewUrl: undefined,
      },
    ]);
    expect(results).toContainEqual([
      1,
      { ok: false, message: "Upload failed: no target" },
    ]);
  });

  it("simulates progress and the fail fixture", async () => {
    vi.useFakeTimers();
    expect(simulatedTicks(1)).toBe(15);
    const progress: number[] = [];
    const done = simulateUpload(
      1,
      new AbortController().signal,
      (p) => progress.push(p),
      "slow",
    );
    await vi.advanceTimersByTimeAsync(1500);
    await expect(done).resolves.toBeUndefined();
    expect(progress.at(0)).toBe(0);
    expect(progress.at(-1)).toBe(100);

    const failing = simulateUpload(
      1,
      new AbortController().signal,
      () => undefined,
      "fail",
    );
    const settled = expect(failing).rejects.toThrow(
      "Upload failed: network error",
    );
    await vi.advanceTimersByTimeAsync(1500);
    await settled;
  });

  it("resolves at once without a fixture", async () => {
    await expect(
      simulateUpload(
        10,
        new AbortController().signal,
        () => undefined,
        undefined,
      ),
    ).resolves.toBeUndefined();
  });
});
