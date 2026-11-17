import { describe, expect, it } from "vitest";
import { type DriveEntry, folderEntries, resolveScopeFile } from "./resolve";

const artifacts = {
  id: "vol_artifacts",
  namespace: "artifacts",
  name: "artifacts",
  headVersionId: "ver_head",
};
const entry = (path: string): DriveEntry => ({
  path,
  volume: artifacts,
  versionId: "ver_head",
  sha256: "sha",
  sizeBytes: 10,
});
const listing = {
  volumes: [artifacts],
  entries: [entry("notes/a.md"), entry("notes/sub/b.md"), entry("top.md")],
};

describe("folderEntries", () => {
  it("lists folders first, then files, by name", () => {
    expect(folderEntries(listing.entries, "notes/")).toEqual([
      { name: "sub", path: "notes/sub", folder: true },
      { name: "a.md", path: "notes/a.md", folder: false },
    ]);
    expect(folderEntries(listing.entries, "")?.map((e) => e.name)).toEqual([
      "notes",
      "top.md",
    ]);
    expect(folderEntries(listing.entries, "empty")).toBeUndefined();
  });
});

describe("resolveScopeFile", () => {
  const resolve = (
    overrides: Partial<Parameters<typeof resolveScopeFile>[0]>,
  ) =>
    resolveScopeFile({
      listing,
      failed: false,
      path: "top.md",
      version: undefined,
      ...overrides,
    });

  it("opens a pinned version before anything else", () => {
    expect(resolve({ version: "ver_1" })).toMatchObject({
      kind: "version",
      version: "ver_1",
      live: { path: "top.md" },
    });
  });

  it("finds files and folders", () => {
    expect(resolve({}).kind).toBe("file");
    expect(resolve({ path: "notes" }).kind).toBe("folder");
  });

  it("walks the not-found chain", () => {
    expect(resolve({ listing: undefined }).kind).toBe("loading");
    expect(resolve({ path: "gone.md" })).toEqual({
      kind: "missing",
      volumeId: "vol_artifacts",
    });
    expect(resolve({ path: "gone.md", failed: true }).kind).toBe("unavailable");
    expect(
      resolve({ path: "gone.md", listing: { volumes: [], entries: [] } }).kind,
    ).toBe("not-found");
  });
});
