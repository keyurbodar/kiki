import { describe, expect, it } from "vitest";
import {
  contentFromBlob,
  decodeMachineFile,
  machineFileGated,
  machineFileMiss,
} from "./machine-file";

describe("decodeMachineFile", () => {
  it("reads a text blob and its sha", () => {
    expect(
      decodeMachineFile({
        content: { content: "hi", sizeBytes: 2, truncated: false },
        sha: "abc",
      }),
    ).toEqual({
      content: {
        content: "hi",
        sizeBytes: 2,
        truncated: false,
        base64: undefined,
        mediaType: undefined,
        binary: undefined,
      },
      sha: "abc",
    });
  });

  it("keeps a missing file as null content", () => {
    expect(decodeMachineFile({ content: null })).toEqual({
      content: null,
      sha: undefined,
    });
  });

  it("rejects shapes it cannot read", () => {
    expect(decodeMachineFile(undefined)).toBeUndefined();
    expect(decodeMachineFile({ sha: "x" })).toBeUndefined();
    expect(decodeMachineFile({ content: "text" })).toBeUndefined();
  });
});

describe("contentFromBlob", () => {
  it("maps text, truncation and binaries", () => {
    expect(
      contentFromBlob({ content: "a", truncated: true }, 9, false, "a.ts"),
    ).toEqual({
      kind: "text",
      text: "a",
      truncatedFrom: 9,
    });
    expect(contentFromBlob({ binary: true }, 9, false, "a.bin")).toEqual({
      kind: "no_preview",
    });
    expect(contentFromBlob({ content: "../b" }, 4, true, "a")).toEqual({
      kind: "symlink",
      target: "../b",
    });
  });

  it("turns base64 images and pdfs into data urls", () => {
    expect(
      contentFromBlob(
        { base64: "AAA", mediaType: "image/png" },
        3,
        false,
        "a.png",
      ),
    ).toEqual({
      kind: "media",
      media: "image",
      url: "data:image/png;base64,AAA",
      label: "a.png",
    });
    expect(
      contentFromBlob(
        { base64: "AAA", mediaType: "application/zip" },
        3,
        false,
        "a.zip",
      ),
    ).toEqual({ kind: "text", text: "", truncatedFrom: undefined });
  });
});

describe("machine file helpers", () => {
  it("gates large text files", () => {
    expect(machineFileGated("src/big.log", { sizeBytes: 5e6 })).toBe(true);
    expect(machineFileGated("src/a.ts", { sizeBytes: 10 })).toBe(false);
  });

  it("explains a missing file", () => {
    expect(machineFileMiss("src/a.ts", false).line).toBe(
      "File isn't on this machine",
    );
    expect(machineFileMiss("/Users/sam/a.ts", false).line).toBe(
      "File is on another machine",
    );
    expect(machineFileMiss("/workspace/a.ts", true).sub).toBe(
      "This path is from the cloud machine this thread used before",
    );
  });
});
