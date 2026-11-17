import { describe, expect, it } from "vitest";
import type { CaptainDrive } from "@/features/captains/overview";
import { resolveCaptainDriveFile } from "./drive-file";

const volume = {
  id: "vol_1",
  namespace: "artifacts",
  name: "artifacts",
  headVersionId: "ver_1",
};
const file = (path: string) => ({
  path,
  volume,
  versionId: "ver_1",
  sha256: "abc",
  sizeBytes: 1,
  updatedAt: null,
});
const drive: CaptainDrive = {
  volume,
  files: [file("notes/a.md"), file("notes/deep/b.md"), file("c.md")],
};

const resolve = (
  path: string,
  options: Partial<Parameters<typeof resolveCaptainDriveFile>[0]> = {},
) =>
  resolveCaptainDriveFile({
    drive,
    failed: false,
    path,
    version: undefined,
    ...options,
  });

describe("resolveCaptainDriveFile", () => {
  it("opens a pinned version before anything else", () => {
    expect(resolve("c.md", { version: "ver_0" })).toMatchObject({
      kind: "version",
      version: "ver_0",
      live: { path: "c.md" },
    });
  });

  it("opens a live file", () => {
    expect(resolve("c.md")).toMatchObject({
      kind: "file",
      entry: { path: "c.md" },
    });
  });

  it("lists a folder, folders first", () => {
    expect(resolve("notes/")).toEqual({
      kind: "folder",
      entries: [
        { name: "deep", path: "notes/deep", folder: true },
        { name: "a.md", path: "notes/a.md", folder: false },
      ],
    });
  });

  it("walks the empty states", () => {
    expect(resolve("x.md", { drive: undefined })).toEqual({ kind: "loading" });
    expect(resolve("x.md", { drive: undefined, failed: true })).toEqual({
      kind: "unavailable",
    });
    expect(resolve("x.md", { drive: null })).toEqual({ kind: "not-found" });
    expect(resolve("x.md")).toEqual({ kind: "missing", volumeId: "vol_1" });
  });
});
