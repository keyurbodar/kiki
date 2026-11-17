import { describe, expect, it } from "vitest";
import {
  changedUnderDraft,
  cleanDraft,
  discardDraft,
  editorStateKey,
  type FileDraft,
  markDirty,
  parentDirectory,
  settleSave,
  sha256Hex,
} from "./draft";

const loaded = {
  path: "notes/plan.md",
  volumeId: "vol_1",
  versionId: "vver_1",
  sizeBytes: 4,
  sha256: "aaa",
};

describe("draft state", () => {
  it("goes dirty once per file", () => {
    const dirty = markDirty(cleanDraft, loaded);
    expect(dirty).toMatchObject({ state: "dirty", path: "notes/plan.md" });
    expect(markDirty(dirty, loaded)).toBe(dirty);
  });

  it("carries the saved digest into the next edit", () => {
    const saved: FileDraft = {
      session: 0,
      state: "saved",
      path: loaded.path,
      sha256: "bbb",
      supersedes: "aaa",
    };
    expect(markDirty(saved, loaded)).toMatchObject({ supersedes: "bbb" });
  });

  it("discards into a new session", () => {
    expect(discardDraft(markDirty(cleanDraft, loaded))).toEqual({
      session: 1,
      state: "clean",
    });
  });

  it("settles saves, staying dirty when edited since", () => {
    const dirty = markDirty(cleanDraft, loaded);
    const base = {
      session: 0,
      path: loaded.path,
      loaded,
      supersedes: undefined,
      sha256: "ccc",
    };
    expect(settleSave(dirty, { ...base, editedSince: false })).toEqual({
      session: 0,
      state: "saved",
      path: loaded.path,
      sha256: "ccc",
      supersedes: "aaa",
    });
    expect(settleSave(dirty, { ...base, editedSince: true })).toMatchObject({
      state: "dirty",
      loaded: { sha256: "ccc" },
      supersedes: "aaa",
    });
    expect(
      settleSave(discardDraft(dirty), { ...base, editedSince: false }),
    ).toEqual({ session: 1, state: "clean" });
  });

  it("detects a file changed under the draft", () => {
    const dirty = markDirty(cleanDraft, loaded);
    expect(changedUnderDraft({ path: loaded.path, sha256: "aaa" }, dirty)).toBe(
      false,
    );
    expect(changedUnderDraft({ path: loaded.path, sha256: "zzz" }, dirty)).toBe(
      true,
    );
  });
});

describe("helpers", () => {
  it("keys editors by org, scope, path and session", () => {
    expect(editorStateKey("org_1", { userId: "u" }, "a.md", 2)).toBe(
      JSON.stringify([
        "volume-editor",
        "org_1",
        undefined,
        "u",
        undefined,
        undefined,
        "a.md",
        2,
      ]),
    );
  });

  it("finds parent folders", () => {
    expect(parentDirectory("a/b/c.md")).toBe("a/b");
    expect(parentDirectory("c.md")).toBe("");
  });

  it("hashes text", async () => {
    expect(await sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });
});
