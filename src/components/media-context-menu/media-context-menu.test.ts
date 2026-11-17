import { describe, expect, it } from "vitest";
import { mediaActions } from "./media-context-menu";

describe("mediaActions", () => {
  it("never offers to copy a video", () => {
    expect(
      mediaActions({ kind: "video", name: "clip.mp4", url: "/clip.mp4" }).copy,
    ).toBeUndefined();
  });

  it("offers no download without a url or blob resolver", () => {
    const actions = mediaActions({ kind: "image", name: "shot.png" });
    expect(actions.copy).toBeUndefined();
    expect(actions.download).toBeUndefined();
  });

  it("offers copy and download for an image with a url", () => {
    const actions = mediaActions({
      kind: "image",
      name: "shot.png",
      url: "/shot.png",
    });
    expect(actions.copy).toBeTypeOf("function");
    expect(actions.download).toBeTypeOf("function");
  });

  it("offers both actions for an image with a blob resolver", () => {
    const resolveBlob = async () => new Blob(["x"], { type: "image/png" });
    const actions = mediaActions({
      kind: "image",
      name: "shot.png",
      resolveBlob,
    });
    expect(actions.copy).toBeTypeOf("function");
    expect(actions.download).toBeTypeOf("function");
  });
});
